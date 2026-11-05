import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_TELEFONO = /^[0-9+()\s-]{7,20}$/;

const seleccion = {
  id: true,
  nombre: true,
  correo: true,
  rol: true,
  creadoEn: true,
  fotoUrl: true,
  propietario: { select: { documento: true, telefono: true, casaLote: true, estado: true } },
};

// GET /api/cuenta  (cualquier usuario con sesión)
export async function miCuenta(req, res) {
  const usuario = await prisma.usuario.findUnique({ where: { id: req.user.id }, select: seleccion });
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(usuario);
}

// PUT /api/cuenta/datos  -> nombre, correo y (si es propietario) teléfono
export async function actualizarDatos(req, res) {
  try {
    const { nombre, correo, telefono } = req.body;

    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
    if (!correo?.trim() || !REGEX_CORREO.test(correo.trim())) {
      return res.status(400).json({ error: 'Ingresa un correo válido' });
    }
    const tel = telefono?.trim() || null;
    if (tel && !REGEX_TELEFONO.test(tel)) {
      return res.status(400).json({ error: 'El teléfono no es válido (solo números, espacios, + - y paréntesis)' });
    }

    const usuario = await prisma.usuario.update({
      where: { id: req.user.id },
      data: {
        nombre: nombre.trim(),
        correo: correo.trim(),
        // El teléfono solo existe para propietarios; documento y casa NO se pueden editar aquí
        ...(req.user.rol === 'PROPIETARIO' ? { propietario: { update: { telefono: tel } } } : {}),
      },
      select: seleccion,
    });
    res.json(usuario);
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
}

// PUT /api/cuenta/contrasena  -> exige la contraseña actual
export async function cambiarContrasena(req, res) {
  try {
    const { contrasenaActual, contrasenaNueva } = req.body;

    if (!contrasenaActual || !contrasenaNueva) {
      return res.status(400).json({ error: 'Escribe tu contraseña actual y la nueva' });
    }
    if (contrasenaNueva.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener mínimo 6 caracteres' });
    }
    if (contrasenaNueva.length > 72) {
      return res.status(400).json({ error: 'La nueva contraseña no puede superar los 72 caracteres' });
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: req.user.id } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    // 400 (y no 401) para que el frontend no lo confunda con una sesión vencida
    if (!(await bcrypt.compare(contrasenaActual, usuario.contrasena))) {
      return res.status(400).json({ error: 'La contraseña actual no es correcta' });
    }
    if (await bcrypt.compare(contrasenaNueva, usuario.contrasena)) {
      return res.status(400).json({ error: 'La nueva contraseña debe ser diferente a la actual' });
    }

    await prisma.usuario.update({
      where: { id: req.user.id },
      data: { contrasena: await bcrypt.hash(contrasenaNueva, 10) },
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
}

// ---------------------------------------------------------------------------
// Foto de perfil
// ---------------------------------------------------------------------------
function borrarArchivo(url) {
  if (!url) return;
  fs.unlink(path.join(process.cwd(), url), () => {});
}

// Comprueba los primeros bytes del archivo: que de verdad sea JPG, PNG o WEBP
function esImagenReal(ruta) {
  const fd = fs.openSync(ruta, 'r');
  const b = Buffer.alloc(12);
  fs.readSync(fd, b, 0, 12, 0);
  fs.closeSync(fd);

  const jpg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const png = b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP';
  return jpg || png || webp;
}

// PUT /api/cuenta/foto  (multipart, campo "foto")
export async function subirFoto(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Selecciona una imagen' });
  const ruta = req.file.path;

  try {
    if (!esImagenReal(ruta)) {
      fs.unlink(ruta, () => {});
      return res.status(400).json({ error: 'El archivo no es una imagen válida (JPG, PNG o WEBP)' });
    }

    const actual = await prisma.usuario.findUnique({ where: { id: req.user.id }, select: { fotoUrl: true } });
    const usuario = await prisma.usuario.update({
      where: { id: req.user.id },
      data: { fotoUrl: `/uploads/perfiles/${req.file.filename}` },
      select: seleccion,
    });
    borrarArchivo(actual?.fotoUrl); // la foto anterior ya no se necesita
    res.json(usuario);
  } catch (e) {
    fs.unlink(ruta, () => {});
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
}

// DELETE /api/cuenta/foto
export async function quitarFoto(req, res) {
  try {
    const actual = await prisma.usuario.findUnique({ where: { id: req.user.id }, select: { fotoUrl: true } });
    const usuario = await prisma.usuario.update({
      where: { id: req.user.id },
      data: { fotoUrl: null },
      select: seleccion,
    });
    borrarArchivo(actual?.fotoUrl);
    res.json(usuario);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
}
