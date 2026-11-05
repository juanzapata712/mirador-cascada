import VentanaChat from '../../components/VentanaChat';

export default function Chat() {
  return (
    <div className="flex flex-col h-[75vh] max-w-2xl font-sans text-zinc-800 dark:text-zinc-200">
      <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">Chat con la administración</h1>
      <VentanaChat titulo="Administración" subtitulo="Escríbenos tus dudas o solicitudes" />
    </div>
  );
}