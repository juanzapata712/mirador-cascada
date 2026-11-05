// Para cambiar el color de una zona, basta con cambiar el nombre del acento
// en su layout (ej. acento="indigo" -> acento="emerald").
export const ACENTOS = {
  indigo: {
    degradado: 'from-indigo-700 via-violet-700 to-fuchsia-700 dark:from-indigo-950 dark:via-violet-950 dark:to-zinc-950',
    luzA: 'bg-fuchsia-400/30',
    luzB: 'bg-indigo-300/25',
  },
  emerald: {
    degradado: 'from-emerald-700 via-teal-700 to-cyan-700 dark:from-emerald-950 dark:via-teal-950 dark:to-zinc-950',
    luzA: 'bg-cyan-300/30',
    luzB: 'bg-emerald-300/25',
  },
  blue: {
    degradado: 'from-blue-700 via-sky-700 to-cyan-700 dark:from-blue-950 dark:via-sky-950 dark:to-zinc-950',
    luzA: 'bg-cyan-300/30',
    luzB: 'bg-blue-300/25',
  },
};
