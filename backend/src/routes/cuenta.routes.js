import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.js';
import { recibirFoto } from '../middlewares/subidaFoto.js';
import {
  miCuenta, actualizarDatos, cambiarContrasena, subirFoto, quitarFoto,
} from '../controllers/cuenta.controller.js';

const router = Router();

// Cualquier rol con sesión iniciada (admin, propietario o portero) gestiona SU cuenta
router.use(verificarToken);

router.get('/', miCuenta);
router.put('/datos', actualizarDatos);
router.put('/contrasena', cambiarContrasena);
router.put('/foto', recibirFoto, subirFoto);
router.delete('/foto', quitarFoto);

export default router;
