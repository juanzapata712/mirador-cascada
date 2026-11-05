export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const moneda = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n));

export const fecha = (f) => new Date(f).toLocaleDateString('es-CO');

export const periodo = (c) => `${MESES[c.mes - 1]} ${c.anio}`;

// ----- Fechas en hora de Colombia (para visitantes) -----
const TZ = 'America/Bogota';
export const hoy = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ }); // "2026-11-05"
export const fechaCO = (f) => new Date(f).toLocaleDateString('es-CO', { timeZone: TZ });
export const horaCO = (f) =>
  f ? new Date(f).toLocaleTimeString('es-CO', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }) : '-';

export const colorEstado = {
  // cuotas y pagos
  PENDIENTE: 'bg-amber-100 text-amber-700',
  VENCIDA: 'bg-red-100 text-red-700',
  PAGADA: 'bg-green-100 text-green-700',
  EN_REVISION: 'bg-blue-100 text-blue-700',
  APROBADO: 'bg-green-100 text-green-700',
  RECHAZADO: 'bg-red-100 text-red-700',
  // visitantes
  PROGRAMADA: 'bg-blue-100 text-blue-700',
  INGRESO: 'bg-green-100 text-green-700',
  SALIO: 'bg-gray-200 text-gray-600',
  CANCELADA: 'bg-red-100 text-red-700',
  // propietarios
  ACTIVO: 'bg-green-100 text-green-700',
  MOROSO: 'bg-amber-100 text-amber-700',
  INACTIVO: 'bg-gray-200 text-gray-600',
};

export const etiquetaEstado = {
  EN_REVISION: 'En revisión',
  PENDIENTE: 'Pendiente',
  VENCIDA: 'Vencida',
  PAGADA: 'Pagada',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  PROGRAMADA: 'Programada',
  INGRESO: 'Dentro',
  SALIO: 'Salió',
  CANCELADA: 'Cancelada',
  ACTIVO: 'Activo',
  MOROSO: 'Moroso',
  INACTIVO: 'Inactivo',
};
