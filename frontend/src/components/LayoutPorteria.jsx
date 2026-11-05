import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../utils/tema';
import { ACENTOS } from '../utils/acentos';
import Icono from './Iconos';
import Avatar from './Avatar';

export default function LayoutPorteria() {
  const { usuario, logout } = useAuth();
  const { oscuro, alternar } = useTema();
  const { pathname } = useLocation();
  const a = ACENTOS.blue;
  const enCuenta = pathname.endsWith('/cuenta');

  return (
    <div className="min-h-screen font-sans">
      <header className={`sticky top-0 z-30 overflow-hidden text-white bg-gradient-to-r ${a.degradado} shadow-lg`}>
        <div className={`pointer-events-none absolute -top-16 -left-10 w-56 h-56 rounded-full blur-3xl animate-flotar ${a.luzA}`} />
        <div className={`pointer-events-none absolute -bottom-20 right-10 w-64 h-64 rounded-full blur-3xl animate-flotar-lento ${a.luzB}`} />
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />

        <div className="relative z-10 px-4 sm:px-6 py-3.5 flex flex-wrap items-center gap-3 sm:gap-4">
          <Link to="/porteria" className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 shrink-0 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center shadow-lg shadow-black/10">
              <Icono nombre="porteros" className="w-6 h-6" />
            </div>
            <div className="leading-tight min-w-0">
              <p className="font-extrabold tracking-tight truncate">Módulo de Portería</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Mirador de la Cascada</p>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {enCuenta && (
              <Link
                to="/porteria"
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-sm font-bold transition-colors"
              >
                <Icono nombre="volver" className="w-4 h-4" />
                <span className="hidden sm:inline">Portería</span>
              </Link>
            )}

            {usuario.rol === 'ADMIN' && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-sm font-bold transition-colors"
              >
                <Icono nombre="volver" className="w-4 h-4" />
                <span className="hidden sm:inline">Volver al panel</span>
              </Link>
            )}

            <button
              onClick={alternar}
              title={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label="Alternar tema"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-colors cursor-pointer"
            >
              <Icono nombre={oscuro ? 'sol' : 'luna'} className="w-5 h-5" />
            </button>

            <Link
              to="/porteria/cuenta"
              title="Mi cuenta"
              className="flex items-center gap-3 pl-2 pr-2 sm:pr-4 py-1.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-colors"
            >
              <Avatar
                nombre={usuario.nombre} fotoUrl={usuario.fotoUrl} tamano="w-9 h-9"
                letra="bg-white/20 border border-white/30 text-base" borde="border border-white/30"
              />
              <div className="hidden sm:block leading-tight">
                <p className="text-sm font-bold">{usuario.nombre}</p>
                <p className="text-[11px] font-medium text-white/70">Mi cuenta</p>
              </div>
            </Link>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-bold bg-white/10 hover:bg-rose-500 border border-white/15 hover:border-rose-400 transition-all duration-300 cursor-pointer"
            >
              <Icono nombre="salir" className="w-5 h-5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-5xl mx-auto">
        <div key={pathname} className="animate-aparecer">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
