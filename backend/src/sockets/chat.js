import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const MAX_CARACTERES = 1000;
const incluirEmisor = { emisor: { select: { nombre: true, rol: true } } };

// Salas:
//   "chat:<propietarioId>"  -> el propietario (todas sus pestañas)
//   "admins"                -> todos los administradores conectados
export function configurarChat(io) {
  // ---- Autenticación: el cliente envía su token JWT al conectarse ----
  io.use(async (socket, next) => {
    try {
      const payload = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      const usuario = await prisma.usuario.findUnique({
        where: { id: payload.id },
        include: { propietario: true },
      });

      if (!usuario || !usuario.activo) return next(new Error('No autorizado'));
      if (!['ADMIN', 'PROPIETARIO'].includes(usuario.rol)) return next(new Error('Sin acceso al chat'));
      if (usuario.rol === 'PROPIETARIO' && !usuario.propietario) return next(new Error('Sin perfil de propietario'));

      socket.data.usuario = {
        id: usuario.id,
        rol: usuario.rol,
        propietarioId: usuario.propietario?.id ?? null,
      };
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    const u = socket.data.usuario;
    if (u.rol === 'ADMIN') socket.join('admins');
    else socket.join(`chat:${u.propietarioId}`);

    // ---- Enviar un mensaje ----
    socket.on('mensaje:enviar', async (datos, ack) => {
      const responder = (r) => typeof ack === 'function' && ack(r);
      try {
        const contenido = String(datos?.contenido ?? '').trim();
        if (!contenido) return responder({ error: 'El mensaje está vacío' });
        if (contenido.length > MAX_CARACTERES) {
          return responder({ error: `Máximo ${MAX_CARACTERES} caracteres` });
        }

        // El propietario siempre escribe en SU conversación; el admin elige cuál
        const propietarioId = u.rol === 'ADMIN' ? Number(datos?.propietarioId) : u.propietarioId;
        if (!propietarioId) return responder({ error: 'Conversación inválida' });

        if (u.rol === 'ADMIN') {
          const existe = await prisma.propietario.findUnique({ where: { id: propietarioId } });
          if (!existe) return responder({ error: 'Propietario no encontrado' });
        }

        const mensaje = await prisma.mensaje.create({
          data: { propietarioId, emisorId: u.id, contenido },
          include: incluirEmisor,
        });

        io.to(`chat:${propietarioId}`).to('admins').emit('mensaje:nuevo', mensaje);
        responder({ ok: true });
      } catch (e) {
        console.error(e);
        responder({ error: 'No se pudo enviar el mensaje' });
      }
    });

    // ---- Marcar como leídos los mensajes del otro lado ----
    socket.on('mensajes:leer', async (datos) => {
      try {
        const propietarioId = u.rol === 'ADMIN' ? Number(datos?.propietarioId) : u.propietarioId;
        if (!propietarioId) return;

        const delOtroLado = u.rol === 'ADMIN'
          ? { emisor: { rol: 'PROPIETARIO' } }
          : { emisor: { rol: 'ADMIN' } };

        const r = await prisma.mensaje.updateMany({
          where: { propietarioId, leido: false, ...delOtroLado },
          data: { leido: true },
        });
        if (r.count > 0) {
          io.to(`chat:${propietarioId}`).to('admins').emit('mensajes:leidos', { propietarioId, por: u.rol });
        }
      } catch (e) {
        console.error(e);
      }
    });
  });
}
