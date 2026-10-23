import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin123*', 10);
  await prisma.usuario.upsert({
    where: { correo: 'admin@mirador.com' },
    update: {},
    create: { nombre: 'Administrador', correo: 'admin@mirador.com', contrasena: hash, rol: 'ADMIN' },
  });
  console.log('Admin creado: admin@mirador.com / Admin123*');
}

main().finally(() => prisma.$disconnect());
