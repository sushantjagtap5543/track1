const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function run() {
  const email = 'sushant@gmail.com';
  const password = 'sushant1';
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('User not found');
  } else {
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`User: ${user.email}`);
    console.log(`Password: ${password}`);
    console.log(`Match: ${isMatch}`);
    console.log(`Details: ${JSON.stringify({ id: user.id, isActive: user.isActive, role: user.role }, null, 2)}`);
  }
  await prisma.$disconnect();
}
run();
