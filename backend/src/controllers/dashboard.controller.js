import { prisma } from '../lib/prisma.js';
import { actualizarCartera } from '../lib/cartera.js';
import { hoyColombia, rangoDia } from '../lib/fechas.js';

const num = (d) => Number(d ?? 0);

// GET /api/dashboard  (admin)
export async function resumen(req, res) {
  try {
    await actualizarCartera();

    const hoy = hoyColombia(); // "2026-11-05"
    const anio = Number(hoy.slice(0, 4));
    const mes = Number(hoy.slice(5, 7));

    // Los últimos 6 meses, del más viejo al actual
    const periodos = [];
    for (let i = 5; i >= 0; i--) {
      let m = mes - i;
      let a = anio;
      while (m <= 0) { m += 12; a -= 1; }
      periodos.push({ mes: m, anio: a });
    }

    const [
      cuotasPeriodos, cuotasPorEstado, propietariosPorEstado, morosos,
      pagosPendientes, pagosRecientes, visitasHoy, visitantesDentro, mensajesSinLeer,
    ] = await Promise.all([
      prisma.cuota.groupBy({
        by: ['anio', 'mes', 'estado'],
        where: { OR: periodos.map((p) => ({ anio: p.anio, mes: p.mes })) },
        _sum: { valor: true },
      }),
      prisma.cuota.groupBy({ by: ['estado'], _sum: { valor: true } }),
      prisma.propietario.groupBy({ by: ['estado'], _count: { _all: true } }),
      prisma.propietario.findMany({
        where: { estado: 'MOROSO' },
        include: {
          usuario: { select: { nombre: true } },
          cuotas: { where: { estado: 'VENCIDA' }, select: { valor: true } },
        },
      }),
      prisma.pago.count({ where: { estado: 'EN_REVISION' } }),
      prisma.pago.findMany({
        where: { estado: 'EN_REVISION' },
        orderBy: { fechaPago: 'asc' }, // los más antiguos primero
        take: 5,
        include: {
          cuota: {
            select: {
              mes: true, anio: true,
              propietario: { select: { casaLote: true, usuario: { select: { nombre: true } } } },
            },
          },
        },
      }),
      prisma.visitante.groupBy({
        by: ['estado'],
        where: { fechaVisita: rangoDia(hoy) },
        _count: { _all: true },
      }),
      prisma.visitante.count({ where: { estado: 'INGRESO' } }),
      prisma.mensaje.count({ where: { leido: false, emisor: { rol: 'PROPIETARIO' } } }),
    ]);

    // ----- Recaudo por mes -----
    const serie = periodos.map((p) => {
      const filas = cuotasPeriodos.filter((f) => f.anio === p.anio && f.mes === p.mes);
      const facturado = filas.reduce((s, f) => s + num(f._sum.valor), 0);
      const recaudado = filas.filter((f) => f.estado === 'PAGADA').reduce((s, f) => s + num(f._sum.valor), 0);
      return { ...p, facturado, recaudado };
    });
    const actual = serie[serie.length - 1];

    // ----- Cartera total -----
    const sumaEstado = (e) => num(cuotasPorEstado.find((c) => c.estado === e)?._sum.valor);

    // ----- Propietarios -----
    const contar = (e) => propietariosPorEstado.find((p) => p.estado === e)?._count._all ?? 0;
    const activos = contar('ACTIVO');
    const totalMorosos = contar('MOROSO');
    const inactivos = contar('INACTIVO');

    // ----- Morosos con más deuda -----
    const topMorosos = morosos
      .map((p) => ({
        id: p.id,
        casaLote: p.casaLote,
        nombre: p.usuario.nombre,
        cuotasVencidas: p.cuotas.length,
        deuda: p.cuotas.reduce((s, c) => s + num(c.valor), 0),
      }))
      .sort((a, b) => b.deuda - a.deuda)
      .slice(0, 5);

    // ----- Visitas de hoy -----
    const cuentaVisitas = (e) => visitasHoy.find((v) => v.estado === e)?._count._all ?? 0;
    const programadas = cuentaVisitas('PROGRAMADA');
    const ingresaron = cuentaVisitas('INGRESO');
    const salieron = cuentaVisitas('SALIO');

    res.json({
      mes: {
        mes: actual.mes,
        anio: actual.anio,
        facturado: actual.facturado,
        recaudado: actual.recaudado,
        porCobrar: actual.facturado - actual.recaudado,
        porcentaje: actual.facturado ? Math.round((actual.recaudado / actual.facturado) * 100) : 0,
      },
      serie,
      cartera: { pendiente: sumaEstado('PENDIENTE'), vencida: sumaEstado('VENCIDA') },
      propietarios: {
        total: activos + totalMorosos + inactivos,
        activos,
        morosos: totalMorosos,
        inactivos,
      },
      morosos: topMorosos,
      pagos: {
        porRevisar: pagosPendientes,
        recientes: pagosRecientes.map((p) => ({
          id: p.id,
          valor: num(p.valor),
          fechaPago: p.fechaPago,
          mes: p.cuota.mes,
          anio: p.cuota.anio,
          casaLote: p.cuota.propietario.casaLote,
          nombre: p.cuota.propietario.usuario.nombre,
        })),
      },
      visitas: {
        hoy: programadas + ingresaron + salieron,
        programadas,
        salieron,
        dentro: visitantesDentro, // incluye a quien sigue dentro desde días anteriores
      },
      mensajesSinLeer,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo cargar el resumen' });
  }
}
