import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAvisos } from '../../components/Avisos';

const VACIO = {
  nombre: '', correo: '', contrasena: '', documento: '', telefono: '', casaLote: '', estado: 'ACTIVO',
};

const colorEstado = {
  ACTIVO: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400',
  MOROSO: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400',
  INACTIVO: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
};

export default function Propietarios() {
  const { confirmar, aviso } = useAvisos();
  const [lista, setLista] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState('');

  async function cargar() {
    setCargando(true);
    const { data } = await api.get('/propietarios');
    setLista(data);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  function abrirNuevo() {
    setEditandoId(null);
    setForm(VACIO);
    setError('');
  }

  function abrirEditar(p) {
    setEditandoId(p.id);
    setForm({
      nombre: p.usuario.nombre, correo: p.usuario.correo, contrasena: '',
      documento: p.documento, telefono: p.telefono || '', casaLote: p.casaLote, estado: p.estado,
    });
    setError('');
  }

  async function guardar(e) {
    e.preventDefault();
    setError('');
    try {
      if (editandoId) await api.put(`/propietarios/${editandoId}`, form);
      else await api.post('/propietarios', form);
      aviso.exito(editandoId ? 'Datos actualizados' : 'Propietario registrado', {
        mensaje: `${form.nombre} · ${form.casaLote}`,
      });
      setForm(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar');
    }
  }

  async function alternarActivo(p) {
    const suspender = p.usuario.activo;
    const ok = await confirmar({
      tipo: suspender ? 'peligro' : 'exito',
      titulo: suspender ? 'Suspender acceso' : 'Reactivar acceso',
      mensaje: suspender
        ? 'No podrá iniciar sesión hasta que lo vuelvas a activar.'
        : 'Podrá volver a iniciar sesión en la plataforma.',
      detalle: [
        { etiqueta: 'Residente', valor: p.usuario.nombre },
        { etiqueta: 'Casa / Lote', valor: p.casaLote },
      ],
      confirmarTexto: suspender ? 'Sí, suspender' : 'Sí, activar',
      cancelarTexto: 'Volver',
    });
    if (!ok) return;
    try {
      await api.patch(`/propietarios/${p.id}/activo`);
      if (suspender) aviso.alerta('Acceso suspendido', { mensaje: `${p.usuario.nombre} ya no puede iniciar sesión.` });
      else aviso.exito('Acceso reactivado', { mensaje: `${p.usuario.nombre} ya puede iniciar sesión.` });
      cargar();
    } catch (err) {
      aviso.error('No se pudo cambiar el acceso', { mensaje: err.response?.data?.error });
    }
  }

  const filtrada = lista.filter((p) =>
    `${p.usuario.nombre} ${p.casaLote} ${p.documento}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  return (
    <div className="font-sans text-zinc-800 dark:text-zinc-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Directorio de propietarios</h1>
        <button onClick={abrirNuevo} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all">
          + Nuevo propietario
        </button>
      </div>

      <div className="mb-6 relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, casa o documento..."
          className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-left text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider font-bold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-4">Casa / Lote</th><th className="p-4">Residente</th>
                <th className="p-4">Documento</th><th className="p-4">Teléfono</th>
                <th className="p-4">Estado Cartera</th><th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {cargando && <tr><td colSpan="6" className="p-8 text-center text-zinc-500 dark:text-zinc-400 font-medium">Cargando...</td></tr>}
              {!cargando && filtrada.length === 0 && (
                <tr><td colSpan="6" className="p-8 text-center text-zinc-500 dark:text-zinc-400 font-medium">No hay propietarios registrados</td></tr>
              )}
              {filtrada.map((p) => (
                <tr key={p.id} className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors ${!p.usuario.activo ? 'opacity-50' : ''}`}>
                  <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">{p.casaLote}</td>
                  <td className="p-4">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">{p.usuario.nombre}</span>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{p.usuario.correo}</span>
                  </td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-300 font-medium">{p.documento}</td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-300 font-medium">{p.telefono || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${colorEstado[p.estado]}`}>{p.estado}</span>
                    {!p.usuario.activo && <span className="ml-2 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-white">Inhabilitado</span>}
                  </td>
                  <td className="p-4 whitespace-nowrap text-right">
                    <button onClick={() => abrirEditar(p)} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 mr-4">Editar</button>
                    <button onClick={() => alternarActivo(p)} className={`text-sm font-semibold ${p.usuario.activo ? 'text-rose-600 dark:text-rose-400 hover:text-rose-700' : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'}`}>
                      {p.usuario.activo ? 'Suspender' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={guardar} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-6">{editandoId ? 'Actualizar propietario' : 'Registrar propietario'}</h2>
            {error && <div className="mb-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-sm font-medium p-3 rounded-xl">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5 ml-1">Nombre completo</label>
                <input value={form.nombre} onChange={cambiar('nombre')} className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5 ml-1">Correo electrónico</label>
                <input type="email" value={form.correo} onChange={cambiar('correo')} className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5 ml-1">{editandoId ? 'Nueva contraseña (opcional)' : 'Contraseña de acceso'}</label>
                <input type="password" value={form.contrasena} onChange={cambiar('contrasena')} className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" required={!editandoId} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5 ml-1">Nº Documento</label>
                  <input value={form.documento} onChange={cambiar('documento')} className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5 ml-1">Teléfono</label>
                  <input value={form.telefono} onChange={cambiar('telefono')} className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5 ml-1">Identificador de propiedad</label>
                <input placeholder="Ej: Manzana B - Casa 12" value={form.casaLote} onChange={cambiar('casaLote')} className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" required />
              </div>
              {editandoId && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5 ml-1">Estado de cartera (Manual)</label>
                  <select value={form.estado} onChange={cambiar('estado')} className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold">
                    <option value="ACTIVO">Al día (Activo)</option>
                    <option value="MOROSO">En mora (Moroso)</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button type="button" onClick={() => setForm(null)} className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm">Cancelar</button>
              <button className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm transition-colors text-sm">Guardar cambios</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}