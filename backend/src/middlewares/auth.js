import jwt from 'jsonwebtoken';

// Verifica que la petición traiga un token válido
export function verificarToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, rol }
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o vencido' });
  }
}

// Uso: router.get('/ruta', verificarToken, permitirRoles('ADMIN'), handler)
export function permitirRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permiso para esto' });
    }
    next();
  };
}
