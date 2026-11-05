import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

// Abre la cámara y llama a onCodigo(texto) cuando lee un QR.
// La cámara solo funciona en https:// o en localhost.
export default function Escaner({ onCodigo, onError }) {
  const alLeer = useRef(onCodigo);
  const alFallar = useRef(onError);
  alLeer.current = onCodigo;
  alFallar.current = onError;

  useEffect(() => {
    let lector;
    let iniciando = null;

    // El pequeño retraso evita arrancar dos veces en modo desarrollo (StrictMode)
    const temporizador = setTimeout(() => {
      lector = new Html5Qrcode('lector-qr');
      iniciando = lector
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 220 },
          (texto) => alLeer.current(texto),
          () => {}
        )
        .catch(() => alFallar.current?.());
    }, 300);

    return () => {
      clearTimeout(temporizador);
      if (iniciando) {
        iniciando.then(() => lector.stop()).then(() => lector.clear()).catch(() => {});
      }
    };
  }, []);

  return <div id="lector-qr" className="w-full max-w-sm mx-auto rounded-lg overflow-hidden bg-black/5 min-h-16" />;
}
