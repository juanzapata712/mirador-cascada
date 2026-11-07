# mirador-cascada
Urbanización Mirador de la Cascada

Aplicación web para la administración de una urbanización: pagos de administración, registro y control de visitantes con código QR, tablero de comunicados y chat en tiempo real entre propietarios y la administración.

Tecnologías

Capa y herramientas
Frontend |	React + Vite, Tailwind CSS, React Router, Axios.
Backend	 | Node.js + Express.
Base de datos	| PostgreSQL con Prisma ORM.
Tiempo real	| Socket.IO.
Seguridad	| JWT, bcryptjs, control de acceso por roles.
Archivos | 	Multer (comprobantes e imágenes).
QR | 	qrcode.react (generar) y html5-qrcode (escanear).

Funcionalidades

Roles y	Qué puede hacer
Administrador |	Gestionar propietarios · generar cuotas mensuales · revisar comprobantes de pago · publicar comunicados · consultar el historial de visitantes · responder el chat · crear porteros · ver el dashboard con indicadores

Propietario|	Ver su saldo y cuotas · pagar subiendo el comprobante · registrar visitantes y obtener su QR · leer el tablero · chatear con la administración

Portero |	Validar visitantes escaneando el QR (o con el código) y registrar su ingreso y salida

Estructura del proyecto

mirador-cascada/
├── backend/
│   ├── prisma/            esquema, migraciones y datos iniciales
│   ├── src/
│   │   ├── controllers/   lógica de cada módulo
│   │   ├── routes/        endpoints de la API
│   │   ├── middlewares/   autenticación, roles y subida de archivos
│   │   ├── sockets/       chat en tiempo real
│   │   ├── lib/           utilidades (base de datos, fechas, cartera)
│   │   └── app.js
│   ├── uploads/           archivos subidos (no se guardan en Git)
│   └── .env.example
├── frontend/
│   └── src/
│       ├── pages/         pantallas por rol (admin, propietario, porteria)
│       ├── components/    layouts y componentes compartidos
│       ├── context/       sesión y conexión del chat
│       ├── services/      cliente de la API
│       └── utils/
├── iniciar-demo.bat       arranque con un clic (Windows)
├── README.md
└── INSTALACION.md

Equipo

Sebastian Andres Diaz Moreno
Tomas Restrepo
Stiven lopera Herrera
Juan Manuel Zapata Florez

