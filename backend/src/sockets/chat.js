// Aquí irá el chat en tiempo real (Persona 3).
// Se conecta desde app.js con: configurarChat(io)
export function configurarChat(io) {
  io.on('connection', (socket) => {
    console.log('Cliente conectado al chat:', socket.id);
    socket.on('disconnect', () => console.log('Cliente desconectado:', socket.id));
  });
}
