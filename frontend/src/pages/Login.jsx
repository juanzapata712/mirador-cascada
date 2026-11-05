import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DESTINO = { ADMIN: '/admin', PROPIETARIO: '/propietario', PORTERO: '/porteria' };

// Accesos rápidos para la demostración. Solo aparecen si en frontend/.env hay:
//   VITE_MODO_DEMO=true
const MODO_DEMO = import.meta.env.VITE_MODO_DEMO === 'true';
const ACCESOS_DEMO = [
  { rol: 'Administrador', correo: 'admin@mirador.com', contrasena: 'Admin123*' },
  { rol: 'Propietario', correo: 'carlos.ramirez@demo.com', contrasena: 'Demo123*' },
  { rol: 'Portero', correo: 'portero@mirador.com', contrasena: 'Portero123*' },
];

function Ico({ children, className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const FUNCIONES = [
  {
    titulo: 'Pagos en línea',
    texto: 'Cuotas, comprobantes y estado de cuenta al instante.',
    icono: (<Ico><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M7 15h3" /></Ico>),
  },
  {
    titulo: 'Visitantes con QR',
    texto: 'Pases digitales y control de ingreso en portería.',
    icono: (<Ico><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" /></Ico>),
  },
  {
    titulo: 'Tablero de avisos',
    texto: 'Comunicados y novedades de la administración.',
    icono: (<Ico><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M7 9h10M7 13h6M8 21h8" /></Ico>),
  },
  {
    titulo: 'Chat en vivo',
    texto: 'Habla con la administración sin salir de la app.',
    icono: (<Ico><path d="M21 12a8.5 8.5 0 01-12.3 7.6L3.5 21l1.4-5A8.5 8.5 0 1121 12z" /></Ico>),
  },
];

const IconoEdificio = ({ className = 'w-7 h-7' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const campo =
  'w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 py-3.5 pl-12 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all';
const etiqueta =
  'block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1';

export default function Login() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [oscuro, setOscuro] = useState(() => document.documentElement.classList.contains('dark'));

  // Redirigir si el usuario ya está autenticado
  useEffect(() => {
    if (usuario && DESTINO[usuario.rol]) navigate(DESTINO[usuario.rol], { replace: true });
  }, [usuario, navigate]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', oscuro);
    localStorage.setItem('theme', oscuro ? 'dark' : 'light');
  }, [oscuro]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const res = await login(correo, contrasena);
      const user = res || usuario;
      if (user && DESTINO[user.rol]) navigate(DESTINO[user.rol], { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales incorrectas o error de conexión');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 font-sans bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 transition-colors duration-300">
      {/* ============ Panel de presentación (solo pantallas grandes) ============ */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 xl:p-16 text-white bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700">
        <div className="absolute -top-28 -left-28 w-[26rem] h-[26rem] rounded-full bg-fuchsia-400/30 blur-3xl animate-flotar" />
        <div className="absolute bottom-10 -right-24 w-[30rem] h-[30rem] rounded-full bg-indigo-300/25 blur-3xl animate-flotar-lento" />
        <div
          className="absolute inset-0 opacity-70"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <svg className="absolute bottom-0 left-0 w-full h-48 text-white/10" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
          <path fill="currentColor" d="M0,224 C240,150 480,300 720,230 C960,160 1200,290 1440,200 L1440,320 L0,320 Z" />
        </svg>
        <svg className="absolute bottom-0 left-0 w-full h-32 text-white/10" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
          <path fill="currentColor" d="M0,260 C300,200 520,310 800,250 C1080,190 1240,300 1440,250 L1440,320 L0,320 Z" />
        </svg>

        <div className="relative z-10 flex items-center gap-3 animate-subir">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center">
            <IconoEdificio />
          </div>
          <div className="leading-tight">
            <p className="font-extrabold text-lg tracking-tight">Mirador de la Cascada</p>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-100/80">Urbanización</p>
          </div>
        </div>

        <div className="relative z-10 max-w-xl space-y-9">
          <div className="animate-subir" style={{ animationDelay: '120ms' }}>
            <h2 className="text-5xl xl:text-6xl font-black leading-[1.05] tracking-tight">
              Tu urbanización,
              <br />
              <span className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">en un solo lugar.</span>
            </h2>
            <p className="mt-5 text-lg font-medium text-indigo-100/90 max-w-md">
              Administra pagos, visitantes, comunicados y conversaciones con la administración desde una plataforma moderna y segura.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {FUNCIONES.map((f, i) => (
              <div
                key={f.titulo}
                className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4 hover:bg-white/15 transition-colors animate-subir"
                style={{ animationDelay: `${260 + i * 90}ms` }}
              >
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mb-3">{f.icono}</div>
                <p className="font-bold text-sm">{f.titulo}</p>
                <p className="text-xs font-medium text-indigo-100/80 mt-1 leading-relaxed">{f.texto}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-sm font-medium text-indigo-100/70">
          Proyecto académico · Herramientas de Programación 3
        </p>
      </aside>

      {/* ============ Formulario ============ */}
      <main className="relative flex items-center justify-center p-6 sm:p-10 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-violet-500/10 dark:bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <button
          type="button"
          onClick={() => setOscuro(!oscuro)}
          className="absolute top-6 right-6 px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 shadow-sm hover:shadow-md transition-all z-20 font-bold text-xs flex items-center gap-2 cursor-pointer"
          title="Cambiar tema"
        >
          <span>{oscuro ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}</span>
        </button>

        <div className="relative z-10 w-full max-w-md animate-subir">
          {/* Logo para celulares (el panel grande se oculta) */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-xl shadow-indigo-500/30">
              <IconoEdificio className="w-8 h-8" />
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-800 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
              Mirador de la Cascada
            </p>
          </div>

          <div className="mb-8">
            <p className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Acceso a la plataforma</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Bienvenido de nuevo</h1>
            <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">Ingresa con tu cuenta para continuar.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div role="alert" className="bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-sm font-bold p-3.5 rounded-xl text-center animate-aparecer">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="correo" className={etiqueta}>Correo electrónico</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none">
                  <Ico><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Ico>
                </span>
                <input
                  id="correo" type="email" value={correo} autoComplete="username"
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="usuario@correo.com" required
                  className={`${campo} pr-4`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="contrasena" className={etiqueta}>Contraseña</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none">
                  <Ico><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 118 0v3" /></Ico>
                </span>
                <input
                  id="contrasena" type={verClave ? 'text' : 'password'} value={contrasena} autoComplete="current-password"
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••" required
                  className={`${campo} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setVerClave(!verClave)}
                  aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <Ico>
                    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
                    <circle cx="12" cy="12" r="3" />
                    {verClave && <path d="M4 4l16 16" />}
                  </Ico>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 text-sm cursor-pointer"
            >
              {cargando && (
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          {MODO_DEMO && (
            <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3 text-center">
                Acceso rápido · demostración
              </p>
              <div className="grid grid-cols-3 gap-2">
                {ACCESOS_DEMO.map((a) => (
                  <button
                    key={a.rol}
                    type="button"
                    onClick={() => { setCorreo(a.correo); setContrasena(a.contrasena); setError(''); }}
                    className="px-2 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    {a.rol}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="mt-8 text-center text-xs font-medium text-zinc-400 dark:text-zinc-500">
            ¿Problemas para ingresar? Comunícate con la administración de la urbanización.
          </p>
        </div>
      </main>
    </div>
  );
}
