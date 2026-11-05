import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Badge from '../../components/Badge';
import { useAvisos } from '../../components/Avisos';
import { moneda, fecha, periodo } from '../../utils/formato';
import { urlArchivo } from '../../services/archivos';

export default function Pagos() {
  const { confirmar, pedirTexto, aviso } = useAvisos();
  const [estado, setEstado] = useState('EN_REVISION');
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    setCargando(true);
    const { data } = await api.get('/pagos', { params: estado ? { estado } : {} });
    setLista(data);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, [estado]);

  async function revisar(pago, decision) {
    const casa = pago.cuota.propietario.casaLote;
    const mes = periodo(pago.cuota);
    const detalle = [
      { etiqueta: 'Propietario', valor: pago.cuota.propietario.usuario.nombre },
      { etiqueta: 'Casa / Lote', valor: casa },
      { etiqueta: 'Periodo', valor: mes },
      { etiqueta: 'Valor', valor: moneda(pago.valor) },
    ];

    let observacion;
    if (decision === 'RECHAZADO') {
      observacion = await pedirTexto({
        tipo: 'peligro',
        titulo: 'Rechazar pago',
        mensaje: 'El propietario verá este motivo en su historial de pagos.',
        detalle,
        etiqueta: 'Motivo del rechazo',
        placeholder: 'Ej: El comprobante no es legible o el valor no coincide',
        confirmarTexto: 'Rechazar pago',
      });
      if (!observacion) return;
    } else {
      const ok = await confirmar({
        tipo: 'exito',
        titulo: 'Aprobar este pago',
        mensaje: 'La cuota quedará marcada como pagada.',
        detalle,
        confirmarTexto: 'Sí, aprobar',
      });
      if (!ok) return;
    }

    try {
      await api.patch(`/pagos/${pago.id}/revisar`, { decision, observacion });
      if (decision === 'APROBADO') {
        aviso.exito('¡Pago aprobado!', { mensaje: `${casa} · ${mes} quedó como pagada.` });
      } else {
        aviso.alerta('Pago rechazado', { mensaje: `${casa} · ${mes}. El propietario verá el motivo.` });
      }
      cargar();
    } catch (err) {
      aviso.error('No se pudo procesar el pago', { mensaje: err.response?.data?.error });
    }
  }

  return (
    <div className="font-sans text-zinc-800 dark:text-zinc-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Pagos recibidos</h1>
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm">
          <option value="EN_REVISION">Por revisar</option>
          <option value="APROBADO">Aprobados</option>
          <option value="RECHAZADO">Rechazados</option>
          <option value="">Todos</option>
        </select>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-left text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider font-bold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-4">Fecha</th><th className="p-4">Casa / Propietario</th><th className="p-4">Periodo</th>
                <th className="p-4">Valor</th><th className="p-4">Método</th><th className="p-4">Comprobante</th>
                <th className="p-4">Estado</th><th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {cargando && <tr><td colSpan="8" className="p-8 text-center text-zinc-500 dark:text-zinc-400 font-medium">Cargando...</td></tr>}
              {!cargando && lista.length === 0 && <tr><td colSpan="8" className="p-8 text-center text-zinc-500 dark:text-zinc-400 font-medium">No hay pagos en esta vista</td></tr>}
              {lista.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="p-4 text-zinc-600 dark:text-zinc-400 font-medium">{fecha(p.fechaPago)}</td>
                  <td className="p-4">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{p.cuota.propietario.casaLote}</span>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{p.cuota.propietario.usuario.nombre}</span>
                  </td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-400">{periodo(p.cuota)}</td>
                  <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">{moneda(p.valor)}</td>
                  <td className="p-4">
                    <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-zinc-200/50 dark:border-zinc-700/50">{p.metodo}</span>
                  </td>
                  <td className="p-4">
                    {p.comprobanteUrl
                      ? <a href={urlArchivo(p.comprobanteUrl)} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 underline underline-offset-2">Ver archivo</a>
                      : <span className="text-zinc-300 dark:text-zinc-700">-</span>}
                  </td>
                  <td className="p-4">
                    <Badge estado={p.estado} />
                    {p.observacion && <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-[12rem] bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">{p.observacion}</div>}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    {p.estado === 'EN_REVISION' && (
                      <div className="flex items-center gap-3">
                        <button onClick={() => revisar(p, 'APROBADO')} className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/50 transition-colors">Aprobar</button>
                        <button onClick={() => revisar(p, 'RECHAZADO')} className="text-sm font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/50 transition-colors">Rechazar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
