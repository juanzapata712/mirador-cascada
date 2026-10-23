-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'PROPIETARIO');

-- CreateEnum
CREATE TYPE "EstadoPropietario" AS ENUM ('ACTIVO', 'MOROSO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "EstadoCuota" AS ENUM ('PENDIENTE', 'PAGADA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('EN_REVISION', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('TRANSFERENCIA', 'CONSIGNACION', 'EFECTIVO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoVisita" AS ENUM ('PROGRAMADA', 'INGRESO', 'SALIO', 'CANCELADA');

-- CreateEnum
CREATE TYPE "CategoriaComunicado" AS ENUM ('GENERAL', 'URGENTE', 'MANTENIMIENTO', 'REUNION', 'NORMAS');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "contrasena" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'PROPIETARIO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Propietario" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "documento" TEXT NOT NULL,
    "telefono" TEXT,
    "casaLote" TEXT NOT NULL,
    "estado" "EstadoPropietario" NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT "Propietario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cuota" (
    "id" SERIAL NOT NULL,
    "propietarioId" INTEGER NOT NULL,
    "concepto" TEXT NOT NULL DEFAULT 'Cuota de administración',
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoCuota" NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "Cuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" SERIAL NOT NULL,
    "cuotaId" INTEGER NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodo" "MetodoPago" NOT NULL,
    "comprobanteUrl" TEXT,
    "estado" "EstadoPago" NOT NULL DEFAULT 'EN_REVISION',
    "observacion" TEXT,
    "validadoPorId" INTEGER,
    "validadoEn" TIMESTAMP(3),

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitante" (
    "id" SERIAL NOT NULL,
    "propietarioId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "placa" TEXT,
    "fechaVisita" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT,
    "estado" "EstadoVisita" NOT NULL DEFAULT 'PROGRAMADA',
    "codigoQr" TEXT NOT NULL,
    "horaIngreso" TIMESTAMP(3),
    "horaSalida" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visitante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comunicado" (
    "id" SERIAL NOT NULL,
    "adminId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "categoria" "CategoriaComunicado" NOT NULL DEFAULT 'GENERAL',
    "imagenUrl" TEXT,
    "fijado" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comunicado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensaje" (
    "id" SERIAL NOT NULL,
    "propietarioId" INTEGER NOT NULL,
    "emisorId" INTEGER NOT NULL,
    "contenido" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensaje_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Propietario_usuarioId_key" ON "Propietario"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Propietario_documento_key" ON "Propietario"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "Propietario_casaLote_key" ON "Propietario"("casaLote");

-- CreateIndex
CREATE UNIQUE INDEX "Cuota_propietarioId_mes_anio_key" ON "Cuota"("propietarioId", "mes", "anio");

-- CreateIndex
CREATE UNIQUE INDEX "Visitante_codigoQr_key" ON "Visitante"("codigoQr");

-- CreateIndex
CREATE INDEX "Mensaje_propietarioId_creadoEn_idx" ON "Mensaje"("propietarioId", "creadoEn");

-- AddForeignKey
ALTER TABLE "Propietario" ADD CONSTRAINT "Propietario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cuota" ADD CONSTRAINT "Cuota_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "Propietario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_cuotaId_fkey" FOREIGN KEY ("cuotaId") REFERENCES "Cuota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_validadoPorId_fkey" FOREIGN KEY ("validadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitante" ADD CONSTRAINT "Visitante_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "Propietario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comunicado" ADD CONSTRAINT "Comunicado_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "Propietario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_emisorId_fkey" FOREIGN KEY ("emisorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
