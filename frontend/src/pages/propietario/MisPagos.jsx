import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Badge from '../../components/Badge';
import { useAvisos } from '../../components/Avisos';
import { moneda, fecha, periodo } from '../../utils/formato';
import { urlArchivo } from '../../services/archivos';
import { descargarComprobante, crearArchivoResumen } from '../../utils/comprobante';

export default function MisPagos() {
  const { aviso } = useAvisos();
  const [cuotas, setCuotas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cuotaPago, setCuotaPago] = useState(null);
  const [metodo, setMetodo] = useState('TRANSFERENCIA');
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [perfil, setPerfil] = useState(null);          // datos del propietario para el comprobante
  const [vistaResumen, setVistaResumen] = useState(null); // vista previa del resumen generado
  const [claveInput, setClaveInput] = useState(0);     // reinicia el selector de archivo

  async function cargar() {
    const { data } = await api.get('/cuotas/mias');
    setCuotas(data);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    api.get('/propietarios/yo').then(({ data }) => setPerfil(data)).catch(() => {});
  }, []);

  function abrirPago(c) {
    setCuotaPago(c);
    setMetodo('TRANSFERENCIA');
    setArchivo(null);
    setVistaResumen(null);
    setClaveInput((k) => k + 1);
    setError('');
  }

  async function enviarPago(e) {
    e.preventDefault();
    if (!archivo) return setError('Adjunta el comprobante');
    setEnviando(true);
    setError('');
    try {
      const datos = new FormData();
      datos.append('cuotaId', cuotaPago.id);
      datos.append('metodo', metodo);
      datos.append('comprobante', archivo);
      await api.post('/pagos', datos);
      aviso.exito('¡Pago enviado!', {
        mensaje: `Tu comprobante de ${periodo(cuotaPago)} quedó en revisión. Te avisaremos cuando la administración lo valide.`,
        duracion: 6500,
      });
      setCuotaPago(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo enviar el pago');
    } finally {
      setEnviando(false);
    }
  }

  const datosPropietario = () => ({
    nombre: perfil.usuario.nombre,
    documento: perfil.documento,
    casaLote: perfil.casaLote,
  });

  // Descarga el comprobante de un pago ya aprobado
  async function descargarRecibo(cuota, pago) {
    if (!perfil) {
      return aviso.error('Aún se están cargando tus datos', { mensaje: 'Intenta de nuevo en un momento.' });
    }
    try {
      await descargarComprobante({
        estado: 'pagado',
        numero: `RC-${String(pago.id).padStart(6, '0')}`,
        propietario: datosPropietario(),
        concepto: cuota.concepto,
        periodo: periodo(cuota),
        valor: pago.valor,
        metodo: pago.metodo,
        fechaPago: pago.fechaPago,
        fechaValidacion: pago.validadoEn,
      });
      aviso.exito('Comprobante descargado', { mensaje: `${periodo(cuota)} · ${moneda(pago.valor)}` });
    } catch {
      aviso.error('No se pudo crear el comprobante');
    }
  }

  // Crea una imagen-resumen con los datos de la cuota y la adjunta al pago
  async function generarResumen() {
    if (!perfil) return setError('Aún se están cargando tus datos. Intenta de nuevo en un momento.');
    try {
      const archivoResumen = await crearArchivoResumen({
        numero: `REF-${cuotaPago.id}-${Date.now().toString(36).toUpperCase()}`,
        propietario: datosPropietario(),
        concepto: cuotaPago.concepto,
        periodo: periodo(cuotaPago),
        valor: cuotaPago.valor,
        metodo,
        fechaPago: new Date(),
      });
      setError('');
      setArchivo(archivoResumen);
      setClaveInput((k) => k + 1); // limpia el selector para que no confunda
      setVistaResumen((anterior) => {
        if (anterior) URL.revokeObjectURL(anterior);
        return URL.createObjectURL(archivoResumen);
      });
    } catch {
      setError('No se pudo generar el resumen');
    }
  }

  function quitarResumen() {
    setArchivo(null);
    setVistaResumen((anterior) => {
      if (anterior) URL.revokeObjectURL(anterior);
      return null;
    });
  }

  const historial = cuotas
    .flatMap((c) => c.pagos.map((p) => ({ ...p, cuota: c })))
    .sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago));

  return (
    <div className="space-y-8 font-sans text-zinc-800 dark:text-zinc-200">
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">Mis cuotas</h1>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Periodo</th><th className="p-4">Valor</th><th className="p-4">Vence</th>
                  <th className="p-4">Estado</th><th className="p-4">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {cargando && <tr><td colSpan="5" className="p-6 text-center text-zinc-500 dark:text-zinc-400 font-medium">Cargando...</td></tr>}
                {!cargando && cuotas.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-zinc-500 dark:text-zinc-400 font-medium">Aún no tienes cuotas generadas</td></tr>}
                {cuotas.map((c) => {
                  const enRevision = c.pagos.some((p) => p.estado === 'EN_REVISION');
                  const aprobado = c.pagos.find((p) => p.estado === 'APROBADO');
                  return (
                    <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">{periodo(c)}</td>
                      <td className="p-4 font-medium">{moneda(c.valor)}</td>
                      <td className="p-4 text-zinc-500 dark:text-zinc-400">{fecha(c.fechaVencimiento)}</td>
                      <td className="p-4"><Badge estado={enRevision ? 'EN_REVISION' : c.estado} /></td>
                      <td className="p-4">
                        {c.estado !== 'PAGADA' && !enRevision && (
                          <button onClick={() => abrirPago(c)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-colors">
                            Pagar
                          </button>
                        )}
                        {c.estado === 'PAGADA' && aprobado && (
                          <button onClick={() => descargarRecibo(c, aprobado)} className="border border-indigo-200 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-4 py-1.5 rounded-xl text-xs font-bold transition-colors">
                            Comprobante
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">Historial de pagos</h2>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Fecha</th><th className="p-4">Periodo</th><th className="p-4">Valor</th>
                  <th className="p-4">Método</th><th className="p-4">Comprobante</th><th className="p-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {historial.length === 0 && <tr><td colSpan="6" className="p-6 text-center text-zinc-500 dark:text-zinc-400 font-medium">Sin pagos registrados</td></tr>}
                {historial.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="p-4 text-zinc-500 dark:text-zinc-400">{fecha(p.fechaPago)}</td>
                    <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">{periodo(p.cuota)}</td>
                    <td className="p-4 font-medium">{moneda(p.valor)}</td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-300">{p.metodo}</td>
                    <td className="p-4">
                      {p.comprobanteUrl
                        ? <a href={urlArchivo(p.comprobanteUrl)} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold underline underline-offset-2">Ver</a>
                        : '-'}
                    </td>
                    <td className="p-4">
                      <Badge estado={p.estado} />
                      {p.estado === 'APROBADO' && (
                        <button onClick={() => descargarRecibo(p.cuota, p)} className="block mt-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline underline-offset-2">
                          Descargar comprobante
                        </button>
                      )}
                      {p.estado === 'RECHAZADO' && p.observacion && (
                        <div className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-1.5 max-w-xs leading-relaxed">Motivo: {p.observacion}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {cuotaPago && (
        <div className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={enviarPago} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div>
              <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Pagar {periodo(cuotaPago)}</h2>
              <p className="text-3xl font-black text-indigo-700 dark:text-indigo-400 mt-1">{moneda(cuotaPago.valor)}</p>
            </div>
            {error && <p className="bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-sm p-3 rounded-xl font-medium">{error}</p>}

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Método de pago</label>
              <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="CONSIGNACION">Consignación</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Comprobante (imagen o PDF, máx. 5 MB)</label>
              <input
                key={claveInput} type="file" accept="image/*,.pdf"
                onChange={(e) => { setArchivo(e.target.files[0] || null); setVistaResumen(null); }}
                className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl p-2 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 dark:file:bg-indigo-950/60 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 transition-all outline-none"
              />
            </div>

            <div className="rounded-xl border border-dashed border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 space-y-3">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
                ¿No tienes el soporte del banco a la mano? Genera un <b>resumen de pago</b> con los datos de esta cuota y adjúntalo.
                No reemplaza el soporte bancario: la administración lo valida contra su cuenta.
              </p>
              <button
                type="button" onClick={generarResumen}
                className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-50 dark:hover:bg-zinc-700 transition-colors"
              >
                Generar y adjuntar resumen
              </button>
              {vistaResumen && (
                <div className="flex items-center gap-3">
                  <img src={vistaResumen} alt="Vista previa del resumen" className="w-14 h-[70px] object-cover object-top rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm" />
                  <div className="text-xs">
                    <p className="font-bold text-emerald-700 dark:text-emerald-400">Resumen adjuntado</p>
                    <button type="button" onClick={quitarResumen} className="font-semibold text-zinc-500 dark:text-zinc-400 underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-200">Quitar</button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setCuotaPago(null)} className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
              <button disabled={enviando} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {enviando ? 'Enviando...' : 'Enviar pago'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}