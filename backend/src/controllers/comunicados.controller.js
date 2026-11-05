import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma.js';

const CATEGORIAS = ['GENERAL', 'URGENTE', 'MANTENIMIENTO', 'REUNION', 'NORMAS'];
const incluirAdmin = { admin: { select: { nombre: true } } };

function borrarArchivo(url) {
  if (!url) return;
  fs.unlink(path.join(process.cwd(), url), () => {});
}

// GET /api/comunicados?categoria=  (admin y propietarios)
export async function listar(req, res) {
  const where = {};
  if (req.query.categoria && CATEGORIAS.includes(req.query.categoria)) {
    where.categoria = req.query.categoria;
  }
  const comunicados = await prisma.comunicado.findMany({
    where,
    include: incluirAdmin,
    orderBy: [{ fijado: 'desc' }, { creadoEn: 'desc' }],
    take: 100,
  });
  res.json(comunicados);
}

// POST /api/comunicados  (admin) - multipart/form-data
export async function crear(req, res) {
  try {
    const { titulo, contenido, categoria, fijado } = req.body;
    if (!titulo?.trim() || !contenido?.trim()) {
      if (req.file) borrarArchivo(`/uploads/comunicados/${req.file.filename}`);
      return res.status(400).json({ error: 'Título y contenido son obligatorios' });
    }

    const comunicado = await prisma.comunicado.create({
      data: {
        adminId: req.user.id,
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        categoria: CATEGORIAS.includes(categoria) ? categoria : 'GENERAL',
        fijado: fijado === 'true',
        imagenUrl: req.file ? `/uploads/comunicados/${req.file.filename}` : null,
      },
      include: incluirAdmin,
    });
    res.status(201).json(comunicado);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
}

// PUT /api/comunicados/:id  (admin) - multipart/form-data
// Si llega "imagen" la reemplaza; si llega quitarImagen=true la elimina.
export async function actualizar(req, res) {
  try {
    const id = Number(req.params.id);
    const actual = await prisma.comunicado.findUnique({ where: { id } });
    if (!actual) {
      if (req.file) borrarArchivo(`/uploads/comunicados/${req.file.filename}`);
      return res.status(404).json({ error: 'Comunicado no encontrado' });
    }

    const { titulo, contenido, categoria, fijado, quitarImagen } = req.body;
    if (!titulo?.trim() || !contenido?.trim()) {
      if (req.file) borrarArchivo(`/uploads/comunicados/${req.file.filename}`);
      return res.status(400).json({ error: 'Título y contenido son obligatorios' });
    }

    let imagenUrl = actual.imagenUrl;
    if (req.file) {
      borrarArchivo(actual.imagenUrl);
      imagenUrl = `/uploads/comunicados/${req.file.filename}`;
    } else if (quitarImagen === 'true') {
      borrarArchivo(actual.imagenUrl);
      imagenUrl = null;
    }

    const comunicado = await prisma.comunicado.update({
      where: { id },
      data: {
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        categoria: CATEGORIAS.includes(categoria) ? categoria : actual.categoria,
        fijado: fijado === 'true',
        imagenUrl,
      },
      include: incluirAdmin,
    });
    res.json(comunicado);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
}

// PATCH /api/comunicados/:id/fijar  (admin) - alterna fijado / no fijado
export async function alternarFijado(req, res) {
  const id = Number(req.params.id);
  const actual = await prisma.comunicado.findUnique({ where: { id } });
  if (!actual) return res.status(404).json({ error: 'Comunicado no encontrado' });

  const c = await prisma.comunicado.update({ where: { id }, data: { fijado: !actual.fijado } });
  res.json({ fijado: c.fijado });
}

// DELETE /api/comunicados/:id  (admin)
export async function eliminar(req, res) {
  const id = Number(req.params.id);
  const actual = await prisma.comunicado.findUnique({ where: { id } });
  if (!actual) return res.status(404).json({ error: 'Comunicado no encontrado' });

  await prisma.comunicado.delete({ where: { id } });
  borrarArchivo(actual.imagenUrl);
  res.json({ ok: true });
}
