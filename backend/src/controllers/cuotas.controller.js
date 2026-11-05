import { prisma } from '../lib/prisma.js';
import { actualizarCartera } from '../lib/cartera.js';

// POST /api/cuotas/generar  (admin)
// Crea la cuota del mes para todos los propietarios no inactivos.
// Si ya existe la cuota de ese mes para alguien, la omite (no duplica).
export async function generar(req, res) {
  try {
    const { mes, anio, valor, fechaVencimiento, concepto, propietarioIds } = req.body;
    if (!mes || !anio || !valor || !fechaVencimiento) {
      return res.status(400).json({ error: 'Mes, año, valor y fecha de vencimiento son obligatorios' });
    }
    if (Number(mes) < 1 || Number(mes) > 12) return res.status(400).json({ error: 'Mes inválido' });
    if (Number(valor) <= 0) return res.status(400).json({ error: 'El valor debe ser mayor a 0' });

    const vence = String(fechaVencimiento).length === 10
      ? new Date(`${fechaVencimiento}T23:59:59`)
      : new Date(fechaVencimiento);

    // Si llega "propietarioIds" la cuota se crea solo para esos propietarios;
    // si no llega, se crea para todos los que no estén inactivos.
    const esEspecifica = Array.isArray(propietarioIds);
    if (esEspecifica && propietarioIds.length === 0) {
      return res.status(400).json({ error: 'Selecciona al menos un propietario' });
    }

    const propietarios = await prisma.propietario.findMany({
      where: {
        estado: { not: 'INACTIVO' },
        ...(esEspecifica ? { id: { in: propietarioIds.map(Number) } } : {}),
      },
      select: { id: true },
    });

    const r = await prisma.cuota.createMany({
      data: propietarios.map((p) => ({
        propietarioId: p.id,
        mes: Number(mes),
        anio: Number(anio),
        valor: Number(valor),
        fechaVencimiento: vence,
        concepto: concepto || 'Cuota de administración',
      })),
      skipDuplicates: true,
    });

    await actualizarCartera();
    res.status(201).json({ creadas: r.count, omitidas: propietarios.length - r.count });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
}

// GET /api/cuotas?mes=&anio=&estado=  (admin)
export async function listar(req, res) {
  await actualizarCartera();
  const { mes, anio, estado } = req.query;
  const where = {};
  if (mes) where.mes = Number(mes);
  if (anio) where.anio = Number(anio);
  if (estado) where.estado = estado;

  const cuotas = await prisma.cuota.findMany({
    where,
    include: {
      propietario: { include: { usuario: { select: { nombre: true } } } },
      pagos: { orderBy: { fechaPago: 'desc' } },
    },
    orderBy: [{ anio: 'desc' }, { mes: 'desc' }, { propietario: { casaLote: 'asc' } }],
  });
  res.json(cuotas);
}

// GET /api/cuotas/mias  (propietario)
export async function misCuotas(req, res) {
  await actualizarCartera();
  const propietario = await prisma.propietario.findUnique({ where: { usuarioId: req.user.id } });
  if (!propietario) return res.status(404).json({ error: 'No tienes perfil de propietario' });

  const cuotas = await prisma.cuota.findMany({
    where: { propietarioId: propietario.id },
    include: { pagos: { orderBy: { fechaPago: 'desc' } } },
    orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
  });
  res.json(cuotas);
}
