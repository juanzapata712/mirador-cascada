const ICONOS = {
  inicio: (<><path d="M3 11l9-8 9 8" /><path d="M5 10v10h5v-6h4v6h5V10" /></>),
  propietarios: (<><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.5" /><path d="M17 14c2.8 0 5 2.2 5 5" /></>),
  cuotas: (<><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>),
  pagos: (<><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M7 15h3" /></>),
  visitantes: (<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" /></>),
  tablero: (<><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M7 9h10M7 13h6M8 21h8" /></>),
  chat: (<path d="M21 12a8.5 8.5 0 01-12.3 7.6L3.5 21l1.4-5A8.5 8.5 0 1121 12z" />),
  porteros: (<><path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></>),
  porteria: (<><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M15 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4" /></>),
  perfil: (<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></>),
  sol: (<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>),
  luna: (<path d="M21 13A9 9 0 1111 3a7 7 0 0010 10z" />),
  menu: (<path d="M4 7h16M4 12h16M4 17h16" />),
  cerrar: (<path d="M6 6l12 12M18 6L6 18" />),
  salir: (<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>),
  volver: (<path d="M15 6l-6 6 6 6" />),
  flecha: (<path d="M9 6l6 6-6 6" />),
  edificio: (<path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />),
  candado: (<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 118 0v3" /></>),
  ojo: (<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>),
  ojoOculto: (<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /><path d="M4 4l16 16" /></>),
  check: (<path d="M5 12.5l4.5 4.5L19 7.5" />),
};

export default function Icono({ nombre, className = 'w-5 h-5' }) {
  const contenido = ICONOS[nombre];
  if (!contenido) return null;
  return (
    <svg
      className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      {contenido}
    </svg>
  );
}
