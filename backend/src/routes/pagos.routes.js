import { Router } from 'express';
import { verificarToken, permitirRoles } from '../middlewares/auth.js';
import { subirComprobante } from '../middlewares/subida.js';
import { registrar, registrarManual, listar, revisar } from '../controllers/pagos.controller.js';

const router = Router();
router.use(verificarToken);

router.post('/', permitirRoles('PROPIETARIO'), subirComprobante, registrar);
router.post('/manual', permitirRoles('ADMIN'), registrarManual);
router.get('/', permitirRoles('ADMIN'), listar);
router.patch('/:id/revisar', permitirRoles('ADMIN'), revisar);

export default router;
