// Las visitas se manejan siempre en hora de Colombia (UTC-5, sin horario de verano),
// así funciona igual en tu computador y en un servidor (Render) que usa UTC.
const TZ = 'America/Bogota';

// Fecha de hoy en Colombia: "2026-11-05"
export const hoyColombia = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });

// Día de una fecha guardada: "2026-11-05"
export const diaColombia = (fecha) => fecha.toLocaleDateString('en-CA', { timeZone: TZ });

export const fechaValida = (f) =>
  typeof f === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f) && !isNaN(new Date(`${f}T12:00:00-05:00`));

// La visita se guarda a mediodía de ese día
export const mediodia = (f) => new Date(`${f}T12:00:00-05:00`);

// Rango de un día completo, para filtrar
export const rangoDia = (f) => ({
  gte: new Date(`${f}T00:00:00-05:00`),
  lte: new Date(`${f}T23:59:59.999-05:00`),
});
