import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { api } from '../../services/api';
import Badge from '../../components/Badge';
import { useAvisos } from '../../components/Avisos';
import { hoy, fechaCO, horaCO } from '../../utils/formato';
import { compartirPase, descargarPase } from '../../utils/pase';

const VACIO = { nombre: '', documento: '', placa: '', fechaVisita: '', motivo: '' };

export default function MisVisitantes() {
  const { confirmar, aviso } = useAvisos();
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [verQr, setVerQr] = useState(null);
  const [preparando, setPreparando] = useState(false);

  async function cargar() {
    const { data } = await api.get('/visitantes/mios');
    setLista(data);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  function abrirNuevo() {
    setForm({ ...VACIO, fechaVisita: hoy() });
    setError('');
  }

  async function guardar(e) {
    e.preventDefault();
    setError(''); setEnviando(true);
    try {
      const { data } = await api.post('/visitantes', form);
      setForm(null);
      setVerQr(data);
      aviso.exito('Visitante registrado', { mensaje: 'Ya puedes enviarle su pase por WhatsApp.' });
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar');
    } finally {
      setEnviando(false);
    }
  }

  async function cancelar(v) {
    const ok = await confirmar({
      tipo: 'peligro',
      titulo: 'Cancelar visita',
      mensaje: 'El código del visitante dejará de funcionar en la portería.',
      detalle: [
        { etiqueta: 'Visitante', valor: v.nombre },
        { etiqueta: 'Fecha', valor: fechaCO(v.fechaVisita) },
      ],
      confirmarTexto: 'Sí, cancelar visita',
      cancelarTexto: 'Volver',
    });
    if (!ok) return;
    try {
      await api.patch(`/visitantes/${v.id}/cancelar`);
      aviso.alerta('Visita cancelada', { mensaje: `La visita de ${v.nombre} fue cancelada.` });
      cargar();
    } catch (err) {
      aviso.error('No se pudo cancelar', { mensaje: err.response?.data?.error });
    }
  }

  async function descargar(v) {
    try {
      await descargarPase(v);
    } catch {
      aviso.error('No se pudo crear la imagen del pase');
    }
  }

  async function compartir(v) {
    setPreparando(true);
    try {
      const resultado = await compartirPase(v);
      if (resultado === 'copiado') {
        aviso.info('Imagen del pase copiada', {
          mensaje: 'En WhatsApp elige el contacto y pégala en el chat con Ctrl + V.',
          duracion: 9000,
        });
      } else if (resultado === 'descargado') {
        aviso.info('Pase descargado', {
          mensaje: 'Tu navegador no permite copiar imágenes. Adjunta el archivo descargado en el chat de WhatsApp.',
          duracion: 9000,
        });
      }
    } catch {
      aviso.error('No se pudo preparar el pase para enviarlo');
    } finally {
      setPreparando(false);
    }
  }

  const cambiar = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="font-sans text-zinc-800 dark:text-zinc-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Mis visitantes</h1>
        <button onClick={abrirNuevo} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors">
          + Registrar visitante
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="p-4">Fecha</th><th className="p-4">Visitante</th><th className="p-4">Placa</th>
                <th className="p-4">Estado</th><th className="p-4">Entrada / Salida</th><th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {cargando && <tr><td colSpan="6" className="p-6 text-center text-zinc-500 dark:text-zinc-400 font-medium">Cargando...</td></tr>}
              {!cargando && lista.length === 0 && <tr><td colSpan="6" className="p-6 text-center text-zinc-500 dark:text-zinc-400 font-medium">Aún no has registrado visitantes</td></tr>}
              {lista.map((v) => (
                <tr key={v.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="p-4 text-zinc-500 dark:text-zinc-400">{fechaCO(v.fechaVisita)}</td>
                  <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">{v.nombre}<div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">CC {v.documento}</div></td>
                  <td className="p-4 font-medium">{v.placa || '-'}</td>
                  <td className="p-4"><Badge estado={v.estado} /></td>
                  <td className="p-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400">{horaCO(v.horaIngreso)} / {horaCO(v.horaSalida)}</td>
                  <td className="p-4 whitespace-nowrap">
                    {v.estado === 'PROGRAMADA' && (
                      <div className="flex gap-3">
                        <button onClick={() => setVerQr(v)} className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline underline-offset-2 transition-all">Ver QR</button>
                        <button onClick={() => cancelar(v)} className="font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline underline-offset-2 transition-all">Cancelar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={guardar} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Registrar visitante</h2>
            {error && <p className="bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-sm p-3 rounded-xl font-medium">{error}</p>}

            <div className="space-y-3">
              <input placeholder="Nombre del visitante" value={form.nombre} onChange={cambiar('nombre')} className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" required />
              <input placeholder="Documento (cédula)" value={form.documento} onChange={cambiar('documento')} className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" required />
              <input placeholder="Placa del vehículo (opcional)" value={form.placa} onChange={cambiar('placa')} className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Fecha de la visita</label>
                <input type="date" min={hoy()} value={form.fechaVisita} onChange={cambiar('fechaVisita')} className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" required />
              </div>
              <input placeholder="Motivo (opcional)" value={form.motivo} onChange={cambiar('motivo')} className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setForm(null)} className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
              <button disabled={enviando} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {enviando ? 'Guardando...' : 'Generar QR'}
              </button>
            </div>
          </form>
        </div>
      )}

      {verQr && (
        <div className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl max-h-[95vh] overflow-y-auto">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mb-6">Pase de visitante</h2>
            <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700 inline-block mb-6">
              <QRCodeCanvas id="qr-canvas" value={verQr.codigoQr} size={200} includeMargin />
            </div>
            {/* QR grande y oculto: se usa para armar la imagen que se envía por WhatsApp */}
            <QRCodeCanvas id="qr-pase" value={verQr.codigoQr} size={720} style={{ display: 'none' }} />

            <p className="text-3xl font-mono font-black tracking-widest text-indigo-700 dark:text-indigo-400 mb-2">{verQr.codigoQr}</p>
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{verQr.nombre} <span className="text-zinc-400 dark:text-zinc-500 font-medium">· {fechaCO(verQr.fechaVisita)}</span></p>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-2 bg-zinc-50 dark:bg-zinc-800 py-1.5 px-3 rounded-lg inline-block">Válido solo el día de la visita.</p>
            <div className="flex flex-col gap-2 mt-8">
              <button
                onClick={() => compartir(verQr)}
                disabled={preparando}
                className="w-full px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm shadow-sm transition-colors disabled:opacity-60"
              >
                {preparando ? 'Preparando pase...' : 'Enviar QR por WhatsApp'}
              </button>
              <button onClick={() => descargar(verQr)} className="w-full px-5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Descargar pase (imagen)</button>
              <button onClick={() => setVerQr(null)} className="w-full px-5 py-3 rounded-xl font-bold text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors mt-2">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
