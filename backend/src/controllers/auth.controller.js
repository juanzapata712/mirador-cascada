import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

export async function login(req, res) {
  try {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
    }

    const usuario = await prisma.usuario.findUnique({ where: { correo } });
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const ok = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, {
      expiresIn: '8h',
    });

    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
}

export async function perfil(req, res) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.user.id },
    select: { id: true, nombre: true, correo: true, rol: true },
  });
  res.json(usuario);
}
