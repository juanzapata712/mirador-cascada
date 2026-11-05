import { Router } from 'express';
import { verificarToken, permitirRoles } from '../middlewares/auth.js';
import {
  crear, misVisitantes, cancelar, listar, buscarPorCodigo, registrarIngreso, registrarSalida,
} from '../controllers/visitantes.controller.js';

const router = Router();
router.use(verificarToken);

// Propietario
router.post('/', permitirRoles('PROPIETARIO'), crear);
router.get('/mios', permitirRoles('PROPIETARIO'), misVisitantes);
router.patch('/:id/cancelar', permitirRoles('PROPIETARIO'), cancelar);

// Administrador y portero
router.get('/', permitirRoles('ADMIN', 'PORTERO'), listar);
router.get('/codigo/:codigo', permitirRoles('ADMIN', 'PORTERO'), buscarPorCodigo);
router.patch('/:id/ingreso', permitirRoles('ADMIN', 'PORTERO'), registrarIngreso);
router.patch('/:id/salida', permitirRoles('ADMIN', 'PORTERO'), registrarSalida);

export default router;
