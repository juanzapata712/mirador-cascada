import fs from 'fs';
import { prisma } from '../lib/prisma.js';
import { actualizarCartera } from '../lib/cartera.js';

const METODOS_PROPIETARIO = ['TRANSFERENCIA', 'CONSIGNACION', 'OTRO'];
const METODOS = ['TRANSFERENCIA', 'CONSIGNACION', 'EFECTIVO', 'OTRO'];

// POST /api/pagos  (propietario) - multipart/form-data con el comprobante
export async function registrar(req, res) {
  const limpiar = () => req.file && fs.unlink(req.file.path, () => {});
  try {
    const propietario = await prisma.propietario.findUnique({ where: { usuarioId: req.user.id } });
    if (!propietario) { limpiar(); return res.status(404).json({ error: 'No tienes perfil de propietario' }); }

    const cuotaId = Number(req.body.cuotaId);
    const { metodo } = req.body;
    if (!METODOS_PROPIETARIO.includes(metodo)) { limpiar(); return res.status(400).json({ error: 'Método de pago inválido' }); }
    if (!req.file) return res.status(400).json({ error: 'Adjunta el comprobante de pago' });

    const cuota = await prisma.cuota.findUnique({ where: { id: cuotaId }, include: { pagos: true } });
    if (!cuota || cuota.propietarioId !== propietario.id) { limpiar(); return res.status(404).json({ error: 'Cuota no encontrada' }); }
    if (cuota.estado === 'PAGADA') { limpiar(); return res.status(400).json({ error: 'Esta cuota ya está pagada' }); }
    if (cuota.pagos.some((p) => p.estado === 'EN_REVISION')) {
      limpiar();
      return res.status(400).json({ error: 'Ya tienes un pago en revisión para esta cuota' });
    }

    const pago = await prisma.pago.create({
      data: {
        cuotaId,
        valor: cuota.valor, // se paga la cuota completa
        metodo,
        comprobanteUrl: `/uploads/comprobantes/${req.file.filename}`,
        estado: 'EN_REVISION',
      },
    });
    res.status(201).json(pago);
  } catch (e) {
    limpiar();
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
}

// POST /api/pagos/manual  (admin) - ej: pago en efectivo en la oficina
export async function registrarManual(req, res) {
  try {
    const cuotaId = Number(req.body.cuotaId);
    const metodo = METODOS.includes(req.body.metodo) ? req.body.metodo : 'EFECTIVO';

    const cuota = await prisma.cuota.findUnique({ where: { id: cuotaId } });
    if (!cuota) return res.status(404).json({ error: 'Cuota no encontrada' });
    if (cuota.estado === 'PAGADA') return res.status(400).json({ error: 'Esta cuota ya está pagada' });

    await prisma.$transaction([
      prisma.pago.create({
        data: {
          cuotaId, valor: cuota.valor, metodo, estado: 'APROBADO',
          observacion: req.body.observacion || 'Registrado por la administración',
          validadoPorId: req.user.id, validadoEn: new Date(),
        },
      }),
      prisma.cuota.update({ where: { id: cuotaId }, data: { estado: 'PAGADA' } }),
    ]);
    await actualizarCartera();
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
}

// GET /api/pagos?estado=  (admin)
export async function listar(req, res) {
  const where = req.query.estado ? { estado: req.query.estado } : {};
  const pagos = await prisma.pago.findMany({
    where,
    include: {
      cuota: { include: { propietario: { include: { usuario: { select: { nombre: true } } } } } },
    },
    orderBy: { fechaPago: 'desc' },
  });
  res.json(pagos);
}

// PATCH /api/pagos/:id/revisar  (admin)  body: { decision, observacion }
export async function revisar(req, res) {
  try {
    const id = Number(req.params.id);
    const { decision, observacion } = req.body;

    if (!['APROBADO', 'RECHAZADO'].includes(decision)) {
      return res.status(400).json({ error: 'Decisión inválida' });
    }
    if (decision === 'RECHAZADO' && !observacion) {
      return res.status(400).json({ error: 'Indica el motivo del rechazo' });
    }

    const pago = await prisma.pago.findUnique({ where: { id } });
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
    if (pago.estado !== 'EN_REVISION') return res.status(400).json({ error: 'Este pago ya fue revisado' });

    const operaciones = [
      prisma.pago.update({
        where: { id },
        data: { estado: decision, observacion, validadoPorId: req.user.id, validadoEn: new Date() },
      }),
    ];
    if (decision === 'APROBADO') {
      operaciones.push(prisma.cuota.update({ where: { id: pago.cuotaId }, data: { estado: 'PAGADA' } }));
    }
    await prisma.$transaction(operaciones);
    await actualizarCartera();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
}
