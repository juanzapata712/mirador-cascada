import LayoutBase from './LayoutBase';

const enlaces = [
  { to: '/propietario', texto: 'Inicio', icono: 'inicio', end: true },
  { to: '/propietario/pagos', texto: 'Mis pagos', icono: 'pagos' },
  { to: '/propietario/visitantes', texto: 'Mis visitantes', icono: 'visitantes' },
  { to: '/propietario/tablero', texto: 'Tablero', icono: 'tablero' },
  { to: '/propietario/chat', texto: 'Chat', icono: 'chat', chat: true },
  { to: '/propietario/cuenta', texto: 'Mi cuenta', icono: 'perfil' },
];

export default function LayoutPropietario() {
  return (
    <LayoutBase
      acento="emerald"
      subtitulo="Portal propietarios"
      rolTexto="Propietario"
      enlaces={enlaces}
      rutaCuenta="/propietario/cuenta"
    />
  );
}
