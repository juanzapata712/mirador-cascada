import LayoutBase from './LayoutBase';

const enlaces = [
  { to: '/admin', texto: 'Inicio', icono: 'inicio', end: true },
  { to: '/admin/propietarios', texto: 'Propietarios', icono: 'propietarios' },
  { to: '/admin/cuotas', texto: 'Cuotas', icono: 'cuotas' },
  { to: '/admin/pagos', texto: 'Pagos', icono: 'pagos' },
  { to: '/admin/visitantes', texto: 'Visitantes', icono: 'visitantes' },
  { to: '/admin/tablero', texto: 'Tablero', icono: 'tablero' },
  { to: '/admin/chat', texto: 'Chat', icono: 'chat', chat: true },
  { to: '/admin/porteros', texto: 'Porteros', icono: 'porteros' },
  { to: '/porteria', texto: 'Portería', icono: 'porteria' },
  { to: '/admin/cuenta', texto: 'Mi cuenta', icono: 'perfil' },
];

export default function LayoutAdmin() {
  return (
    <LayoutBase
      acento="indigo"
      subtitulo="Panel administrativo"
      rolTexto="Administrador"
      enlaces={enlaces}
      rutaCuenta="/admin/cuenta"
    />
  );
}
