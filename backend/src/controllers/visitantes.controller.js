import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { hoyColombia, diaColombia, fechaValida, mediodia, rangoDia } from '../lib/fechas.js';

const incluirPropietario = {
  propietario: {
    select: { casaLote: true, telefono: true, usuario: { select: { nombre: true } } },
  },
};

// Código corto y fácil de digitar: 8 caracteres, ej. "A3F09C1B"
const generarCodigo = () => crypto.randomBytes(4).toString('hex').toUpperCase();

// Decide qué se puede hacer con una visita en este momento
function evaluar(v) {
  const hoy = hoyColombia();
  const dia = diaColombia(v.fechaVisita);

  if (v.estado === 'CANCELADA') return { accion: null, mensaje: 'Esta visita fue cancelada por el propietario' };
  if (v.estado === 'SALIO') return { accion: null, mensaje: 'Este visitante ya registró su salida' };
  if (v.estado === 'INGRESO') return { accion: 'SALIDA', mensaje: 'El visitante está dentro de la urbanización' };
  if (dia > hoy) return { accion: null, mensaje: `La visita está programada para el ${dia}, no para hoy` };
  if (dia < hoy) return { accion: null, mensaje: `La visita era para el ${dia} y ya venció` };
  return { accion: 'INGRESO', mensaje: 'Visita válida para hoy' };
}

// POST /api/visitantes  (propietario)
export async function crear(req, res) {
  try {
    const propietario = await prisma.propietario.findUnique({ where: { usuarioId: req.user.id } });
    if (!propietario) return res.status(404).json({ error: 'No tienes perfil de propietario' });

    const { nombre, documento, placa, fechaVisita, motivo } = req.body;
    if (!nombre?.trim() || !documento?.trim() || !fechaVisita) {
      return res.status(400).json({ error: 'Nombre, documento y fecha son obligatorios' });
    }
    if (!fechaValida(fechaVisita)) return res.status(400).json({ error: 'Fecha inválida' });
    if (fechaVisita < hoyColombia()) {
      return res.status(400).json({ error: 'La fecha no puede ser anterior a hoy' });
    }

    // Reintenta si el código generado ya existía (muy improbable)
    for (let i = 0; i < 5; i++) {
      try {
        const visitante = await prisma.visitante.create({
          data: {
            propietarioId: propietario.id,
            nombre: nombre.trim(),
            documento: documento.trim(),
            placa: placa?.trim() ? placa.trim().toUpperCase() : null,
            motivo: motivo?.trim() || null,
            fechaVisita: mediodia(fechaVisita),
            codigoQr: generarCodigo(),
          },
        });
        return res.status(201).json(visitante);
      } catch (e) {
        if (e.code !== 'P2002') throw e;
      }
    }
    res.status(500).json({ error: 'No se pudo generar el código, intenta de nuevo' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
}

// GET /api/visitantes/mios  (propietario)
export async function misVisitantes(req, res) {
  const propietario = await prisma.propietario.findUnique({ where: { usuarioId: req.user.id } });
  if (!propietario) return res.status(404).json({ error: 'No tienes perfil de propietario' });

  const visitantes = await prisma.visitante.findMany({
    where: { propietarioId: propietario.id },
    orderBy: [{ fechaVisita: 'desc' }, { creadoEn: 'desc' }],
    take: 100,
  });
  res.json(visitantes);
}

// PATCH /api/visitantes/:id/cancelar  (propietario)
export async function cancelar(req, res) {
  const propietario = await prisma.propietario.findUnique({ where: { usuarioId: req.user.id } });
  const visitante = await prisma.visitante.findUnique({ where: { id: Number(req.params.id) } });

  if (!propietario || !visitante || visitante.propietarioId !== propietario.id) {
    return res.status(404).json({ error: 'Visita no encontrada' });
  }
  if (visitante.estado !== 'PROGRAMADA') {
    return res.status(400).json({ error: 'Solo se pueden cancelar visitas programadas' });
  }
  await prisma.visitante.update({ where: { id: visitante.id }, data: { estado: 'CANCELADA' } });
  res.json({ ok: true });
}

// GET /api/visitantes?fecha=&estado=&q=  (admin y portero)
export async function listar(req, res) {
  const { fecha, estado, q } = req.query;
  const where = {};
  if (fecha && fechaValida(fecha)) where.fechaVisita = rangoDia(fecha);
  if (estado) where.estado = estado;
  if (q?.trim()) {
    const c = { contains: q.trim(), mode: 'insensitive' };
    where.OR = [
      { nombre: c }, { documento: c }, { placa: c },
      { propietario: { casaLote: c } },
    ];
  }

  const visitantes = await prisma.visitante.findMany({
    where,
    include: incluirPropietario,
    orderBy: [{ fechaVisita: 'desc' }, { creadoEn: 'desc' }],
    take: 200,
  });
  res.json(visitantes);
}

// GET /api/visitantes/codigo/:codigo  (admin y portero)
export async function buscarPorCodigo(req, res) {
  const codigo = String(req.params.codigo).trim().toUpperCase();
  const visitante = await prisma.visitante.findUnique({
    where: { codigoQr: codigo },
    include: incluirPropietario,
  });
  if (!visitante) return res.status(404).json({ error: 'Código no encontrado' });

  res.json({ visitante, ...evaluar(visitante) });
}

async function movimiento(req, res, accionEsperada) {
  try {
    const visitante = await prisma.visitante.findUnique({ where: { id: Number(req.params.id) } });
    if (!visitante) return res.status(404).json({ error: 'Visita no encontrada' });

    // Para registrar el INGRESO hay que presentar el código (escaneado o escrito).
    // Así no se puede registrar un ingreso solo con el nombre del visitante.
    if (accionEsperada === 'INGRESO') {
      const codigo = String(req.body?.codigo ?? '').trim().toUpperCase();
      if (codigo !== visitante.codigoQr) {
        return res.status(400).json({
          error: 'Para registrar el ingreso debes escanear el QR o escribir el código del visitante',
        });
      }
    }

    const { accion, mensaje } = evaluar(visitante);
    if (accion !== accionEsperada) return res.status(400).json({ error: mensaje });

    const data = accionEsperada === 'INGRESO'
      ? { estado: 'INGRESO', horaIngreso: new Date() }
      : { estado: 'SALIO', horaSalida: new Date() };

    await prisma.visitante.update({ where: { id: visitante.id }, data });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
}

// PATCH /api/visitantes/:id/ingreso  y  /salida  (admin y portero)
export const registrarIngreso = (req, res) => movimiento(req, res, 'INGRESO');
export const registrarSalida = (req, res) => movimiento(req, res, 'SALIDA');
