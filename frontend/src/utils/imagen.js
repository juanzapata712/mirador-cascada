// Recibe la imagen elegida y devuelve un File JPG cuadrado (máx. 400x400),
// recortado desde el centro. Así la foto pesa poco y siempre se ve bien en el círculo.
export async function prepararFoto(archivo, lado = 400) {
  if (!/^image\/(jpeg|png|webp)$/.test(archivo.type)) {
    throw new Error('Usa una imagen JPG, PNG o WEBP');
  }
  if (archivo.size > 10 * 1024 * 1024) {
    throw new Error('La imagen es muy pesada (máximo 10 MB)');
  }

  let imagen;
  try {
    imagen = await createImageBitmap(archivo);
  } catch {
    throw new Error('No se pudo leer la imagen. Prueba con otra');
  }

  const cuadro = Math.min(imagen.width, imagen.height);
  const salida = Math.min(lado, cuadro);
  const sx = (imagen.width - cuadro) / 2;
  const sy = (imagen.height - cuadro) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = salida;
  canvas.height = salida;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // fondo blanco para PNG con transparencia
  ctx.fillRect(0, 0, salida, salida);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imagen, sx, sy, cuadro, cuadro, 0, 0, salida, salida);
  imagen.close?.();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen'))), 'image/jpeg', 0.88);
  });
  return new File([blob], 'perfil.jpg', { type: 'image/jpeg' });
}
