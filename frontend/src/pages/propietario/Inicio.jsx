import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import Badge from '../../components/Badge';
import TarjetaComunicado from '../../components/TarjetaComunicado';
import { moneda } from '../../utils/formato';

export default function Inicio() {
  const [perfil, setPerfil] = useState(null);
  const [cuotas, setCuotas] = useState([]);
  const [comunicados, setComunicados] = useState([]);

  useEffect(() => {
    api.get('/propietarios/yo').then((r) => setPerfil(r.data));
    api.get('/cuotas/mias').then((r) => setCuotas(r.data));
    api.get('/comunicados').then((r) => setComunicados(r.data.slice(0, 2)));
  }, []);

  if (!perfil) return <p className="text-zinc-500 dark:text-zinc-400 font-medium animate-pulse">Cargando...</p>;

  const deuda = cuotas.filter((c) => c.estado !== 'PAGADA');
  const vencidas = deuda.filter((c) => c.estado === 'VENCIDA');
  const total = deuda.reduce((s, c) => s + Number(c.valor), 0);

  return (
    <div className="space-y-6 font-sans text-zinc-800 dark:text-zinc-200">
      <div>
        <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-700 to-teal-500 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent tracking-tight">
          Hola, {perfil.usuario.nombre}
        </h1>
        <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500 mt-1 flex items-center gap-2">
          {perfil.casaLote} <Badge estado={perfil.estado} />
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none border border-zinc-100 dark:border-zinc-800/80 p-5 hover:-translate-y-1 transition-all">
          <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Saldo por pagar</p>
          <p className="text-3xl font-black text-indigo-700 dark:text-indigo-400 tracking-tight">{moneda(total)}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none border border-zinc-100 dark:border-zinc-800/80 p-5 hover:-translate-y-1 transition-all">
          <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Cuotas pendientes</p>
          <p className="text-3xl font-black text-zinc-800 dark:text-zinc-100 tracking-tight">{deuda.length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none border border-zinc-100 dark:border-zinc-800/80 p-5 hover:-translate-y-1 transition-all">
          <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Cuotas vencidas</p>
          <p className={`text-3xl font-black tracking-tight ${vencidas.length ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-800 dark:text-zinc-100'}`}>{vencidas.length}</p>
        </div>
      </div>

      <Link to="/propietario/pagos" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors">
        Ir a mis pagos
      </Link>

      {comunicados.length > 0 && (
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Últimos comunicados</h2>
            <Link to="/propietario/tablero" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline underline-offset-2 transition-all">Ver todos</Link>
          </div>
          {comunicados.map((c) => <TarjetaComunicado key={c.id} c={c} />)}
        </div>
      )}
    </div>
  );
}