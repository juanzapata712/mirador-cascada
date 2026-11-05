import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/*
  Reemplaza confirm(), prompt() y alert() del navegador.

  const { confirmar, pedirTexto, aviso } = useAvisos();

  const ok = await confirmar({ titulo, mensaje, detalle: [{ etiqueta, valor }], confirmarTexto, tipo });
  const motivo = await pedirTexto({ titulo, mensaje, etiqueta, placeholder, confirmarTexto, tipo });   // texto o null
  aviso.exito('Título', { mensaje: 'detalle opcional', duracion: 5000 });
  aviso.error(...) / aviso.alerta(...) / aviso.info(...)

  tipo: 'exito' | 'peligro' | 'alerta' | 'info'
*/

const AvisosContext = createContext(null);

export function useAvisos() {
  const ctx = useContext(AvisosContext);
  if (!ctx) throw new Error('useAvisos debe usarse dentro de <AvisosProvider>');
  return ctx;
}

const ESTILOS = {
  exito: {
    anillo: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    boton: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25',
    barra: 'bg-emerald-500',
    borde: 'border-emerald-200 dark:border-emerald-900/60',
  },
  peligro: {
    anillo: 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
    boton: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/25',
    barra: 'bg-rose-500',
    borde: 'border-rose-200 dark:border-rose-900/60',
  },
  alerta: {
    anillo: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    boton: 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/25',
    barra: 'bg-amber-500',
    borde: 'border-amber-200 dark:border-amber-900/60',
  },
  info: {
    anillo: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    boton: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25',
    barra: 'bg-indigo-500',
    borde: 'border-indigo-200 dark:border-indigo-900/60',
  },
};
ESTILOS.error = ESTILOS.peligro;

function Icono({ tipo, className = 'w-6 h-6' }) {
  const base = {
    className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  if (tipo === 'exito') {
    return (
      <svg {...base}>
        <circle cx="12" cy="12" r="9.5" />
        <path d="M7.5 12.5l3 3 6-6.5" strokeDasharray="20" strokeDashoffset="20" className="animate-trazo" />
      </svg>
    );
  }
  if (tipo === 'error') {
    return (<svg {...base}><circle cx="12" cy="12" r="9.5" /><path d="M9 9l6 6M15 9l-6 6" /></svg>);
  }
  if (tipo === 'alerta') {
    return (<svg {...base}><path d="M12 3.8l9.2 16H2.8L12 3.8z" /><path d="M12 10v4M12 17v.01" /></svg>);
  }
  if (tipo === 'peligro') {
    return (<svg {...base}><circle cx="12" cy="12" r="9.5" /><path d="M12 7.5v5.5M12 16.5v.01" /></svg>);
  }
  return (<svg {...base}><circle cx="12" cy="12" r="9.5" /><path d="M12 11v5M12 8v.01" /></svg>);
}

export function AvisosProvider({ children }) {
  const [dialogo, setDialogo] = useState(null);
  const [toasts, setToasts] = useState([]);
  const resolverRef = useRef(null);
  const idRef = useRef(0);

  const abrirDialogo = useCallback((opciones) => new Promise((resolve) => {
    resolverRef.current = resolve;
    setDialogo(opciones);
  }), []);

  const cerrar = useCallback((valor) => {
    resolverRef.current?.(valor);
    resolverRef.current = null;
    setDialogo(null);
  }, []);

  const confirmar = useCallback((o) => abrirDialogo({
    tipo: 'info', confirmarTexto: 'Confirmar', cancelarTexto: 'Cancelar', ...o, conTexto: false,
  }), [abrirDialogo]);

  const pedirTexto = useCallback((o) => abrirDialogo({
    tipo: 'peligro', confirmarTexto: 'Aceptar', cancelarTexto: 'Cancelar', requerido: true, ...o, conTexto: true,
  }), [abrirDialogo]);

  const quitar = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const mostrar = useCallback((tipo, titulo, { mensaje, duracion } = {}) => {
    const id = ++idRef.current;
    const ms = duracion ?? (tipo === 'error' ? 6500 : 4500);
    setToasts((t) => [...t.slice(-3), { id, tipo, titulo, mensaje, ms }]);
    setTimeout(() => quitar(id), ms);
  }, [quitar]);

  const aviso = useMemo(() => ({
    exito: (t, o) => mostrar('exito', t, o),
    error: (t, o) => mostrar('error', t, o),
    alerta: (t, o) => mostrar('alerta', t, o),
    info: (t, o) => mostrar('info', t, o),
  }), [mostrar]);

  const valor = useMemo(() => ({ confirmar, pedirTexto, aviso }), [confirmar, pedirTexto, aviso]);

  return (
    <AvisosContext.Provider value={valor}>
      {children}

      {dialogo && <Dialogo d={dialogo} onCerrar={cerrar} />}

      <div
        aria-live="polite"
        className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:w-96 z-[70] flex flex-col gap-3 pointer-events-none"
      >
        {toasts.map((t) => {
          const e = ESTILOS[t.tipo];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 rounded-2xl border bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-900/10 dark:shadow-black/40 p-4 pr-10 animate-toast ${e.borde}`}
            >
              <div className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${e.anillo}`}>
                <Icono tipo={t.tipo} className="w-6 h-6" />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="font-extrabold text-zinc-900 dark:text-zinc-100 leading-snug">{t.titulo}</p>
                {t.mensaje && <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mt-0.5">{t.mensaje}</p>}
              </div>
              <button
                onClick={() => quitar(t.id)}
                aria-label="Cerrar aviso"
                className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors text-sm leading-none"
              >
                ✕
              </button>
              <div className={`absolute bottom-0 left-0 h-1 animate-barra ${e.barra}`} style={{ animationDuration: `${t.ms}ms` }} />
            </div>
          );
        })}
      </div>
    </AvisosContext.Provider>
  );
}

function Dialogo({ d, onCerrar }) {
  const [texto, setTexto] = useState('');
  const e = ESTILOS[d.tipo] || ESTILOS.info;
  const bloqueado = d.conTexto && d.requerido && !texto.trim();
  const valorCancelar = d.conTexto ? null : false;

  useEffect(() => {
    const alTecla = (ev) => { if (ev.key === 'Escape') onCerrar(valorCancelar); };
    window.addEventListener('keydown', alTecla);
    return () => window.removeEventListener('keydown', alTecla);
  }, [onCerrar, valorCancelar]);

  function aceptar(ev) {
    ev.preventDefault();
    if (bloqueado) return;
    onCerrar(d.conTexto ? texto.trim() : true);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-black/70 backdrop-blur-sm animate-aparecer"
      onMouseDown={(ev) => { if (ev.target === ev.currentTarget) onCerrar(valorCancelar); }}
    >
      <form
        onSubmit={aceptar}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-800 p-7 animate-subir"
      >
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${e.anillo}`}>
          <Icono tipo={d.tipo} className="w-9 h-9" />
        </div>

        <h2 className="mt-5 text-center text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">{d.titulo}</h2>
        {d.mensaje && <p className="mt-2 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">{d.mensaje}</p>}

        {d.detalle?.length > 0 && (
          <dl className="mt-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
            {d.detalle.map(({ etiqueta, valor }) => (
              <div key={etiqueta} className="flex justify-between gap-4 px-4 py-2.5">
                <dt className="text-zinc-500 dark:text-zinc-400 font-medium">{etiqueta}</dt>
                <dd className="font-bold text-zinc-900 dark:text-zinc-100 text-right">{valor}</dd>
              </div>
            ))}
          </dl>
        )}

        {d.conTexto && (
          <div className="mt-5">
            {d.etiqueta && (
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5 ml-1">{d.etiqueta}</label>
            )}
            <textarea
              autoFocus
              rows="3"
              value={texto}
              onChange={(ev) => setTexto(ev.target.value)}
              placeholder={d.placeholder}
              className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onCerrar(valorCancelar)}
            className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            {d.cancelarTexto}
          </button>
          <button
            type="submit"
            autoFocus={!d.conTexto}
            disabled={bloqueado}
            className={`px-4 py-3 rounded-xl text-white font-bold text-sm shadow-lg transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${e.boton}`}
          >
            {d.confirmarTexto}
          </button>
        </div>
      </form>
    </div>
  );
}
