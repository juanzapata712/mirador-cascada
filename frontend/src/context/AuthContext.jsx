import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  });

  async function login(correo, contrasena) {
    const { data } = await api.post('/auth/login', { correo, contrasena });
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data.usuario;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  }

  // Actualiza los datos de la sesión (nombre, correo, foto) sin volver a iniciar sesión
  function actualizarUsuario(cambios) {
    setUsuario((actual) => {
      const nuevo = { ...actual, ...cambios };
      localStorage.setItem('usuario', JSON.stringify(nuevo));
      return nuevo;
    });
  }

  // Al abrir la app o iniciar sesión, trae los datos al día (incluida la foto de perfil)
  useEffect(() => {
    if (!usuario?.id) return;
    api.get('/cuenta')
      .then(({ data }) => actualizarUsuario({ nombre: data.nombre, correo: data.correo, fotoUrl: data.fotoUrl ?? null }))
      .catch(() => { /* si falla, se sigue con lo guardado */ });
  }, [usuario?.id]);

  return (
    <AuthContext.Provider value={{ usuario, login, logout, actualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
