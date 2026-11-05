import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import VentanaChat from '../../components/VentanaChat';
import Avatar from '../../components/Avatar';

const hora = (f) => {
  const d = new Date(f);
  const esHoy = d.toDateString() === new Date().toDateString();
  return esHoy
    ? d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
};

export default function ChatAdmin() {
  const { socket } = useSocket();
  const [lista, setLista] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [sel, setSel] = useState(null);

  const cargar = useCallback(async () => {
    const { data } = await api.get('/chat/conversaciones');
    setLista(data);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (!socket) return;
    socket.on('mensaje:nuevo', cargar);
    socket.on('mensajes:leidos', cargar);
    return () => {
      socket.off('mensaje:nuevo', cargar);
      socket.off('mensajes:leidos', cargar);
    };
  }, [socket, cargar]);

  const filtrada = lista.filter((c) =>
    `${c.nombre} ${c.casaLote}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="font-sans text-zinc-800 dark:text-zinc-200">
      <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mb-6">Chat con propietarios</h1>

      <div className="grid md:grid-cols-3 gap-6 h-[75vh]">
        <div className={`${sel ? 'hidden md:flex' : 'flex'} flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden min-h-0`}>
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
            <input
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar propietario o casa..."
              className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <ul className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {filtrada.length === 0 && <li className="p-4 text-sm text-zinc-500 dark:text-zinc-400">Sin resultados</li>}
            {filtrada.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setSel(c)}
                  className={`w-full text-left p-4 flex items-start gap-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${sel?.id === c.id ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-l-4 border-indigo-600 dark:border-indigo-400' : 'border-l-4 border-transparent'}`}
                >
                  <Avatar nombre={c.nombre} fotoUrl={c.fotoUrl} tamano="w-12 h-12" />
                  <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{c.casaLote}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      {c.ultimo && <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{hora(c.ultimo.creadoEn)}</span>}
                      {c.sinLeer > 0 && (
                        <span className="bg-indigo-600 text-white text-[10px] font-bold rounded-full px-2 py-0.5">{c.sinLeer}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{c.nombre}</p>
                  {c.ultimo && (
                    <p className={`text-xs truncate mt-1.5 ${c.sinLeer > 0 ? 'text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-500 dark:text-zinc-400'}`}>
                      {c.ultimo.emisorRol === 'ADMIN' ? 'Tú: ' : ''}{c.ultimo.contenido}
                    </p>
                  )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={`${sel ? 'flex' : 'hidden md:flex'} md:col-span-2 flex-col min-h-0 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden`}>
          {sel ? (
            <>
              <button onClick={() => setSel(null)} className="md:hidden text-sm font-semibold text-indigo-600 dark:text-indigo-400 p-4 border-b border-zinc-100 dark:border-zinc-800 text-left bg-zinc-50 dark:bg-zinc-800">
                ← Volver a la lista
              </button>
              <VentanaChat key={sel.id} propietarioId={sel.id} titulo={sel.casaLote} subtitulo={sel.nombre} fotoUrl={sel.fotoUrl} nombreFoto={sel.nombre} />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 text-sm p-6 text-center">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl mb-3 flex items-center justify-center">
                <svg className="w-6 h-6 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              Selecciona una conversación en el panel izquierdo
            </div>
          )}
        </div>
      </div>
    </div>
  );
}