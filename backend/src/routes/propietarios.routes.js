import { Router } from 'express';
import { verificarToken, permitirRoles } from '../middlewares/auth.js';
import {
  listar, crear, actualizar, cambiarActivo, miPerfil,
} from '../controllers/propietarios.controller.js';

const router = Router();
router.use(verificarToken);

// El propietario consulta sus datos (esta ruta va ANTES de "/:id")
router.get('/yo', permitirRoles('PROPIETARIO'), miPerfil);

// Solo administrador
router.get('/', permitirRoles('ADMIN'), listar);
router.post('/', permitirRoles('ADMIN'), crear);
router.put('/:id', permitirRoles('ADMIN'), actualizar);
router.patch('/:id/activo', permitirRoles('ADMIN'), cambiarActivo);

export default router;
