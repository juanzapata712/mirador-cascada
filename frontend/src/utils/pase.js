import { fechaCO } from './formato';

const FUENTE = '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif';

function rectRedondeado(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const aBlob = (canvas) => new Promise((resolve, reject) => {
  canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo crear la imagen'))), 'image/png');
});

function guardarArchivo(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Dibuja el pase completo (cabecera, QR grande, código y datos del visitante).
// Necesita en pantalla un <QRCodeCanvas id="qr-pase" size={720} /> oculto.
async function crearPase(visita) {
  const qr = document.getElementById('qr-pase');
  if (!qr) throw new Error('No se encontró el código QR en la pantalla');
  try { await document.fonts?.ready; } catch { /* seguir igual */ }

  const W = 720;
  const H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Fondo y tarjeta
  ctx.fillStyle = '#eef2ff';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.shadowColor = 'rgba(79,70,229,0.2)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = '#ffffff';
  rectRedondeado(ctx, 40, 40, W - 80, H - 80, 40);
  ctx.fill();
  ctx.restore();

  // Cabecera con degradado
  ctx.save();
  rectRedondeado(ctx, 40, 40, W - 80, H - 80, 40);
  ctx.clip();
  const g = ctx.createLinearGradient(40, 40, W - 40, 290);
  g.addColorStop(0, '#4338ca');
  g.addColorStop(0.55, '#6d28d9');
  g.addColorStop(1, '#a21caf');
  ctx.fillStyle = g;
  ctx.fillRect(40, 40, W - 80, 250);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = `700 26px ${FUENTE}`;
  ctx.fillText('MIRADOR DE LA CASCADA', W / 2, 112);
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 54px ${FUENTE}`;
  ctx.fillText('Pase de visitante', W / 2, 190);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `500 26px ${FUENTE}`;
  ctx.fillText('Presenta este QR en la portería', W / 2, 240);

  // Marco del QR
  const marco = 420;
  const mx = (W - marco) / 2;
  const my = 330;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e4e4e7';
  ctx.lineWidth = 3;
  rectRedondeado(ctx, mx, my, marco, marco, 28);
  ctx.fill();
  ctx.stroke();
  ctx.drawImage(qr, mx + 30, my + 30, marco - 60, marco - 60);

  // Código escrito
  ctx.fillStyle = '#4338ca';
  ctx.font = '800 74px "Courier New", ui-monospace, monospace';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '8px';
  ctx.fillText(visita.codigoQr, W / 2 + 4, 860);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  // Nombre (se recorta si es muy largo)
  ctx.fillStyle = '#18181b';
  ctx.font = `800 40px ${FUENTE}`;
  let nombre = visita.nombre;
  while (ctx.measureText(nombre).width > W - 160 && nombre.length > 4) nombre = nombre.slice(0, -2);
  if (nombre !== visita.nombre) nombre = `${nombre.trimEnd()}…`;
  ctx.fillText(nombre, W / 2, 928);

  ctx.fillStyle = '#52525b';
  ctx.font = `600 28px ${FUENTE}`;
  ctx.fillText(`Fecha de la visita: ${fechaCO(visita.fechaVisita)}`, W / 2, 974);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = `500 23px ${FUENTE}`;
  ctx.fillText('Válido únicamente el día de la visita', W / 2, 1012);

  return canvas;
}

export async function descargarPase(visita) {
  const blob = await aBlob(await crearPase(visita));
  guardarArchivo(blob, `pase-${visita.codigoQr}.png`);
}

/*
  WhatsApp no permite adjuntar una imagen desde un enlace, así que:
   - Celular: abre el menú de compartir del teléfono CON la imagen adjunta (elige WhatsApp).
   - Computador: copia la imagen al portapapeles y abre WhatsApp; se pega con Ctrl + V.
   - Si el navegador no permite copiar: descarga la imagen para adjuntarla a mano.
  Devuelve: 'compartido' | 'cancelado' | 'copiado' | 'descargado'
*/
export async function compartirPase(visita) {
  const blob = await aBlob(await crearPase(visita));
  const archivo = new File([blob], `pase-${visita.codigoQr}.png`, { type: 'image/png' });
  const texto = `Hola ${visita.nombre}, este es tu pase de ingreso a Mirador de la Cascada para el ${fechaCO(visita.fechaVisita)}. Código: ${visita.codigoQr}. Preséntalo en la portería.`;
  const esMovil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (esMovil && navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], text: texto, title: 'Pase de visitante' });
      return 'compartido';
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelado';
      // otro error: se intenta la vía del computador
    }
  }

  let copiada = false;
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    copiada = true;
  } catch { /* el navegador no permite copiar imágenes */ }

  if (!copiada) guardarArchivo(blob, `pase-${visita.codigoQr}.png`);
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  return copiada ? 'copiado' : 'descargado';
}
