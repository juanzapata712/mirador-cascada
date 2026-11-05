import multer from 'multer';
import path from 'path';
import fs from 'fs';

const carpeta = path.resolve('uploads/comunicados');
fs.mkdirSync(carpeta, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, carpeta),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('Solo se permiten imágenes JPG, PNG o WEBP'), ok);
  },
});

// Recibe una imagen opcional en el campo "imagen"
export function subirImagen(req, res, next) {
  upload.single('imagen')(req, res, (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'La imagen supera los 3 MB' : err.message;
      return res.status(400).json({ error: msg });
    }
    next();
  });
}
