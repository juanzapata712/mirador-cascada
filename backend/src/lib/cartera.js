import { prisma } from './prisma.js';

// Mantiene coherentes los estados:
//  1) cuotas pendientes con fecha vencida -> VENCIDA
//  2) propietarios con alguna cuota vencida -> MOROSO
//  3) propietarios morosos sin cuotas vencidas -> ACTIVO
// (los INACTIVO nunca se tocan)
export async function actualizarCartera() {
  await prisma.cuota.updateMany({
    where: { estado: 'PENDIENTE', fechaVencimiento: { lt: new Date() } },
    data: { estado: 'VENCIDA' },
  });
  await prisma.propietario.updateMany({
    where: { estado: 'ACTIVO', cuotas: { some: { estado: 'VENCIDA' } } },
    data: { estado: 'MOROSO' },
  });
  await prisma.propietario.updateMany({
    where: { estado: 'MOROSO', cuotas: { none: { estado: 'VENCIDA' } } },
    data: { estado: 'ACTIVO' },
  });
}
