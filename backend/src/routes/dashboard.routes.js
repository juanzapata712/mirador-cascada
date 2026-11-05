import { Router } from 'express';
import { verificarToken, permitirRoles } from '../middlewares/auth.js';
import { resumen } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/', verificarToken, permitirRoles('ADMIN'), resumen);

export default router;
