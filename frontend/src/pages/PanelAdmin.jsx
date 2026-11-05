import { useAuth } from '../context/AuthContext';

export default function PanelAdmin() {
  const { usuario, logout } = useAuth();
  
  return (
    <div className="space-y-6 font-sans">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Panel del administrador</h1>
          <p className="text-sm font-medium text-zinc-500 mt-1">Resumen y gestión general de la urbanización</p>
        </div>
        <button 
          onClick={logout} 
          className="sm:hidden px-4 py-2 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-rose-50 hover:text-rose-600"
        >
          Cerrar sesión
        </button>
      </header>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 text-center sm:text-left">
        <h2 className="text-xl font-bold text-zinc-800 mb-3">¡Bienvenido, {usuario.nombre}! 👋</h2>
        <p className="text-zinc-600 leading-relaxed max-w-3xl">
          Desde este panel podrás gestionar los <span className="font-semibold text-indigo-600">propietarios</span>, 
          revisar el estado de los <span className="font-semibold text-indigo-600">pagos y cuotas</span>, 
          controlar el acceso de los <span className="font-semibold text-indigo-600">visitantes</span>, publicar comunicados en el <span className="font-semibold text-indigo-600">tablero</span> y atender consultas a través del <span className="font-semibold text-indigo-600">chat</span>.
        </p>
      </div>
    </div>
  );
}