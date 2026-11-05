import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Badge from '../../components/Badge';
import { hoy, fechaCO, horaCO } from '../../utils/formato';

export default function Visitantes() {
  const [fecha, setFecha] = useState(hoy());
  const [estado, setEstado] = useState('');
  const [q, setQ] = useState('');
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    const t = setTimeout(async () => {
      const params = {};
      if (fecha) params.fecha = fecha;
      if (estado) params.estado = estado;
      if (q.trim()) params.q = q.trim();
      const { data } = await api.get('/visitantes', { params });
      setLista(data);
      setCargando(false);
    }, 300);
    return () => clearTimeout(t);
  }, [fecha, estado, q]);

  return (
    <div className="font-sans text-zinc-800 dark:text-zinc-200">
      <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mb-8">Bitácora de ingresos</h1>

      <div className="flex flex-wrap gap-4 items-center mb-6 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
        <button onClick={() => setFecha('')} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline underline-offset-2">Quitar filtro fecha</button>
        
        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block mx-2"></div>
        
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
          <option value="">Todos los estados</option>
          <option value="PROGRAMADA">Programada</option>
          <option value="INGRESO">Adentro</option>
          <option value="SALIO">Salió</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
        
        <div className="relative flex-1 min-w-[250px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, cédula, placa o casa..."
            className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 pl-9 pr-4 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-left text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider font-bold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-4">Fecha</th><th className="p-4">Visitante</th><th className="p-4">Placa Vehículo</th>
                <th className="p-4">Se dirige a</th><th className="p-4">Estado</th><th className="p-4">Entrada</th><th className="p-4">Salida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {cargando && <tr><td colSpan="7" className="p-8 text-center text-zinc-500 dark:text-zinc-400 font-medium">Cargando registros...</td></tr>}
              {!cargando && lista.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-zinc-500 dark:text-zinc-400 font-medium">No hay registros con los filtros actuales</td></tr>}
              {lista.map((v) => (
                <tr key={v.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="p-4 text-zinc-600 dark:text-zinc-400 font-medium">{fechaCO(v.fechaVisita)}</td>
                  <td className="p-4">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{v.nombre}</span>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">CC {v.documento}</span>
                  </td>
                  <td className="p-4">
                    {v.placa ? <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700">{v.placa}</span> : <span className="text-zinc-300 dark:text-zinc-700">-</span>}
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{v.propietario.casaLote}</span>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{v.propietario.usuario.nombre}</span>
                  </td>
                  <td className="p-4"><Badge estado={v.estado} /></td>
                  <td className="p-4 font-bold text-zinc-700 dark:text-zinc-300">{v.horaIngreso ? horaCO(v.horaIngreso) : '-'}</td>
                  <td className="p-4 font-bold text-zinc-700 dark:text-zinc-300">{v.horaSalida ? horaCO(v.horaSalida) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}