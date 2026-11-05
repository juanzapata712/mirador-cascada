import { useEffect, useState } from 'react';
import { urlArchivo } from '../services/archivos';

/*
  Muestra la foto de perfil o, si no hay, la inicial del nombre.
    tamano:   clases de tamaño          (ej. "w-11 h-11")
    redondeo: forma                     (ej. "rounded-full", "rounded-3xl")
    letra:    estilo cuando NO hay foto (fondo, color y tamaño de la letra)
    borde:    estilo extra cuando SÍ hay foto
    vistaPrevia: URL local para mostrar una foto aún no guardada
*/
export default function Avatar({
  nombre = '?',
  fotoUrl,
  vistaPrevia,
  tamano = 'w-10 h-10',
  redondeo = 'rounded-full',
  letra = 'bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white text-base',
  borde = '',
}) {
  const [fallo, setFallo] = useState(false);
  useEffect(() => { setFallo(false); }, [fotoUrl]);

  const origen = vistaPrevia || (fotoUrl && !fallo ? urlArchivo(fotoUrl) : null);

  if (origen) {
    return (
      <img
        src={origen}
        alt={`Foto de ${nombre}`}
        onError={() => setFallo(true)}
        className={`${tamano} ${redondeo} ${borde} object-cover shrink-0`}
      />
    );
  }

  return (
    <div className={`${tamano} ${redondeo} ${letra} flex items-center justify-center font-extrabold shrink-0`}>
      {(nombre || '?').trim().charAt(0).toUpperCase() || '?'}
    </div>
  );
}
