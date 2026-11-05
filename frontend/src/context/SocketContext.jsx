import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const SocketContext = createContext({ socket: null, noLeidos: 0 });

const HOST = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '');

// Mantiene UNA conexión de chat mientras haya sesión (admin o propietario)
// y el contador de mensajes sin leer para el menú.
export function SocketProvider({ children }) {
  const { usuario } = useAuth();
  const [socket, setSocket] = useState(null);
  const [noLeidos, setNoLeidos] = useState(0);

  const refrescar = useCallback(async () => {
    try {
      const { data } = await api.get('/chat/no-leidos');
      setNoLeidos(data.total);
    } catch {
      /* si falla, se deja el valor anterior */
    }
  }, []);

  useEffect(() => {
    if (!usuario || !['ADMIN', 'PROPIETARIO'].includes(usuario.rol)) {
      setSocket(null);
      setNoLeidos(0);
      return;
    }

    const s = io(HOST, { auth: { token: localStorage.getItem('token') } });
    setSocket(s);
    refrescar();

    const alNuevo = (m) => { if (m.emisor.rol !== usuario.rol) refrescar(); };
    s.on('mensaje:nuevo', alNuevo);
    s.on('mensajes:leidos', refrescar);

    return () => {
      s.off('mensaje:nuevo', alNuevo);
      s.off('mensajes:leidos', refrescar);
      s.disconnect();
    };
  }, [usuario?.id, usuario?.rol, refrescar]);

  return (
    <SocketContext.Provider value={{ socket, noLeidos, refrescar }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
