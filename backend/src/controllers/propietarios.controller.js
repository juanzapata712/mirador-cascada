import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';

const incluirUsuario = {
  usuario: { select: { id: true, nombre: true, correo: true, activo: true } },
};

// Traduce errores de campos únicos (correo, documento, casa) a mensajes claros
function manejarError(e, res) {
  if (e.code === 'P2002') {
    const campo = e.meta?.target?.join(', ') || 'dato';
    return res.status(409).json({ error: `Ya existe un registro con ese valor (${campo})` });
  }
  if (e.code === 'P2025') return res.status(404).json({ error: 'Propietario no encontrado' });
  console.error(e);
  return res.status(500).json({ error: 'Error del servidor' });
}

// GET /api/propietarios  (admin)
export async function listar(req, res) {
  const propietarios = await prisma.propietario.findMany({
    include: incluirUsuario,
    orderBy: { casaLote: 'asc' },
  });
  res.json(propietarios);
}

// POST /api/propietarios  (admin)
export async function crear(req, res) {
  try {
    const { nombre, correo, contrasena, documento, telefono, casaLote } = req.body;
    if (!nombre || !correo || !contrasena || !documento || !casaLote) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    if (contrasena.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener mínimo 6 caracteres' });
    }

    const hash = await bcrypt.hash(contrasena, 10);

    // Crea el usuario y el propietario en una sola operación
    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        correo,
        contrasena: hash,
        rol: 'PROPIETARIO',
        propietario: { create: { documento, telefono, casaLote } },
      },
      include: { propietario: true },
    });

    res.status(201).json({ id: usuario.propietario.id, nombre, correo, casaLote });
  } catch (e) {
    manejarError(e, res);
  }
}

// PUT /api/propietarios/:id  (admin)
export async function actualizar(req, res) {
  try {
    const id = Number(req.params.id);
    const { nombre, correo, contrasena, documento, telefono, casaLote, estado } = req.body;

    const datosUsuario = { nombre, correo };
    if (contrasena) datosUsuario.contrasena = await bcrypt.hash(contrasena, 10);

    const propietario = await prisma.propietario.update({
      where: { id },
      data: { documento, telefono, casaLote, estado, usuario: { update: datosUsuario } },
      include: incluirUsuario,
    });
    res.json(propietario);
  } catch (e) {
    manejarError(e, res);
  }
}

// PATCH /api/propietarios/:id/activo  (admin) - activa o desactiva el acceso
export async function cambiarActivo(req, res) {
  try {
    const id = Number(req.params.id);
    const actual = await prisma.propietario.findUnique({ where: { id }, include: { usuario: true } });
    if (!actual) return res.status(404).json({ error: 'Propietario no encontrado' });

    const activar = !actual.usuario.activo;
    await prisma.propietario.update({
      where: { id },
      data: {
        estado: activar ? 'ACTIVO' : 'INACTIVO',
        usuario: { update: { activo: activar } },
      },
    });
    res.json({ activo: activar });
  } catch (e) {
    manejarError(e, res);
  }
}

// GET /api/propietarios/yo  (propietario) - sus propios datos
export async function miPerfil(req, res) {
  const propietario = await prisma.propietario.findUnique({
    where: { usuarioId: req.user.id },
    include: incluirUsuario,
  });
  if (!propietario) return res.status(404).json({ error: 'No tienes perfil de propietario' });
  res.json(propietario);
}
