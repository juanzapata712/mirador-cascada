import { Router } from 'express';
import { verificarToken, permitirRoles } from '../middlewares/auth.js';
import { listar, crear, cambiarActivo } from '../controllers/porteros.controller.js';

const router = Router();
router.use(verificarToken, permitirRoles('ADMIN'));

router.get('/', listar);
router.post('/', crear);
router.patch('/:id/activo', cambiarActivo);

export default router;
