import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Escaner from '../../components/Escaner';
import { useAvisos } from '../../components/Avisos';
import { hoy, fechaCO, horaCO } from '../../utils/formato';

export default function Porteria() {
  const { aviso } = useAvisos();
  const [camara, setCamara] = useState(false);
  const [errorCamara, setErrorCamara] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [codigoUsado, setCodigoUsado] = useState(''); // código que se escaneó o escribió
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [esperados, setEsperados] = useState([]);
  const [dentro, setDentro] = useState([]);

  async function cargarListas() {
    const [a, b] = await Promise.all([
      api.get('/visitantes', { params: { estado: 'PROGRAMADA', fecha: hoy() } }),
      api.get('/visitantes', { params: { estado: 'INGRESO' } }),
    ]);
    setEsperados(a.data);
    setDentro(b.data);
  }

  useEffect(() => {
    cargarListas();
    const t = setInterval(cargarListas, 30000);
    return () => clearInterval(t);
  }, []);

  async function verificar(texto) {
    const c = String(texto).trim().toUpperCase();
    if (!c) return;
    setCamara(false);
    setError(''); setResultado(null);
    try {
      const { data } = await api.get(`/visitantes/codigo/${encodeURIComponent(c)}`);
      setCodigoUsado(c);
      setResultado(data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo verificar el código');
    }
  }

  async function registrar(tipo) {
    try {
      // El servidor exige el código para registrar el ingreso
      await api.patch(`/visitantes/${resultado.visitante.id}/${tipo}`, { codigo: codigoUsado });
      aviso.exito(
        tipo === 'ingreso' ? 'Ingreso registrado' : 'Salida registrada',
        { mensaje: `${resultado.visitante.nombre} · ${resultado.visitante.propietario.casaLote}` }
      );
      setResultado(null);
      setCodigo('');
      setCodigoUsado('');
      cargarListas();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar');
    }
  }

  function abrirCamara() {
    setErrorCamara(false); setResultado(null); setError('');
    setCamara(true);
  }

  const v = resultado?.visitante;
  const valido = resultado?.accion;

  return (
    <div className="space-y-6 font-sans text-zinc-800 dark:text-zinc-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 space-y-5">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Verificar visitante</h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
            Para registrar un ingreso, el visitante debe presentar su QR o su código.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={camara ? () => setCamara(false) : abrirCamara}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors"
          >
            {camara ? 'Cerrar cámara' : '📷 Escanear QR'}
          </button>
          <form onSubmit={(e) => { e.preventDefault(); verificar(codigo); }} className="flex gap-2 flex-1">
            <input
              value={codigo} onChange={(e) => setCodigo(e.target.value)}
              placeholder="o escribe el código (ej: A3F09C1B)"
              className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 flex-1 uppercase font-mono text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <button className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Buscar</button>
          </form>
        </div>

        {camara && (
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
            <Escaner onCodigo={verificar} onError={() => setErrorCamara(true)} />
            {errorCamara && (
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-4 border-t border-amber-100 dark:border-amber-900/50">
                No se pudo abrir la cámara (revisa el permiso o que la página use https). Puedes escribir el código a mano.
              </p>
            )}
          </div>
        )}

        {error && <p className="bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 p-4 rounded-xl font-bold">{error}</p>}

        {v && (
          <div className={`rounded-2xl border-2 p-5 space-y-3 ${valido ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30' : 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/30'}`}>
            <p className={`font-black text-lg ${valido ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
              {valido ? '✔' : '✖'} {resultado.mensaje}
            </p>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              <p><b className="text-zinc-900 dark:text-zinc-100">Visitante:</b> {v.nombre}</p>
              <p><b className="text-zinc-900 dark:text-zinc-100">Documento:</b> {v.documento}</p>
              <p><b className="text-zinc-900 dark:text-zinc-100">Placa:</b> {v.placa || '-'}</p>
              <p><b className="text-zinc-900 dark:text-zinc-100">Fecha:</b> {fechaCO(v.fechaVisita)}</p>
              <p><b className="text-zinc-900 dark:text-zinc-100">Visita a:</b> {v.propietario.casaLote} <span className="text-zinc-500 dark:text-zinc-400">({v.propietario.usuario.nombre})</span></p>
              <p><b className="text-zinc-900 dark:text-zinc-100">Teléfono:</b> {v.propietario.telefono || '-'}</p>
              {v.motivo && <p className="sm:col-span-2"><b className="text-zinc-900 dark:text-zinc-100">Motivo:</b> {v.motivo}</p>}
            </div>
            <div className="flex flex-wrap gap-3 pt-4">
              {resultado.accion === 'INGRESO' && (
                <button onClick={() => registrar('ingreso')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors">
                  Registrar INGRESO
                </button>
              )}
              {resultado.accion === 'SALIDA' && (
                <button onClick={() => registrar('salida')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors">
                  Registrar SALIDA
                </button>
              )}
              <button onClick={() => setResultado(null)} className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-bold text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">Cerrar</button>
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Esperados: solo informativa. El ingreso se registra con el QR o el código. */}
        <Lista
          titulo="Esperados hoy"
          vacio="No hay visitas programadas para hoy"
          nota="Para ingresar deben presentar su QR o código."
          items={esperados}
          detalle={(x) => `${x.propietario.casaLote}${x.placa ? ' · ' + x.placa : ''}`}
        />
        <Lista
          titulo="Dentro ahora"
          vacio="No hay visitantes dentro"
          items={dentro}
          onVerificar={verificar}
          textoBoton="Registrar salida"
          detalle={(x) => `${x.propietario.casaLote} · entró ${horaCO(x.horaIngreso)}`}
        />
      </div>
    </div>
  );
}

function Lista({ titulo, vacio, nota, items, detalle, onVerificar, textoBoton = 'Verificar' }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-5">
      <h2 className="font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
        {titulo} <span className="text-zinc-400 dark:text-zinc-500 font-bold ml-1">({items.length})</span>
      </h2>
      {nota && <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">{nota}</p>}
      <div className="mt-4">
        {items.length === 0 && <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl text-center border border-zinc-100 dark:border-zinc-800 border-dashed">{vacio}</p>}
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {items.map((x) => (
            <li key={x.id} className="py-3 flex items-center justify-between gap-3 group">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{x.nombre}</p>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">{detalle(x)}</p>
              </div>
              {onVerificar ? (
                <button onClick={() => onVerificar(x.codigoQr)} className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline underline-offset-2 text-sm shrink-0 transition-all">{textoBoton}</button>
              ) : (
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 px-2.5 py-1 rounded-md shrink-0">Falta código</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
