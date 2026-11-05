import { useCallback, useEffect, useState } from 'react';

const CLAVE = 'theme';

// Se llama UNA vez al arrancar la app (en main.jsx):
//  1) restaura el tema guardado (oscuro/claro)
//  2) vigila la clase "dark" de <html> y guarda cualquier cambio
export function iniciarTema() {
  const raiz = document.documentElement;

  let guardado = null;
  try { guardado = localStorage.getItem(CLAVE); } catch { /* sin acceso a localStorage */ }

  raiz.classList.toggle('dark', guardado === 'dark');

  new MutationObserver(() => {
    try {
      localStorage.setItem(CLAVE, raiz.classList.contains('dark') ? 'dark' : 'light');
    } catch { /* ignorar */ }
  }).observe(raiz, { attributes: true, attributeFilter: ['class'] });
}

// Hook para los botones de tema. El estado SIEMPRE se lee de la clase real de <html>,
// así nunca pisa el tema restaurado y todos los botones quedan sincronizados.
//   const { oscuro, alternar } = useTema();
export function useTema() {
  const raiz = document.documentElement;
  const [oscuro, setOscuro] = useState(() => raiz.classList.contains('dark'));

  useEffect(() => {
    const vigilante = new MutationObserver(() => setOscuro(raiz.classList.contains('dark')));
    vigilante.observe(raiz, { attributes: true, attributeFilter: ['class'] });
    return () => vigilante.disconnect();
  }, [raiz]);

  const alternar = useCallback(() => raiz.classList.toggle('dark'), [raiz]);

  return { oscuro, alternar };
}
