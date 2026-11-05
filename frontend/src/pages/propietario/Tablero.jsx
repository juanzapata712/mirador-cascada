import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import TarjetaComunicado from '../../components/TarjetaComunicado';
import { CATEGORIAS } from '../../utils/categorias';

export default function Tablero() {
  const [lista, setLista] = useState([]);
  const [categoria, setCategoria] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    api.get('/comunicados', { params: categoria ? { categoria } : {} }).then((r) => {
      setLista(r.data);
      setCargando(false);
    });
  }, [categoria]);

  const chip = (activo) =>
    `px-4 py-2 rounded-xl text-sm font-bold transition-all ${activo ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`;

  return (
    <div className="font-sans text-zinc-800 dark:text-zinc-200">
      <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mb-6">Tablero de comunicados</h1>

      <div className="flex flex-wrap gap-2.5 mb-8">
        <button onClick={() => setCategoria('')} className={chip(categoria === '')}>Todos</button>
        {Object.entries(CATEGORIAS).map(([clave, v]) => (
          <button key={clave} onClick={() => setCategoria(clave)} className={chip(categoria === clave)}>
            {v.texto}
          </button>
        ))}
      </div>

      {cargando && <p className="text-zinc-500 dark:text-zinc-400 font-medium animate-pulse">Cargando...</p>}
      {!cargando && lista.length === 0 && <p className="text-zinc-500 dark:text-zinc-400 font-medium bg-white dark:bg-zinc-900 p-6 rounded-2xl text-center border border-zinc-200 dark:border-zinc-800 border-dashed">No hay comunicados en esta categoría.</p>}

      <div className="grid gap-5 max-w-3xl">
        {lista.map((c) => <TarjetaComunicado key={c.id} c={c} />)}
      </div>
    </div>
  );
}