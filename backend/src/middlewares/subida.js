import multer from 'multer';
import path from 'path';
import fs from 'fs';

const carpeta = path.resolve('uploads/comprobantes');
fs.mkdirSync(carpeta, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, carpeta),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ok = TIPOS.includes(file.mimetype);
    cb(ok ? null : new Error('Solo se permiten imágenes (JPG, PNG, WEBP) o PDF'), ok);
  },
});

// Recibe un archivo en el campo "comprobante" y responde bien si falla
export function subirComprobante(req, res, next) {
  upload.single('comprobante')(req, res, (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'El archivo supera los 5 MB' : err.message;
      return res.status(400).json({ error: msg });
    }
    next();
  });
}
