import multer from 'multer';
import path from 'path';
import fs from 'fs';

const carpeta = path.resolve('uploads/perfiles');
fs.mkdirSync(carpeta, { recursive: true });

const EXTENSION = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, carpeta),
  // El nombre lo fija el servidor (no el del archivo original)
  filename: (req, file, cb) => cb(null, `u${req.user.id}-${Date.now()}${EXTENSION[file.mimetype]}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB (el navegador ya la reduce mucho)
  fileFilter: (req, file, cb) => {
    const ok = Boolean(EXTENSION[file.mimetype]);
    cb(ok ? null : new Error('Solo se permiten imágenes JPG, PNG o WEBP'), ok);
  },
});

// Recibe la foto en el campo "foto" y responde bien si falla
export function recibirFoto(req, res, next) {
  upload.single('foto')(req, res, (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'La imagen supera los 3 MB' : err.message;
      return res.status(400).json({ error: msg });
    }
    next();
  });
}
