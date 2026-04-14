import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');
  
  // Create default admin user if not exists
  // Password is 'admin123' (hashed)
  const adminEmail = 'admin@geosurepath.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: 'System Admin',
        email: adminEmail,
        password: '$2b$12$K7v1S.tW0eX7y5c9e4p5e.O1nL.vE1G1B1e1f1g1h1i1j1k1l1m1n', // Placeholder
        role: 'ADMIN',
        isActive: true,
        isEmailVerified: true
      }
    });
    console.log(`Created default admin user: ${adminEmail}`);
  }

  // Create default vehicle types if needed (example)
  // ...
  
  console.log('Seeding completed.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
