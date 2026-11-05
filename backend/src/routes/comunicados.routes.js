import { Router } from 'express';
import { verificarToken, permitirRoles } from '../middlewares/auth.js';
import { subirImagen } from '../middlewares/subidaImagen.js';
import {
  listar, crear, actualizar, alternarFijado, eliminar,
} from '../controllers/comunicados.controller.js';

const router = Router();
router.use(verificarToken);

// Cualquier usuario autenticado puede leer el tablero
router.get('/', listar);

// Solo el administrador publica y modifica
router.post('/', permitirRoles('ADMIN'), subirImagen, crear);
router.put('/:id', permitirRoles('ADMIN'), subirImagen, actualizar);
router.patch('/:id/fijar', permitirRoles('ADMIN'), alternarFijado);
router.delete('/:id', permitirRoles('ADMIN'), eliminar);

export default router;
