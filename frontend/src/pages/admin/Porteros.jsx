import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAvisos } from '../../components/Avisos';

const VACIO = { nombre: '', correo: '', contrasena: '' };

export default function Porteros() {
  const { confirmar, aviso } = useAvisos();
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState('');

  async function cargar() {
    const { data } = await api.get('/porteros');
    setLista(data);
  }

  useEffect(() => { cargar(); }, []);

  async function crear(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/porteros', form);
      setForm(VACIO);
      aviso.exito('Portero registrado', { mensaje: `${form.nombre} ya puede ingresar al módulo de portería.` });
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear');
    }
  }

  async function alternar(p) {
    const ok = await confirmar({
      tipo: p.activo ? 'peligro' : 'exito',
      titulo: p.activo ? 'Desactivar acceso' : 'Activar acceso',
      mensaje: p.activo
        ? 'No podrá iniciar sesión en la portería hasta que lo actives de nuevo.'
        : 'Podrá volver a iniciar sesión en el módulo de portería.',
      detalle: [
        { etiqueta: 'Portero', valor: p.nombre },
        { etiqueta: 'Correo', valor: p.correo },
      ],
      confirmarTexto: p.activo ? 'Sí, desactivar' : 'Sí, activar',
      cancelarTexto: 'Volver',
    });
    if (!ok) return;
    try {
      await api.patch(`/porteros/${p.id}/activo`);
      if (p.activo) aviso.alerta('Acceso desactivado', { mensaje: `${p.nombre} ya no puede ingresar.` });
      else aviso.exito('Acceso activado', { mensaje: `${p.nombre} ya puede ingresar.` });
      cargar();
    } catch (err) {
      aviso.error('No se pudo cambiar el acceso', { mensaje: err.response?.data?.error });
    }
  }

  const cambiar = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-6 font-sans text-zinc-800 dark:text-zinc-200">
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Personal de portería</h1>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">Gestión de accesos exclusivos al módulo de validación de visitantes.</p>
      </div>

      <form onSubmit={crear} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        <div>
          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5 ml-1">Nombre</label>
          <input placeholder="Ej. Carlos Ruiz" value={form.nombre} onChange={cambiar('nombre')} className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" required />
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5 ml-1">Correo electrónico</label>
          <input type="email" placeholder="portero@correo.com" value={form.correo} onChange={cambiar('correo')} className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" required />
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5 ml-1">Contraseña</label>
          <input type="password" placeholder="Mínimo 6 caracteres" value={form.contrasena} onChange={cambiar('contrasena')} className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" required />
        </div>
        <div className="pt-6">
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-2.5 text-sm font-bold shadow-sm transition-all h-[42px]">Registrar portero</button>
        </div>
        {error && <p className="md:col-span-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-sm font-medium p-3 rounded-xl">{error}</p>}
      </form>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-left text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider font-bold border-b border-zinc-200 dark:border-zinc-800">
              <tr><th className="p-4">Nombre</th><th className="p-4">Correo</th><th className="p-4">Estado</th><th className="p-4">Acción</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {lista.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-zinc-500 dark:text-zinc-400 font-medium">Aún no hay porteros registrados</td></tr>}
              {lista.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">{p.nombre}</td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-400 font-medium">{p.correo}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${p.activo ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button onClick={() => alternar(p)} className={`text-sm font-semibold hover:underline underline-offset-2 ${p.activo ? 'text-rose-600 dark:text-rose-400 hover:text-rose-700' : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700'}`}>
                      {p.activo ? 'Desactivar acceso' : 'Activar acceso'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}