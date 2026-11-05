import { useAuth } from '../context/AuthContext';

export default function PanelPropietario() {
  const { usuario, logout } = useAuth();
  
  return (
    <div className="space-y-6 font-sans">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Mi cuenta</h1>
          <p className="text-sm font-medium text-zinc-500 mt-1">Portal administrativo del residente</p>
        </div>
        <button 
          onClick={logout} 
          className="sm:hidden px-4 py-2 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-rose-50 hover:text-rose-600"
        >
          Cerrar sesión
        </button>
      </header>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 text-center sm:text-left">
        <h2 className="text-xl font-bold text-zinc-800 mb-3">¡Hola, {usuario.nombre}! 👋</h2>
        <p className="text-zinc-600 leading-relaxed max-w-3xl">
          En este portal podrás consultar el estado de <span className="font-semibold text-indigo-600">tus pagos</span>, 
          gestionar la autorización de <span className="font-semibold text-indigo-600">tus visitantes</span>, 
          leer los comunicados del <span className="font-semibold text-indigo-600">tablero</span> y comunicarte directamente por <span className="font-semibold text-indigo-600">chat</span> con la administración.
        </p>
      </div>
    </div>
  );
}