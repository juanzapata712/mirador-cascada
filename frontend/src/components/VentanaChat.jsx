import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Avatar from './Avatar';

const hora = (f) => new Date(f).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
const dia = (f) => new Date(f).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });

export default function VentanaChat({ propietarioId = null, titulo, subtitulo, fotoUrl, nombreFoto }) {
  const { usuario } = useAuth();
  const { socket } = useSocket();
  const esAdmin = usuario.rol === 'ADMIN';

  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const fondo = useRef(null);

  async function cargar() {
    const url = esAdmin ? `/chat/mensajes/${propietarioId}` : '/chat/mios';
    const { data } = await api.get(url);
    setMensajes(data);
    setCargando(false);
  }

  useEffect(() => {
    setCargando(true);
    setMensajes([]);
    cargar();
  }, [propietarioId]);

  useEffect(() => {
    if (!socket) return;
    const marcarLeidos = () => socket.emit('mensajes:leer', { propietarioId });
    const alRecibir = (m) => {
      if (esAdmin && m.propietarioId !== propietarioId) return;
      setMensajes((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      if (m.emisor.rol !== usuario.rol) marcarLeidos();
    };
    const alLeer = (d) => {
      if (esAdmin && d.propietarioId !== propietarioId) return;
      if (d.por !== usuario.rol) {
        setMensajes((prev) => prev.map((m) => (m.emisor.rol === usuario.rol ? { ...m, leido: true } : m)));
      }
    };

    socket.on('mensaje:nuevo', alRecibir);
    socket.on('mensajes:leidos', alLeer);
    socket.on('connect', cargar);
    marcarLeidos();

    return () => {
      socket.off('mensaje:nuevo', alRecibir);
      socket.off('mensajes:leidos', alLeer);
      socket.off('connect', cargar);
    };
  }, [socket, propietarioId]);

  useEffect(() => {
    fondo.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  function enviar(e) {
    e.preventDefault();
    const contenido = texto.trim();
    if (!contenido || !socket) return;
    setEnviando(true);
    setError('');
    socket.timeout(5000).emit('mensaje:enviar', { propietarioId, contenido }, (err, resp) => {
      setEnviando(false);
      if (err) return setError('El servidor no respondió. Intenta de nuevo.');
      if (resp?.error) return setError(resp.error);
      setTexto('');
    });
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden font-sans">
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-10 flex items-center gap-3">
        {nombreFoto && <Avatar nombre={nombreFoto} fotoUrl={fotoUrl} tamano="w-11 h-11" />}
        <div className="min-w-0">
          <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{titulo}</p>
          {subtitulo && <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{subtitulo}</p>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/50 dark:bg-zinc-950/50">
        {cargando && (
          <div className="flex justify-center mt-10">
            <span className="text-sm font-medium text-zinc-400 bg-white dark:bg-zinc-800 px-4 py-2 rounded-full shadow-sm border border-zinc-100 dark:border-zinc-700">Cargando mensajes...</span>
          </div>
        )}
        {!cargando && mensajes.length === 0 && (
          <div className="flex justify-center mt-10">
            <span className="text-sm font-medium text-zinc-400 bg-white dark:bg-zinc-800 px-4 py-2 rounded-full shadow-sm border border-zinc-100 dark:border-zinc-700">Aún no hay mensajes. ¡Escribe el primero!</span>
          </div>
        )}

        {mensajes.map((m, i) => {
          const mio = m.emisor.rol === usuario.rol;
          const nuevoDia = i === 0 || dia(m.creadoEn) !== dia(mensajes[i - 1].creadoEn);
          return (
            <div key={m.id}>
              {nuevoDia && (
                <div className="flex justify-center my-4">
                  <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">{dia(m.creadoEn)}</span>
                </div>
              )}
              <div className={`flex ${mio ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-[15px] shadow-sm relative group ${mio ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-bl-none'}`}>
                  <p className="whitespace-pre-wrap break-words leading-snug">{m.contenido}</p>
                  <p className={`text-[10px] mt-1 text-right font-medium ${mio ? 'text-indigo-200' : 'text-zinc-400 dark:text-zinc-400'}`}>
                    {hora(m.creadoEn)} {mio && (m.leido ? '✓✓' : '✓')}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={fondo} />
      </div>

      <form onSubmit={enviar} className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex gap-3">
        <input
          value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={1000}
          placeholder={socket ? 'Escribe un mensaje...' : 'Conectando...'}
          disabled={!socket}
          className="flex-1 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 rounded-full px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-800 transition-all disabled:opacity-50"
        />
        <button
          disabled={!socket || enviando || !texto.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 rounded-full text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Enviar
        </button>
      </form>
      {error && <p className="px-4 pb-2 text-xs text-rose-500 bg-white dark:bg-zinc-900">{error}</p>}
    </div>
  );
}