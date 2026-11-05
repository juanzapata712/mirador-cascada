import { Router } from 'express';
import { verificarToken, permitirRoles } from '../middlewares/auth.js';
import { conversaciones, mensajesDe, misMensajes, noLeidos } from '../controllers/chat.controller.js';

const router = Router();
router.use(verificarToken);

router.get('/no-leidos', permitirRoles('ADMIN', 'PROPIETARIO'), noLeidos);
router.get('/mios', permitirRoles('PROPIETARIO'), misMensajes);
router.get('/conversaciones', permitirRoles('ADMIN'), conversaciones);
router.get('/mensajes/:propietarioId', permitirRoles('ADMIN'), mensajesDe);

export default router;
