import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RutaProtegida({ rol, children }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (rol && usuario.rol !== rol) return <Navigate to="/login" replace />;
  return children;
}
