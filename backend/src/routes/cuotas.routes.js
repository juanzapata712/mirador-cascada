import { Router } from 'express';
import { verificarToken, permitirRoles } from '../middlewares/auth.js';
import { generar, listar, misCuotas } from '../controllers/cuotas.controller.js';

const router = Router();
router.use(verificarToken);

router.get('/mias', permitirRoles('PROPIETARIO'), misCuotas);
router.get('/', permitirRoles('ADMIN'), listar);
router.post('/generar', permitirRoles('ADMIN'), generar);

export default router;
