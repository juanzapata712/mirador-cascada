import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import propietariosRoutes from './routes/propietarios.routes.js';
import cuotasRoutes from './routes/cuotas.routes.js';
import pagosRoutes from './routes/pagos.routes.js';
import comunicadosRoutes from './routes/comunicados.routes.js';
import visitantesRoutes from './routes/visitantes.routes.js';
import porterosRoutes from './routes/porteros.routes.js';
import chatRoutes from './routes/chat.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js';
import cuentaRoutes from './routes/cuenta.routes.js';

import authRoutes from './routes/auth.routes.js';
import { configurarChat } from './sockets/chat.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.FRONTEND_URL } });

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use('/uploads', express.static(path.resolve('uploads')));

// ----- Rutas (cada integrante agrega las suyas aquí) -----
app.get('/api/salud', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/propietarios', propietariosRoutes);   // Persona 1
 app.use('/api/cuotas', cuotasRoutes);               // Persona 2
 app.use('/api/pagos', pagosRoutes);                 // Persona 2
 app.use('/api/visitantes', visitantesRoutes);       // Persona 2
 app.use('/api/comunicados', comunicadosRoutes);     // Persona 3
 app.use('/api/porteros', porterosRoutes);
 app.use('/api/chat', chatRoutes);
 app.use('/api/dashboard', dashboardRoutes);
 app.use('/api/cuenta', cuentaRoutes);

configurarChat(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Servidor listo en http://localhost:${PORT}`));
