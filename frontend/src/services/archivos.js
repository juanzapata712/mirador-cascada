// Convierte "/uploads/..." en la URL completa del servidor
const HOST = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '');

export const urlArchivo = (ruta) => `${HOST}${ruta}`;
