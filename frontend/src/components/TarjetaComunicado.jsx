import { CATEGORIAS } from '../utils/categorias';
import { urlArchivo } from '../services/archivos';

export default function TarjetaComunicado({ c, children }) {
  const cat = CATEGORIAS[c.categoria] || CATEGORIAS.GENERAL;

  return (
    <article className={`bg-white dark:bg-zinc-900 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-zinc-100 dark:border-zinc-800 relative group`}>
      {/* Línea decorativa superior */}
      <div className={`h-1.5 w-full ${cat.color.replace('text', 'bg').replace('bg', 'bg').split(' ')[0] || 'bg-indigo-500'}`} />
      
      {c.imagenUrl && (
        <img src={urlArchivo(c.imagenUrl)} alt="" className="w-full h-56 object-cover border-b border-zinc-100 dark:border-zinc-800" />
      )}
      
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-sm ${cat.color}`}>
              {cat.texto}
            </span>
            {c.fijado && (
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-100 dark:border-amber-900/50">
                📌 Fijado
              </span>
            )}
          </div>
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
            {new Date(c.creadoEn).toLocaleDateString('es-CO')}
          </span>
        </div>
        
        <div>
          <h3 className="font-extrabold text-xl text-zinc-900 dark:text-zinc-100 leading-tight mb-2">{c.titulo}</h3>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed whitespace-pre-line">{c.contenido}</p>
        </div>
        
        <div className="pt-4 mt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Por: <span className="text-zinc-700 dark:text-zinc-200 font-semibold">{c.admin.nombre}</span>
          </p>
          {children && <div className="flex gap-3 text-sm">{children}</div>}
        </div>
      </div>
    </article>
  );
}