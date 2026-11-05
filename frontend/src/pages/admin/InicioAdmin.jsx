import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MESES, moneda, fecha } from '../../utils/formato';

const ALTO_GRAFICA = 160;

export default function InicioAdmin() {
  const { usuario } = useAuth();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  async function cargar() {
    try {
      const { data } = await api.get('/dashboard');
      setD(data);
      setError('');
    } catch {
      setError('No se pudo cargar el resumen');
    }
  }

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 60000);
    return () => clearInterval(t);
  }, []);

  if (error && !d) return <p className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 p-4 rounded-2xl font-medium border border-rose-100 dark:border-rose-900/50">{error}</p>;
  if (!d) return <p className="text-zinc-500 dark:text-zinc-400 font-medium animate-pulse">Cargando resumen del sistema...</p>;

  const sinCuotas = d.mes.facturado === 0;

  return (
    <div className="space-y-6 font-sans text-zinc-800 dark:text-zinc-200">
      <div>
        <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-800 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent tracking-tight">
          Hola, {usuario.nombre}
        </h1>
        <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
          Resumen de {MESES[d.mes.mes - 1]} {d.mes.anio}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Tarjeta to="/admin/cuotas" titulo="Recaudo del mes">
          {sinCuotas ? (
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/50 mt-2">Aún no se generaron las cuotas de este mes.</p>
          ) : (
            <>
              <p className="text-3xl font-black text-indigo-700 dark:text-indigo-400 tracking-tight">{moneda(d.mes.recaudado)}</p>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">de {moneda(d.mes.facturado)} facturados</p>
              <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-4 overflow-hidden shadow-inner border border-zinc-200/50 dark:border-zinc-700/50">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000" style={{ width: `${d.mes.porcentaje}%` }} />
              </div>
              <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mt-1.5 text-right">{d.mes.porcentaje}% recaudado</p>
            </>
          )}
        </Tarjeta>

        <Tarjeta to="/admin/propietarios" titulo="Cartera vencida">
          <p className={`text-3xl font-black tracking-tight ${d.cartera.vencida > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-800 dark:text-zinc-100'}`}>
            {moneda(d.cartera.vencida)}
          </p>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">{d.propietarios.morosos} propietario(s) moroso(s)</p>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Por vencer: {moneda(d.cartera.pendiente)}</p>
        </Tarjeta>

        <Tarjeta to="/admin/pagos" titulo="Pagos por revisar">
          <p className={`text-3xl font-black tracking-tight ${d.pagos.porRevisar > 0 ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-800 dark:text-zinc-100'}`}>
            {d.pagos.porRevisar}
          </p>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">
            {d.pagos.porRevisar > 0 ? 'Comprobantes esperando tu revisión' : 'Todo al día'}
          </p>
        </Tarjeta>

        <Tarjeta to="/admin/visitantes" titulo="Visitantes de hoy">
          <p className="text-3xl font-black text-zinc-800 dark:text-zinc-100 tracking-tight">{d.visitas.hoy}</p>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">
            {d.visitas.programadas} por llegar · {d.visitas.salieron} ya salieron
          </p>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">Dentro ahora: <span className="font-bold text-indigo-600 dark:text-indigo-400">{d.visitas.dentro}</span></p>
        </Tarjeta>

        <Tarjeta to="/admin/chat" titulo="Mensajes sin leer">
          <p className={`text-3xl font-black tracking-tight ${d.mensajesSinLeer > 0 ? 'text-amber-500' : 'text-zinc-800 dark:text-zinc-100'}`}>
            {d.mensajesSinLeer}
          </p>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">
            {d.mensajesSinLeer > 0 ? 'Propietarios esperando respuesta' : 'No hay mensajes pendientes'}
          </p>
        </Tarjeta>

        <Tarjeta to="/admin/propietarios" titulo="Propietarios">
          <p className="text-3xl font-black text-zinc-800 dark:text-zinc-100 tracking-tight">{d.propietarios.total}</p>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{d.propietarios.activos}</span> activos · <span className="text-rose-600 dark:text-rose-400 font-bold">{d.propietarios.morosos}</span> morosos · {d.propietarios.inactivos} inactivos
          </p>
        </Tarjeta>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none border border-zinc-100 dark:border-zinc-800/80 p-6 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Recaudo de los últimos 6 meses</h2>
          <div className="flex gap-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 bg-zinc-200 dark:bg-zinc-700 rounded-sm" /> Facturado</span>
            <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 bg-gradient-to-t from-indigo-500 to-violet-500 rounded-sm shadow-sm" /> Recaudado</span>
          </div>
        </div>
        <Grafica serie={d.serie} />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none border border-zinc-100 dark:border-zinc-800/80 p-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Mayor deuda vencida</h2>
            <Link to="/admin/propietarios" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-2 transition-all">Ver propietarios</Link>
          </div>
          {d.morosos.length === 0 && <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl text-center border border-zinc-100 dark:border-zinc-800 border-dashed">No hay propietarios morosos 🎉</p>}
          <ul className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
            {d.morosos.map((m) => (
              <li key={m.id} className="py-3 flex items-center justify-between gap-3 group">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{m.casaLote}</p>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">{m.nombre} · <span className="text-rose-500 font-bold">{m.cuotasVencidas} cuota(s) vencida(s)</span></p>
                </div>
                <p className="font-black text-rose-600 dark:text-rose-400 shrink-0">{moneda(m.deuda)}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none border border-zinc-100 dark:border-zinc-800/80 p-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Pagos esperando revisión</h2>
            <Link to="/admin/pagos" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-2 transition-all">Revisar pagos</Link>
          </div>
          {d.pagos.recientes.length === 0 && <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl text-center border border-zinc-100 dark:border-zinc-800 border-dashed">No hay pagos pendientes de revisar.</p>}
          <ul className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
            {d.pagos.recientes.map((p) => (
              <li key={p.id} className="py-3 flex items-center justify-between gap-3 group">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{p.casaLote} <span className="text-zinc-400 dark:text-zinc-500 font-medium text-xs ml-1">· {MESES[p.mes - 1]} {p.anio}</span></p>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">{p.nombre} · enviado el {fecha(p.fechaPago)}</p>
                </div>
                <p className="font-black text-indigo-700 dark:text-indigo-400 shrink-0">{moneda(p.valor)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Tarjeta({ to, titulo, children }) {
  return (
    <Link to={to} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800/80 p-5 hover:shadow-lg dark:hover:border-zinc-700 hover:-translate-y-1 hover:border-indigo-100 transition-all duration-300 block group">
      <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">{titulo}</p>
      {children}
    </Link>
  );
}

function Grafica({ serie }) {
  const max = Math.max(...serie.map((s) => s.facturado), 1);
  const alto = (v) => Math.max(v > 0 ? 4 : 0, Math.round((v / max) * ALTO_GRAFICA));

  if (serie.every((s) => s.facturado === 0)) {
    return <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 p-6 rounded-xl text-center border border-zinc-100 dark:border-zinc-800 border-dashed">Todavía no hay cuotas generadas para mostrar historial.</p>;
  }

  return (
    <div className="flex gap-2 sm:gap-6 overflow-x-auto pt-4 pb-2">
      {serie.map((s) => (
        <div key={`${s.anio}-${s.mes}`} className="flex-1 min-w-[3rem] flex flex-col items-center group">
          <div className="flex items-end justify-center gap-1.5 w-full" style={{ height: ALTO_GRAFICA }}>
            <div
              className="w-1/2 max-w-[1.25rem] bg-zinc-200 dark:bg-zinc-800 rounded-t-md group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700 transition-colors"
              style={{ height: alto(s.facturado) }}
              title={`Facturado: ${moneda(s.facturado)}`}
            />
            <div
              className="w-1/2 max-w-[1.25rem] bg-gradient-to-t from-indigo-500 to-violet-500 rounded-t-md shadow-sm group-hover:brightness-110 transition-all"
              style={{ height: alto(s.recaudado) }}
              title={`Recaudado: ${moneda(s.recaudado)}`}
            />
          </div>
          <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase mt-3">{MESES[s.mes - 1].slice(0, 3)}</span>
          <span className="text-[10px] font-bold text-zinc-300 dark:text-zinc-600">{s.facturado ? `${Math.round((s.recaudado / s.facturado) * 100)}%` : '-'}</span>
        </div>
      ))}
    </div>
  );
}