import { prisma } from '../lib/prisma.js';

const incluirEmisor = { emisor: { select: { nombre: true, rol: true } } };

async function ultimosMensajes(propietarioId) {
  const mensajes = await prisma.mensaje.findMany({
    where: { propietarioId },
    include: incluirEmisor,
    orderBy: { creadoEn: 'desc' },
    take: 200,
  });
  return mensajes.reverse(); // del más viejo al más nuevo
}

// GET /api/chat/conversaciones  (admin)
// Lista de propietarios con su último mensaje y cuántos tiene sin leer
export async function conversaciones(req, res) {
  const propietarios = await prisma.propietario.findMany({
    where: { usuario: { activo: true } },
    include: {
      usuario: { select: { nombre: true, fotoUrl: true } },
      mensajes: { orderBy: { creadoEn: 'desc' }, take: 1, include: incluirEmisor },
      _count: {
        select: { mensajes: { where: { leido: false, emisor: { rol: 'PROPIETARIO' } } } },
      },
    },
  });

  const lista = propietarios.map((p) => ({
    id: p.id,
    casaLote: p.casaLote,
    nombre: p.usuario.nombre,
    fotoUrl: p.usuario.fotoUrl,
    sinLeer: p._count.mensajes,
    ultimo: p.mensajes[0]
      ? {
          contenido: p.mensajes[0].contenido,
          creadoEn: p.mensajes[0].creadoEn,
          emisorRol: p.mensajes[0].emisor.rol,
        }
      : null,
  }));

  // Primero los que tienen conversación (más reciente arriba), luego el resto por casa
  lista.sort((a, b) => {
    if (a.ultimo && b.ultimo) return new Date(b.ultimo.creadoEn) - new Date(a.ultimo.creadoEn);
    if (a.ultimo) return -1;
    if (b.ultimo) return 1;
    return a.casaLote.localeCompare(b.casaLote);
  });

  res.json(lista);
}

// GET /api/chat/mensajes/:propietarioId  (admin)
export async function mensajesDe(req, res) {
  res.json(await ultimosMensajes(Number(req.params.propietarioId)));
}

// GET /api/chat/mios  (propietario)
export async function misMensajes(req, res) {
  const propietario = await prisma.propietario.findUnique({ where: { usuarioId: req.user.id } });
  if (!propietario) return res.status(404).json({ error: 'No tienes perfil de propietario' });
  res.json(await ultimosMensajes(propietario.id));
}

// GET /api/chat/no-leidos  (admin y propietario) -> para el contador del menú
export async function noLeidos(req, res) {
  if (req.user.rol === 'ADMIN') {
    const total = await prisma.mensaje.count({
      where: { leido: false, emisor: { rol: 'PROPIETARIO' } },
    });
    return res.json({ total });
  }

  const propietario = await prisma.propietario.findUnique({ where: { usuarioId: req.user.id } });
  if (!propietario) return res.json({ total: 0 });
  const total = await prisma.mensaje.count({
    where: { propietarioId: propietario.id, leido: false, emisor: { rol: 'ADMIN' } },
  });
  res.json({ total });
}
