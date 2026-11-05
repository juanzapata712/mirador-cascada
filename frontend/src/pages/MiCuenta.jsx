import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAvisos } from '../components/Avisos';
import Badge from '../components/Badge';
import Icono from '../components/Iconos';
import Avatar from '../components/Avatar';
import { prepararFoto } from '../utils/imagen';
import { fecha } from '../utils/formato';

const ROLES = { ADMIN: 'Administrador', PROPIETARIO: 'Propietario', PORTERO: 'Portero' };

const tarjeta = 'bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8';
const etiqueta = 'block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5 ml-1';
const campo = 'w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed';
const alertaError = 'bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-sm font-medium p-3 rounded-xl';

const NIVELES = [
  { texto: 'Muy corta', barra: 'bg-rose-500' },
  { texto: 'Débil', barra: 'bg-rose-500' },
  { texto: 'Aceptable', barra: 'bg-amber-500' },
  { texto: 'Buena', barra: 'bg-emerald-500' },
  { texto: 'Excelente', barra: 'bg-emerald-600' },
];

// 0 = muy corta (menos de 6 caracteres); 1 a 4 según longitud y variedad
function fortaleza(clave) {
  if (clave.length < 6) return 0;
  let puntos = 0;
  if (clave.length >= 8) puntos++;
  if (/[a-z]/.test(clave) && /[A-Z]/.test(clave)) puntos++;
  if (/\d/.test(clave)) puntos++;
  if (/[^A-Za-z0-9]/.test(clave)) puntos++;
  return Math.max(1, puntos);
}

function CampoClave({ id, etiquetaTexto, valor, onChange, autoComplete, placeholder }) {
  const [ver, setVer] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={etiqueta}>{etiquetaTexto}</label>
      <div className="relative">
        <input
          id={id} type={ver ? 'text' : 'password'} value={valor} onChange={onChange}
          autoComplete={autoComplete} placeholder={placeholder}
          className={`${campo} pr-12`}
        />
        <button
          type="button"
          onClick={() => setVer(!ver)}
          aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <Icono nombre={ver ? 'ojoOculto' : 'ojo'} />
        </button>
      </div>
    </div>
  );
}

const datosDe = (c) => ({ nombre: c.nombre, correo: c.correo, telefono: c.propietario?.telefono || '' });

export default function MiCuenta() {
  const { actualizarUsuario } = useAuth();
  const { aviso, confirmar } = useAvisos();

  const [cuenta, setCuenta] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [datos, setDatos] = useState({ nombre: '', correo: '', telefono: '' });
  const [errorDatos, setErrorDatos] = useState('');
  const [guardandoDatos, setGuardandoDatos] = useState(false);

  const [clave, setClave] = useState({ actual: '', nueva: '', repetir: '' });
  const [errorClave, setErrorClave] = useState('');
  const [guardandoClave, setGuardandoClave] = useState(false);

  const [fotoNueva, setFotoNueva] = useState(null); // { archivo, vista } antes de guardar
  const [errorFoto, setErrorFoto] = useState('');
  const [guardandoFoto, setGuardandoFoto] = useState(false);

  // Libera la vista previa anterior cuando cambia o se cierra la pantalla
  useEffect(() => () => { if (fotoNueva?.vista) URL.revokeObjectURL(fotoNueva.vista); }, [fotoNueva]);

  useEffect(() => {
    api.get('/cuenta')
      .then(({ data }) => { setCuenta(data); setDatos(datosDe(data)); })
      .catch(() => setErrorCarga('No se pudo cargar tu cuenta'));
  }, []);

  if (errorCarga) return <p className={alertaError}>{errorCarga}</p>;
  if (!cuenta) return <p className="text-zinc-500 dark:text-zinc-400 font-medium animate-pulse">Cargando tu cuenta...</p>;

  const esPropietario = Boolean(cuenta.propietario);
  const original = datosDe(cuenta);
  const huboCambios =
    datos.nombre.trim() !== original.nombre ||
    datos.correo.trim() !== original.correo ||
    (esPropietario && datos.telefono.trim() !== original.telefono);

  const nivel = fortaleza(clave.nueva);
  const coinciden = clave.nueva !== '' && clave.nueva === clave.repetir;
  const puedeCambiarClave = clave.actual && clave.nueva.length >= 6 && coinciden && !guardandoClave;

  async function elegirFoto(e) {
    const archivo = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo
    if (!archivo) return;
    setErrorFoto('');
    try {
      const lista = await prepararFoto(archivo);
      setFotoNueva({ archivo: lista, vista: URL.createObjectURL(lista) });
    } catch (err) {
      setErrorFoto(err.message || 'No se pudo leer la imagen');
    }
  }

  async function guardarFoto() {
    setGuardandoFoto(true);
    setErrorFoto('');
    try {
      const formulario = new FormData();
      formulario.append('foto', fotoNueva.archivo);
      const { data } = await api.put('/cuenta/foto', formulario);
      setCuenta(data);
      actualizarUsuario({ fotoUrl: data.fotoUrl });
      setFotoNueva(null);
      aviso.exito('Foto actualizada', { mensaje: 'Ya se ve en tu perfil y en el chat.' });
    } catch (err) {
      setErrorFoto(err.response?.data?.error || 'No se pudo guardar la foto');
    } finally {
      setGuardandoFoto(false);
    }
  }

  async function quitarFoto() {
    const ok = await confirmar({
      tipo: 'peligro',
      titulo: 'Quitar foto de perfil',
      mensaje: 'Volverá a mostrarse la inicial de tu nombre.',
      confirmarTexto: 'Sí, quitar',
      cancelarTexto: 'Volver',
    });
    if (!ok) return;
    try {
      const { data } = await api.delete('/cuenta/foto');
      setCuenta(data);
      actualizarUsuario({ fotoUrl: null });
      aviso.alerta('Foto eliminada', { mensaje: 'Puedes subir otra cuando quieras.' });
    } catch (err) {
      aviso.error('No se pudo quitar la foto', { mensaje: err.response?.data?.error });
    }
  }

  async function guardarDatos(e) {
    e.preventDefault();
    setErrorDatos('');
    setGuardandoDatos(true);
    try {
      const { data } = await api.put('/cuenta/datos', datos);
      setCuenta(data);
      setDatos(datosDe(data));
      actualizarUsuario({ nombre: data.nombre, correo: data.correo });
      aviso.exito('Datos actualizados', { mensaje: 'Tu información se guardó correctamente.' });
    } catch (err) {
      setErrorDatos(err.response?.data?.error || 'No se pudieron guardar los cambios');
    } finally {
      setGuardandoDatos(false);
    }
  }

  async function cambiarClave(e) {
    e.preventDefault();
    setErrorClave('');
    setGuardandoClave(true);
    try {
      await api.put('/cuenta/contrasena', {
        contrasenaActual: clave.actual,
        contrasenaNueva: clave.nueva,
      });
      setClave({ actual: '', nueva: '', repetir: '' });
      aviso.exito('Contraseña actualizada', { mensaje: 'Úsala la próxima vez que inicies sesión.' });
    } catch (err) {
      setErrorClave(err.response?.data?.error || 'No se pudo cambiar la contraseña');
    } finally {
      setGuardandoClave(false);
    }
  }

  const cambiarDato = (k) => (e) => setDatos({ ...datos, [k]: e.target.value });
  const cambiarClaveCampo = (k) => (e) => setClave({ ...clave, [k]: e.target.value });

  return (
    <div className="max-w-3xl space-y-6 font-sans text-zinc-800 dark:text-zinc-200">
      {/* Encabezado del perfil */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="relative h-28 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 overflow-hidden">
          <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-fuchsia-300/30 blur-3xl animate-flotar" />
          <div className="absolute -bottom-12 right-8 w-56 h-56 rounded-full bg-indigo-300/30 blur-3xl animate-flotar-lento" />
          <div
            className="absolute inset-0 opacity-60"
            style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          />
        </div>
        <div className="px-6 sm:px-8 pb-6 -mt-12 flex flex-col sm:flex-row sm:items-end gap-4">
          <Avatar
            nombre={cuenta.nombre} fotoUrl={cuenta.fotoUrl} tamano="w-24 h-24" redondeo="rounded-3xl"
            letra="bg-gradient-to-br from-indigo-500 to-fuchsia-500 border-4 border-white dark:border-zinc-900 text-4xl text-white shadow-xl"
            borde="border-4 border-white dark:border-zinc-900 shadow-xl"
          />
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">{cuenta.nombre}</h1>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 truncate">{cuenta.correo}</p>
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mt-1">Cuenta creada el {fecha(cuenta.creadoEn)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:pb-1">
            <span className="px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
              {ROLES[cuenta.rol] || cuenta.rol}
            </span>
            {esPropietario && <Badge estado={cuenta.propietario.estado} />}
          </div>
        </div>
      </div>

      {/* Foto de perfil */}
      <div className={tarjeta}>
        <div className="mb-6">
          <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Foto de perfil</h2>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
            Sube una imagen JPG, PNG o WEBP. Se recorta en cuadrado desde el centro automáticamente.
          </p>
        </div>

        {errorFoto && <div className={`mb-5 ${alertaError}`}>{errorFoto}</div>}

        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <Avatar
            nombre={cuenta.nombre} fotoUrl={cuenta.fotoUrl} vistaPrevia={fotoNueva?.vista}
            tamano="w-28 h-28" redondeo="rounded-3xl"
            letra="bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white text-5xl shadow-lg"
            borde="shadow-lg ring-4 ring-indigo-100 dark:ring-indigo-950/60"
          />

          <div className="flex flex-wrap items-center gap-3">
            <input id="foto-perfil" type="file" accept="image/jpeg,image/png,image/webp" onChange={elegirFoto} className="hidden" />

            {fotoNueva ? (
              <>
                <button
                  type="button" onClick={guardarFoto} disabled={guardandoFoto}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm transition-colors text-sm disabled:opacity-50"
                >
                  {guardandoFoto ? 'Guardando...' : 'Guardar foto'}
                </button>
                <label htmlFor="foto-perfil" className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm cursor-pointer">
                  Elegir otra
                </label>
                <button
                  type="button" onClick={() => setFotoNueva(null)} disabled={guardandoFoto}
                  className="px-5 py-2.5 rounded-xl text-zinc-500 dark:text-zinc-400 font-bold hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors text-sm disabled:opacity-50"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <label htmlFor="foto-perfil" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm transition-colors text-sm cursor-pointer">
                  {cuenta.fotoUrl ? 'Cambiar foto' : 'Subir foto'}
                </label>
                {cuenta.fotoUrl && (
                  <button
                    type="button" onClick={quitarFoto}
                    className="px-5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-sm"
                  >
                    Quitar foto
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {fotoNueva && (
          <p className="mt-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Así se verá tu foto. Pulsa «Guardar foto» para confirmar.
          </p>
        )}
      </div>

      {/* Datos personales */}
      <form onSubmit={guardarDatos} className={tarjeta}>
        <div className="mb-6">
          <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Datos personales</h2>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
            Actualiza tu nombre, tu correo de acceso{esPropietario ? ' y tu teléfono' : ''}.
          </p>
        </div>

        {errorDatos && <div className={`mb-5 ${alertaError}`}>{errorDatos}</div>}

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="nombre" className={etiqueta}>Nombre completo</label>
            <input id="nombre" value={datos.nombre} onChange={cambiarDato('nombre')} className={campo} required />
          </div>
          <div className={esPropietario ? '' : 'sm:col-span-2'}>
            <label htmlFor="correo" className={etiqueta}>Correo electrónico</label>
            <input id="correo" type="email" value={datos.correo} onChange={cambiarDato('correo')} className={campo} required />
          </div>
          {esPropietario && (
            <div>
              <label htmlFor="telefono" className={etiqueta}>Teléfono</label>
              <input id="telefono" value={datos.telefono} onChange={cambiarDato('telefono')} placeholder="Ej: 3001234567" className={campo} />
            </div>
          )}

          {esPropietario && (
            <>
              <div>
                <label className={etiqueta}>Documento</label>
                <input value={cuenta.propietario.documento} disabled className={campo} />
              </div>
              <div>
                <label className={etiqueta}>Casa / Lote</label>
                <input value={cuenta.propietario.casaLote} disabled className={campo} />
              </div>
              <p className="sm:col-span-2 flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <Icono nombre="candado" className="w-4 h-4 shrink-0" />
                El documento y la casa solo los puede cambiar la administración.
              </p>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-7">
          <button
            type="button"
            disabled={!huboCambios || guardandoDatos}
            onClick={() => { setDatos(original); setErrorDatos(''); }}
            className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Descartar
          </button>
          <button
            disabled={!huboCambios || guardandoDatos}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {guardandoDatos ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      {/* Contraseña */}
      <form onSubmit={cambiarClave} className={tarjeta}>
        <div className="mb-6">
          <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Cambiar contraseña</h2>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
            Por seguridad, necesitamos tu contraseña actual.
          </p>
        </div>

        {errorClave && <div className={`mb-5 ${alertaError}`}>{errorClave}</div>}

        <div className="space-y-4">
          <CampoClave
            id="clave-actual" etiquetaTexto="Contraseña actual" autoComplete="current-password"
            valor={clave.actual} onChange={cambiarClaveCampo('actual')}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <CampoClave
              id="clave-nueva" etiquetaTexto="Nueva contraseña" autoComplete="new-password" placeholder="Mínimo 6 caracteres"
              valor={clave.nueva} onChange={cambiarClaveCampo('nueva')}
            />
            <CampoClave
              id="clave-repetir" etiquetaTexto="Repite la nueva contraseña" autoComplete="new-password"
              valor={clave.repetir} onChange={cambiarClaveCampo('repetir')}
            />
          </div>

          {clave.nueva && (
            <div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${n <= nivel ? NIVELES[nivel].barra : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                ))}
              </div>
              <p className="mt-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                Seguridad: <span className="text-zinc-800 dark:text-zinc-200">{NIVELES[nivel].texto}</span>
                <span className="font-medium"> · Mejora con 8+ caracteres, mayúsculas, números y símbolos.</span>
              </p>
            </div>
          )}

          {clave.repetir && (
            <p className={`flex items-center gap-1.5 text-xs font-bold ${coinciden ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {coinciden && <Icono nombre="check" className="w-4 h-4" />}
              {coinciden ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
            </p>
          )}
        </div>

        <div className="flex justify-end mt-7">
          <button
            disabled={!puedeCambiarClave}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {guardandoClave ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </div>
      </form>
    </div>
  );
}
