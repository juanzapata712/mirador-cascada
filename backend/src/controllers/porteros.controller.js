import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';

// GET /api/porteros  (admin)
export async function listar(req, res) {
  const porteros = await prisma.usuario.findMany({
    where: { rol: 'PORTERO' },
    select: { id: true, nombre: true, correo: true, activo: true, creadoEn: true },
    orderBy: { nombre: 'asc' },
  });
  res.json(porteros);
}

// POST /api/porteros  (admin)
export async function crear(req, res) {
  try {
    const { nombre, correo, contrasena } = req.body;
    if (!nombre?.trim() || !correo?.trim() || !contrasena) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
    }
    if (contrasena.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener mínimo 6 caracteres' });
    }
    const portero = await prisma.usuario.create({
      data: {
        nombre: nombre.trim(),
        correo: correo.trim(),
        contrasena: await bcrypt.hash(contrasena, 10),
        rol: 'PORTERO',
      },
      select: { id: true, nombre: true, correo: true, activo: true },
    });
    res.status(201).json(portero);
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Ya existe un usuario con ese correo' });
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
}

// PATCH /api/porteros/:id/activo  (admin)
export async function cambiarActivo(req, res) {
  const id = Number(req.params.id);
  const portero = await prisma.usuario.findUnique({ where: { id } });
  if (!portero || portero.rol !== 'PORTERO') return res.status(404).json({ error: 'Portero no encontrado' });

  const actualizado = await prisma.usuario.update({ where: { id }, data: { activo: !portero.activo } });
  res.json({ activo: actualizado.activo });
}
