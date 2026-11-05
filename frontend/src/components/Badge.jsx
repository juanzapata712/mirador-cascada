import { colorEstado, etiquetaEstado } from '../utils/formato';

export default function Badge({ estado }) {
  return (
    <span className={`px-2.5 py-1 rounded-md font-bold text-[11px] uppercase tracking-wider whitespace-nowrap shadow-sm border border-black/5 dark:border-white/10 ${colorEstado[estado] || 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}>
      {etiquetaEstado[estado] || estado}
    </span>
  );
}