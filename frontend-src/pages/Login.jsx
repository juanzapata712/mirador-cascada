import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');

  async function enviar(e) {
    e.preventDefault();
    setError('');
    try {
      const u = await login(correo, contrasena);
      navigate(u.rol === 'ADMIN' ? '/admin' : '/propietario');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar sesión');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50 p-4">
      <form onSubmit={enviar} className="bg-white w-full max-w-sm p-8 rounded-2xl shadow-md space-y-4">
        <h1 className="text-2xl font-bold text-emerald-800 text-center">Mirador de la Cascada</h1>
        <p className="text-center text-sm text-gray-500">Ingresa a tu cuenta</p>
        {error && <p className="bg-red-50 text-red-600 text-sm p-2 rounded">{error}</p>}
        <input
          type="email" placeholder="Correo" value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          className="w-full border rounded-lg p-2" required
        />
        <input
          type="password" placeholder="Contraseña" value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          className="w-full border rounded-lg p-2" required
        />
        <button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg p-2 font-medium">
          Entrar
        </button>
      </form>
    </div>
  );
}
