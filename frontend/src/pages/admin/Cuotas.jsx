import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import Badge from '../../components/Badge';
import { useAvisos } from '../../components/Avisos';
import { MESES, moneda, fecha, periodo } from '../../utils/formato';
import { descargarComprobante } from '../../utils/comprobante';

const campo = 'w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all';
const etiqueta = 'block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5 ml-1';
const filtroCls = 'border border-zinc-200 dark:border-zinc-700 rounded-xl p-2 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500';

export default function Cuotas() {
  const { confirmar, aviso } = useAvisos();
  const hoy = new Date();

  const [filtros, setFiltros] = useState({
    mes: String(hoy.getMonth() + 1), anio: String(hoy.getFullYear()), estado: '',
  });
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [gen, setGen] = useState({
    mes: hoy.getMonth() + 1, anio: hoy.getFullYear(), valor: '', fechaVencimiento: '', concepto: '',
  });
  const [mensaje, setMensaje] = useState(null);

  // ----- Cuota a propietarios específicos -----
  const [modal, setModal] = useState(false);
  const [esp, setEsp] = useState(null);
  const [propietarios, setPropietarios] = useState([]);
  const [seleccion, setSeleccion] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [errorEsp, setErrorEsp] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function cargar() {
    setCargando(true);
    const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
    const { data } = await api.get('/cuotas', { params });
    setLista(data);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, [filtros]);

  // Muestra el mes recién creado: si ya estaba filtrado solo recarga, si no cambia el filtro
  function mostrarPeriodo(mes, anio) {
    if (filtros.mes === String(mes) && filtros.anio === String(anio)) cargar();
    else setFiltros({ ...filtros, mes: String(mes), anio: String(anio) });
  }

  async function generar(e) {
    e.preventDefault();
    setMensaje(null);
    try {
      const { data } = await api.post('/cuotas/generar', gen);
      setMensaje({ tipo: 'ok', texto: `Cuotas creadas: ${data.creadas}. Ya existentes (omitidas): ${data.omitidas}.` });
      mostrarPeriodo(gen.mes, gen.anio);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.error || 'No se pudo generar' });
    }
  }

  async function pagoManual(c) {
    const ok = await confirmar({
      tipo: 'exito',
      titulo: 'Registrar pago en efectivo',
      mensaje: 'La cuota quedará marcada como pagada.',
      detalle: [
        { etiqueta: 'Propietario', valor: c.propietario.usuario.nombre },
        { etiqueta: 'Casa / Lote', valor: c.propietario.casaLote },
        { etiqueta: 'Periodo', valor: periodo(c) },
        { etiqueta: 'Valor', valor: moneda(c.valor) },
      ],
      confirmarTexto: 'Registrar pago',
    });
    if (!ok) return;
    try {
      await api.post('/pagos/manual', { cuotaId: c.id, metodo: 'EFECTIVO' });
      aviso.exito('¡Pago registrado!', { mensaje: `${c.propietario.casaLote} · ${periodo(c)} quedó como pagada.` });
      cargar();
    } catch (err) {
      aviso.error('No se pudo registrar el pago', { mensaje: err.response?.data?.error });
    }
  }

  // Descarga el comprobante de una cuota pagada (sirve también para pagos en efectivo)
  async function descargarRecibo(c) {
    const pago = c.pagos.find((p) => p.estado === 'APROBADO');
    if (!pago) return aviso.error('Esta cuota no tiene un pago aprobado');
    try {
      await descargarComprobante({
        estado: 'pagado',
        numero: `RC-${String(pago.id).padStart(6, '0')}`,
        propietario: {
          nombre: c.propietario.usuario.nombre,
          documento: c.propietario.documento,
          casaLote: c.propietario.casaLote,
        },
        concepto: c.concepto,
        periodo: periodo(c),
        valor: pago.valor,
        metodo: pago.metodo,
        fechaPago: pago.fechaPago,
        fechaValidacion: pago.validadoEn,
      });
      aviso.exito('Comprobante descargado', { mensaje: `${c.propietario.casaLote} · ${periodo(c)}` });
    } catch {
      aviso.error('No se pudo crear el comprobante');
    }
  }

  async function abrirModal() {
    setEsp({ ...gen });
    setSeleccion([]);
    setBusqueda('');
    setErrorEsp('');
    setModal(true);
    try {
      const { data } = await api.get('/propietarios');
      setPropietarios(data.filter((p) => p.usuario.activo && p.estado !== 'INACTIVO'));
    } catch {
      setErrorEsp('No se pudo cargar la lista de propietarios');
    }
  }

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return propietarios.filter((p) => `${p.usuario.nombre} ${p.casaLote} ${p.documento}`.toLowerCase().includes(q));
  }, [propietarios, busqueda]);

  const alternar = (id) =>
    setSeleccion((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const seleccionarVisibles = () =>
    setSeleccion((s) => [...new Set([...s, ...visibles.map((p) => p.id)])]);

  async function crearEspecificas(e) {
    e.preventDefault();
    if (seleccion.length === 0) return setErrorEsp('Selecciona al menos un propietario');
    setEnviando(true);
    setErrorEsp('');
    try {
      const { data } = await api.post('/cuotas/generar', { ...esp, propietarioIds: seleccion });
      setModal(false);

      const nombrePeriodo = `${MESES[esp.mes - 1]} ${esp.anio}`;
      if (data.creadas > 0) {
        aviso.exito(data.creadas === 1 ? 'Cuota creada' : `${data.creadas} cuotas creadas`, {
          mensaje: `${nombrePeriodo} · ${moneda(esp.valor)} por propietario.`,
        });
      }
      if (data.omitidas > 0) {
        aviso.alerta(
          data.omitidas === 1 ? '1 propietario ya tenía cuota' : `${data.omitidas} propietarios ya tenían cuota`,
          { mensaje: `No se duplicaron: ya existía la cuota de ${nombrePeriodo}.` }
        );
      }
      mostrarPeriodo(esp.mes, esp.anio);
    } catch (err) {
      setErrorEsp(err.response?.data?.error || 'No se pudieron crear las cuotas');
    } finally {
      setEnviando(false);
    }
  }

  const cambiarGen = (k) => (e) => setGen({ ...gen, [k]: e.target.value });
  const cambiarEsp = (k) => (e) => setEsp({ ...esp, [k]: e.target.value });
  const cambiarFiltro = (k) => (e) => setFiltros({ ...filtros, [k]: e.target.value });

  const recaudado = lista.filter((c) => c.estado === 'PAGADA').reduce((s, c) => s + Number(c.valor), 0);
  const porCobrar = lista.filter((c) => c.estado !== 'PAGADA').reduce((s, c) => s + Number(c.valor), 0);

  return (
    <div className="space-y-6 font-sans text-zinc-800 dark:text-zinc-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Cuotas de administración</h1>
        <button
          onClick={abrirModal}
          className="bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors"
        >
          + Cuota a propietarios específicos
        </button>
      </div>

      <form onSubmit={generar} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
        <div>
          <label className={etiqueta}>Mes</label>
          <select value={gen.mes} onChange={cambiarGen('mes')} className={campo}>
            {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className={etiqueta}>Año</label>
          <input type="number" value={gen.anio} onChange={cambiarGen('anio')} className={campo} required />
        </div>
        <div>
          <label className={etiqueta}>Valor (COP)</label>
          <input type="number" min="1" value={gen.valor} onChange={cambiarGen('valor')} className={campo} required />
        </div>
        <div>
          <label className={etiqueta}>Vence el</label>
          <input type="date" value={gen.fechaVencimiento} onChange={cambiarGen('fechaVencimiento')} className={campo} required />
        </div>
        <div>
          <label className={etiqueta}>Concepto</label>
          <input value={gen.concepto} onChange={cambiarGen('concepto')} placeholder="Opcional" className={campo} />
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-2.5 text-sm font-bold shadow-sm transition-all h-[42px]">
          Generar masivo
        </button>
        {mensaje && (
          <p className={`sm:col-span-2 lg:col-span-6 text-sm p-3 rounded-xl font-medium ${mensaje.tipo === 'ok' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50'}`}>
            {mensaje.texto}
          </p>
        )}
      </form>

      <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <select value={filtros.mes} onChange={cambiarFiltro('mes')} className={filtroCls}>
          <option value="">Todos los meses</option>
          {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" value={filtros.anio} onChange={cambiarFiltro('anio')} className={`${filtroCls} w-28`} />
        <select value={filtros.estado} onChange={cambiarFiltro('estado')} className={filtroCls}>
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="VENCIDA">Vencida</option>
          <option value="PAGADA">Pagada</option>
        </select>
        <div className="ml-auto text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Recaudado: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{moneda(recaudado)}</span> <span className="mx-2 text-zinc-300 dark:text-zinc-700">|</span> Por cobrar: <span className="text-rose-600 dark:text-rose-400 font-bold">{moneda(porCobrar)}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-left text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider font-bold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-4">Casa / Lote</th><th className="p-4">Propietario</th><th className="p-4">Periodo</th>
                <th className="p-4">Valor</th><th className="p-4">Vence</th><th className="p-4">Estado</th><th className="p-4">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {cargando && <tr><td colSpan="7" className="p-8 text-center text-zinc-500 dark:text-zinc-400 font-medium">Cargando...</td></tr>}
              {!cargando && lista.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-zinc-500 dark:text-zinc-400 font-medium">No hay cuotas con esos filtros</td></tr>}
              {lista.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">{c.propietario.casaLote}</td>
                  <td className="p-4 font-medium text-zinc-700 dark:text-zinc-300">{c.propietario.usuario.nombre}</td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-400">{periodo(c)}</td>
                  <td className="p-4 font-medium text-zinc-900 dark:text-zinc-100">{moneda(c.valor)}</td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-400">{fecha(c.fechaVencimiento)}</td>
                  <td className="p-4"><Badge estado={c.estado} /></td>
                  <td className="p-4">
                    {c.estado !== 'PAGADA' && (
                      <button onClick={() => pagoManual(c)} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors whitespace-nowrap">
                        Registrar pago
                      </button>
                    )}
                    {c.estado === 'PAGADA' && (
                      <button onClick={() => descargarRecibo(c)} className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors whitespace-nowrap">
                        Comprobante
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && esp && (
        <div className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-aparecer">
          <form onSubmit={crearEspecificas} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-2xl p-7 w-full max-w-2xl max-h-[92vh] overflow-y-auto animate-subir">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">Cuota a propietarios específicos</h2>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1 mb-6">
              Elige uno o varios propietarios. Solo se crea la cuota para ellos.
            </p>

            {errorEsp && (
              <div className="mb-5 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-sm font-medium p-3 rounded-xl">{errorEsp}</div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className={etiqueta}>Mes</label>
                <select value={esp.mes} onChange={cambiarEsp('mes')} className={campo}>
                  {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={etiqueta}>Año</label>
                <input type="number" value={esp.anio} onChange={cambiarEsp('anio')} className={campo} required />
              </div>
              <div>
                <label className={etiqueta}>Valor (COP)</label>
                <input type="number" min="1" value={esp.valor} onChange={cambiarEsp('valor')} className={campo} required />
              </div>
              <div>
                <label className={etiqueta}>Vence el</label>
                <input type="date" value={esp.fechaVencimiento} onChange={cambiarEsp('fechaVencimiento')} className={campo} required />
              </div>
              <div className="col-span-2 md:col-span-4">
                <label className={etiqueta}>Concepto (opcional)</label>
                <input value={esp.concepto} onChange={cambiarEsp('concepto')} placeholder="Cuota de administración" className={campo} />
              </div>
            </div>

            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className={`${etiqueta} mb-0`}>Propietarios</label>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <button type="button" onClick={seleccionarVisibles} className="text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-2">Seleccionar visibles</button>
                  <button type="button" onClick={() => setSeleccion([])} className="text-zinc-500 dark:text-zinc-400 hover:underline underline-offset-2">Quitar selección</button>
                </div>
              </div>
              <input
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, casa o documento..."
                className={`${campo} mb-2`}
              />
              <ul className="max-h-56 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700 divide-y divide-zinc-100 dark:divide-zinc-800">
                {visibles.length === 0 && (
                  <li className="p-4 text-sm text-center text-zinc-500 dark:text-zinc-400 font-medium">No hay propietarios para mostrar</li>
                )}
                {visibles.map((p) => {
                  const marcado = seleccion.includes(p.id);
                  return (
                    <li key={p.id}>
                      <label className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${marcado ? 'bg-indigo-50 dark:bg-indigo-950/30' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'}`}>
                        <input type="checkbox" checked={marcado} onChange={() => alternar(p.id)} className="w-4 h-4 accent-indigo-600" />
                        <span className="min-w-0 flex-1">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate">{p.casaLote}</span>
                          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block truncate">{p.usuario.nombre}</span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                {seleccion.length} seleccionado(s)
                {seleccion.length > 0 && Number(esp.valor) > 0 && (
                  <> · Total a facturar: <span className="text-zinc-900 dark:text-zinc-100">{moneda(Number(esp.valor) * seleccion.length)}</span></>
                )}
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-7">
              <button type="button" onClick={() => setModal(false)} className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm">Cancelar</button>
              <button disabled={enviando || seleccion.length === 0} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {enviando ? 'Creando...' : `Crear cuota${seleccion.length === 1 ? '' : 's'}${seleccion.length ? ` (${seleccion.length})` : ''}`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
