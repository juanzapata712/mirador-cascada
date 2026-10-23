import { useAuth } from '../context/AuthContext';

export default function PanelAdmin() {
  const { usuario, logout } = useAuth();
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Panel del administrador</h1>
        <button onClick={logout} className="text-sm text-red-600 underline">Cerrar sesión</button>
      </div>
      <p>Bienvenido, {usuario.nombre}. Aquí irán: propietarios, pagos, visitantes, tablero y chat.</p>
    </div>
  );
}
