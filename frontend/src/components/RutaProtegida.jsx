import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Uso: <RutaProtegida rol="ADMIN">  o  <RutaProtegida roles={['ADMIN','PORTERO']}>
export default function RutaProtegida({ rol, roles, children }) {
  const { usuario } = useAuth();
  const permitidos = roles || (rol ? [rol] : null);

  if (!usuario) return <Navigate to="/login" replace />;
  if (permitidos && !permitidos.includes(usuario.rol)) return <Navigate to="/login" replace />;
  return children;
}
