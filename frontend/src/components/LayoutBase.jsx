import { useEffect, useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTema } from '../utils/tema';
import { ACENTOS } from '../utils/acentos';
import Icono from './Iconos';
import Avatar from './Avatar';

export default function LayoutBase({ acento = 'indigo', subtitulo, rolTexto, enlaces, rutaCuenta }) {
  const { usuario, logout } = useAuth();
  const { noLeidos } = useSocket();
  const { oscuro, alternar } = useTema();
  const { pathname } = useLocation();
  const [abierto, setAbierto] = useState(false);
  const a = ACENTOS[acento] || ACENTOS.indigo;

  // En celular, el menú se cierra al cambiar de pantalla o con Escape
  useEffect(() => { setAbierto(false); }, [pathname]);
  useEffect(() => {
    if (!abierto) return undefined;
    const alTecla = (e) => { if (e.key === 'Escape') setAbierto(false); };
    window.addEventListener('keydown', alTecla);
    return () => window.removeEventListener('keydown', alTecla);
  }, [abierto]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans">
      {/* ===== Barra superior (solo celular) ===== */}
      <header className={`md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 text-white bg-gradient-to-br ${a.degradado} shadow-lg`}>
        <button
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          className="p-2 rounded-xl bg-white/15 border border-white/20 active:scale-95 transition-transform"
        >
          <Icono nombre="menu" className="w-6 h-6" />
        </button>
        <div className="leading-tight min-w-0">
          <p className="font-extrabold truncate">Mirador de la Cascada</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">{subtitulo}</p>
        </div>
        <Link to={rutaCuenta} aria-label="Mi cuenta" className="ml-auto">
          <Avatar
            nombre={usuario.nombre} fotoUrl={usuario.fotoUrl} tamano="w-9 h-9"
            letra="bg-white/20 border border-white/30 text-sm" borde="border border-white/30"
          />
        </Link>
      </header>

      {abierto && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-aparecer"
          onClick={() => setAbierto(false)}
        />
      )}

      {/* ===== Menú lateral ===== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-out
          md:sticky md:top-0 md:h-screen md:self-start md:translate-x-0 md:z-10 md:shrink-0
          ${abierto ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col overflow-hidden text-white border-r border-white/10 bg-gradient-to-b ${a.degradado}`}
      >
        {/* Decoración (igual que el login) */}
        <div className={`pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl animate-flotar ${a.luzA}`} />
        <div className={`pointer-events-none absolute bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl animate-flotar-lento ${a.luzB}`} />
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />
        <svg className="pointer-events-none absolute bottom-0 left-0 w-full h-40 text-white/10" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
          <path fill="currentColor" d="M0,224 C240,150 480,300 720,230 C960,160 1200,290 1440,200 L1440,320 L0,320 Z" />
        </svg>

        <div className="relative z-10 flex flex-col h-full">
          {/* Marca */}
          <div className="flex items-center gap-3 p-6 pb-5">
            <div className="w-11 h-11 shrink-0 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center shadow-lg shadow-black/10">
              <Icono nombre="edificio" className="w-6 h-6" />
            </div>
            <div className="leading-tight min-w-0">
              <p className="font-extrabold tracking-tight truncate">Mirador de la Cascada</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/65 mt-0.5">{subtitulo}</p>
            </div>
            <button
              onClick={() => setAbierto(false)}
              aria-label="Cerrar menú"
              className="md:hidden ml-auto p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Icono nombre="cerrar" className="w-5 h-5" />
            </button>
          </div>

          {/* Enlaces */}
          <nav className="flex-1 overflow-y-auto px-4 py-1 space-y-1.5">
            {enlaces.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm border transition-all duration-300 ${
                    isActive
                      ? 'bg-white/15 backdrop-blur-md border-white/25 text-white font-bold shadow-lg shadow-black/10'
                      : 'border-transparent text-white/75 hover:text-white hover:bg-white/10 hover:translate-x-1 font-semibold'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-white" />}
                    <Icono nombre={l.icono} className="w-5 h-5 shrink-0" />
                    <span className="flex-1 truncate">{l.texto}</span>
                    {l.chat && noLeidos > 0 && (
                      <span className="bg-rose-500 text-white text-xs font-bold rounded-full px-2.5 py-0.5 shadow-md shadow-black/20 animate-pulse">
                        {noLeidos}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Controles inferiores */}
          <div className="p-4 space-y-3">
            <button
              onClick={alternar}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-sm font-bold transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Icono nombre={oscuro ? 'luna' : 'sol'} className="w-5 h-5" />
                {oscuro ? 'Modo oscuro' : 'Modo claro'}
              </span>
              <span className={`relative w-10 h-6 rounded-full transition-colors ${oscuro ? 'bg-white/45' : 'bg-white/20'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${oscuro ? 'translate-x-4' : ''}`} />
              </span>
            </button>

            <Link
              to={rutaCuenta}
              title="Mi cuenta"
              className="group flex items-center gap-3 p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur transition-colors"
            >
              <Avatar
                nombre={usuario.nombre} fotoUrl={usuario.fotoUrl} tamano="w-11 h-11"
                letra="bg-white/20 border border-white/30 text-lg shadow-inner" borde="border border-white/30"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate">{usuario.nombre}</p>
                <p className="text-xs font-medium text-white/70 truncate">{rolTexto} · Mi cuenta</p>
              </div>
              <Icono nombre="flecha" className="w-4 h-4 text-white/60 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-white/10 hover:bg-rose-500 border border-white/15 hover:border-rose-400 transition-all duration-300 cursor-pointer"
            >
              <Icono nombre="salir" className="w-5 h-5" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 md:p-8">
        <div key={pathname} className="max-w-7xl mx-auto animate-aparecer">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
