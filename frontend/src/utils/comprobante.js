import { moneda } from './formato';

const FUENTE = '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif';
const TZ = 'America/Bogota';

const METODOS = { TRANSFERENCIA: 'Transferencia', CONSIGNACION: 'Consignación', EFECTIVO: 'Efectivo', OTRO: 'Otro' };

const fechaHora = (f) =>
  new Date(f).toLocaleString('es-CO', {
    timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

function rectRedondeado(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Recorta con "…" un texto que no cabe en el ancho disponible
function ajustar(ctx, texto, ancho) {
  let t = String(texto ?? '');
  if (ctx.measureText(t).width <= ancho) return t;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > ancho) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

// Reduce el tamaño de la letra hasta que el texto quepa en el ancho disponible
function fuenteAjustada(ctx, texto, peso, max, min, ancho) {
  for (let tam = max; tam > min; tam -= 2) {
    ctx.font = `${peso} ${tam}px ${FUENTE}`;
    if (ctx.measureText(String(texto)).width <= ancho) return tam;
  }
  ctx.font = `${peso} ${min}px ${FUENTE}`;
  return min;
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

/*
  datos = {
    estado: 'pagado' | 'resumen',      // pagado = pago aprobado; resumen = pendiente de validar
    numero, propietario: { nombre, documento, casaLote },
    concepto, periodo, valor, metodo, fechaPago, fechaValidacion?
  }
*/
async function dibujar(d) {
  try { await document.fonts?.ready; } catch { /* seguir igual */ }

  const pagado = d.estado === 'pagado';

  const filas = [
    ['Propietario', d.propietario.nombre],
    ['Documento', d.propietario.documento || '-'],
    ['Casa / Lote', d.propietario.casaLote],
    ['Concepto', d.concepto || 'Cuota de administración'],
    ['Periodo', d.periodo],
    ['Método de pago', METODOS[d.metodo] || d.metodo],
    [pagado ? 'Fecha de pago' : 'Fecha de registro', fechaHora(d.fechaPago)],
  ];
  if (pagado && d.fechaValidacion) filas.push(['Validado el', fechaHora(d.fechaValidacion)]);

  const W = 720;
  const PASO = 58;
  const INICIO_FILAS = 668;
  const ultimaFila = INICIO_FILAS + (filas.length - 1) * PASO;
  const inicioPie = ultimaFila + 90;
  const H = inicioPie + 170; // el alto se adapta a la cantidad de filas
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
  const g = ctx.createLinearGradient(40, 40, W - 40, 270);
  g.addColorStop(0, '#4338ca');
  g.addColorStop(0.55, '#6d28d9');
  g.addColorStop(1, '#a21caf');
  ctx.fillStyle = g;
  ctx.fillRect(40, 40, W - 80, 230);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = `700 26px ${FUENTE}`;
  ctx.fillText('MIRADOR DE LA CASCADA', W / 2, 106);
  ctx.fillStyle = '#ffffff';
  const titulo = pagado ? 'Comprobante de pago' : 'Resumen de pago';
  fuenteAjustada(ctx, titulo, 800, 52, 30, W - 180);
  ctx.fillText(titulo, W / 2, 172);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `600 26px ${FUENTE}`;
  ctx.fillText(`N.º ${d.numero}`, W / 2, 224);

  // Sello de estado
  const color = pagado ? '#059669' : '#d97706';
  const cx = W / 2;
  const cy = 345;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 9;
  ctx.beginPath();
  if (pagado) {
    ctx.moveTo(cx - 19, cy + 2);
    ctx.lineTo(cx - 6, cy + 15);
    ctx.lineTo(cx + 20, cy - 14);
  } else {
    ctx.moveTo(cx, cy - 18);
    ctx.lineTo(cx, cy + 2);
    ctx.lineTo(cx + 13, cy + 10);
  }
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = `800 28px ${FUENTE}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
  ctx.fillText(pagado ? 'PAGO APROBADO' : 'PENDIENTE DE VALIDACIÓN', W / 2, 438);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  // Valor
  ctx.fillStyle = '#71717a';
  ctx.font = `600 24px ${FUENTE}`;
  ctx.fillText('Valor', W / 2, 492);
  ctx.fillStyle = '#18181b';
  fuenteAjustada(ctx, moneda(d.valor), 800, 74, 40, W - 160);
  ctx.fillText(moneda(d.valor), W / 2, 566);

  // Línea punteada
  ctx.strokeStyle = '#d4d4d8';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(90, 612);
  ctx.lineTo(W - 90, 612);
  ctx.stroke();
  ctx.setLineDash([]);

  // Filas de datos
  let y = INICIO_FILAS;
  filas.forEach(([etiqueta, valor], i) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#71717a';
    ctx.font = `500 23px ${FUENTE}`;
    ctx.fillText(etiqueta, 90, y);
    const anchoEtiqueta = ctx.measureText(etiqueta).width;

    ctx.textAlign = 'right';
    ctx.fillStyle = '#18181b';
    const disponible = W - 180 - anchoEtiqueta - 24;
    fuenteAjustada(ctx, valor, 700, 25, 16, disponible);
    ctx.fillText(ajustar(ctx, valor, disponible), W - 90, y); // último recurso: "…"


    if (i < filas.length - 1) {
      ctx.strokeStyle = '#f4f4f5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(90, y + 22);
      ctx.lineTo(W - 90, y + 22);
      ctx.stroke();
    }
    y += PASO;
  });

  // Pie
  ctx.textAlign = 'center';
  ctx.fillStyle = '#a1a1aa';
  ctx.font = `500 21px ${FUENTE}`;
  const pie = pagado
    ? ['Constancia de pago aprobado por la administración.', 'Documento generado por la plataforma Mirador de la Cascada.']
    : ['Resumen generado por la plataforma. No reemplaza el soporte bancario.', 'Queda sujeto a validación por la administración.'];
  // Todas las líneas del pie usan el mismo tamaño (el que le cabe a la más larga)
  const tamPie = Math.min(...pie.map((linea) => fuenteAjustada(ctx, linea, 500, 21, 15, W - 150)));
  ctx.font = `500 ${tamPie}px ${FUENTE}`;
  pie.forEach((linea, i) => ctx.fillText(linea, W / 2, inicioPie + i * 32));
  ctx.fillText(`Generado el ${fechaHora(new Date())}`, W / 2, inicioPie + pie.length * 32 + 6);

  return canvas;
}

export async function descargarComprobante(datos) {
  const blob = await aBlob(await dibujar(datos));
  guardarArchivo(blob, `comprobante-${datos.numero}.png`);
}

// Devuelve un File listo para adjuntarlo al formulario de pago
export async function crearArchivoResumen(datos) {
  const blob = await aBlob(await dibujar({ ...datos, estado: 'resumen' }));
  return new File([blob], `resumen-pago-${datos.numero}.png`, { type: 'image/png' });
}
