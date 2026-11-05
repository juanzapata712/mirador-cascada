import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAvisos } from '../../components/Avisos';
import TarjetaComunicado from '../../components/TarjetaComunicado';
import { CATEGORIAS } from '../../utils/categorias';

const VACIO = { titulo: '', contenido: '', categoria: 'GENERAL', fijado: false, quitarImagen: false };

export default function TableroAdmin() {
  const { confirmar, aviso } = useAvisos();
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(null);
  const [editando, setEditando] = useState(null);
  const [imagen, setImagen] = useState(null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function cargar() {
    const { data } = await api.get('/comunicados');
    setLista(data);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  function abrirNuevo() {
    setEditando(null); setForm(VACIO); setImagen(null); setError('');
  }

  function abrirEditar(c) {
    setEditando(c);
    setForm({ titulo: c.titulo, contenido: c.contenido, categoria: c.categoria, fijado: c.fijado, quitarImagen: false });
    setImagen(null); setError('');
  }

  async function guardar(e) {
    e.preventDefault();
    setError(''); setEnviando(true);
    try {
      const datos = new FormData();
      datos.append('titulo', form.titulo);
      datos.append('contenido', form.contenido);
      datos.append('categoria', form.categoria);
      datos.append('fijado', String(form.fijado));
      datos.append('quitarImagen', String(form.quitarImagen));
      if (imagen) datos.append('imagen', imagen);

      if (editando) await api.put(`/comunicados/${editando.id}`, datos);
      else await api.post('/comunicados', datos);

      aviso.exito(editando ? 'Anuncio actualizado' : '¡Anuncio publicado!', { mensaje: form.titulo });
      setForm(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar');
    } finally {
      setEnviando(false);
    }
  }

  async function fijar(c) {
    try {
      await api.patch(`/comunicados/${c.id}/fijar`);
      aviso.info(c.fijado ? 'Anuncio sin destacar' : 'Anuncio fijado arriba', { mensaje: c.titulo });
      cargar();
    } catch (err) {
      aviso.error('No se pudo cambiar el anuncio', { mensaje: err.response?.data?.error });
    }
  }

  async function eliminar(c) {
    const ok = await confirmar({
      tipo: 'peligro',
      titulo: 'Eliminar anuncio',
      mensaje: 'Esta acción no se puede deshacer. Los propietarios dejarán de verlo.',
      detalle: [{ etiqueta: 'Anuncio', valor: c.titulo }],
      confirmarTexto: 'Sí, eliminar',
      cancelarTexto: 'Volver',
    });
    if (!ok) return;
    try {
      await api.delete(`/comunicados/${c.id}`);
      aviso.alerta('Anuncio eliminado', { mensaje: c.titulo });
      cargar();
    } catch (err) {
      aviso.error('No se pudo eliminar', { mensaje: err.response?.data?.error });
    }
  }

  const cambiar = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="font-sans text-zinc-800 dark:text-zinc-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Tablero de anuncios</h1>
        <button onClick={abrirNuevo} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all">
          + Publicar anuncio
        </button>
      </div>

      {cargando && <p className="text-zinc-500 dark:text-zinc-400 font-medium">Cargando tablero...</p>}
      {!cargando && lista.length === 0 && <p className="text-zinc-500 dark:text-zinc-400 font-medium bg-white dark:bg-zinc-900 p-8 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 border-dashed">Aún no hay anuncios publicados en la comunidad.</p>}

      <div className="grid gap-6 max-w-3xl">
        {lista.map((c) => (
          <TarjetaComunicado key={c.id} c={c}>
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-4 text-sm font-semibold">
              <button onClick={() => abrirEditar(c)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">Editar</button>
              <button onClick={() => fijar(c)} className="text-amber-600 dark:text-amber-400 hover:text-amber-700">{c.fijado ? 'Quitar destacado' : 'Destacar (Fijar)'}</button>
              <button onClick={() => eliminar(c)} className="text-rose-600 dark:text-rose-400 hover:text-rose-700 ml-auto">Eliminar</button>
            </div>
          </TarjetaComunicado>
        ))}
      </div>

      {form && (
        <div className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={guardar} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-6">{editando ? 'Editar anuncio' : 'Crear nuevo anuncio'}</h2>
            {error && <div className="mb-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-sm font-medium p-3 rounded-xl">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5 ml-1">Título principal</label>
                <input value={form.titulo} onChange={cambiar('titulo')} className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5 ml-1">Categoría</label>
                <select value={form.categoria} onChange={cambiar('categoria')} className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium">
                  {Object.entries(CATEGORIAS).map(([clave, v]) => <option key={clave} value={clave}>{v.texto}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5 ml-1">Contenido del mensaje</label>
                <textarea
                  rows="6" value={form.contenido}
                  onChange={cambiar('contenido')} className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5 ml-1">Adjuntar Imagen (Opcional, JPG/PNG, máx. 3 MB)</label>
                <input type="file" accept="image/*" onChange={(e) => setImagen(e.target.files[0])} className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl p-2.5 text-sm file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 dark:file:bg-indigo-950/60 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 transition-all cursor-pointer" />
              </div>

              {editando?.imagenUrl && !imagen && (
                <label className="flex items-center gap-3 text-sm font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-100 dark:border-rose-900/50">
                  <input type="checkbox" checked={form.quitarImagen} onChange={(e) => setForm({ ...form, quitarImagen: e.target.checked })} className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4" />
                  Eliminar la imagen actual publicada
                </label>
              )}

              <label className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 mt-2">
                <input type="checkbox" checked={form.fijado} onChange={(e) => setForm({ ...form, fijado: e.target.checked })} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                <span><span className="mr-1">📌</span> Fijar en la parte superior del tablero</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button type="button" onClick={() => setForm(null)} className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm">Cancelar</button>
              <button disabled={enviando} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm transition-colors text-sm disabled:opacity-50 flex items-center gap-2">
                {enviando ? 'Procesando...' : editando ? 'Guardar cambios' : 'Publicar anuncio'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}