const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const positions = await prisma.signedPosition.findMany({
    take: 20,
    orderBy: {
      timestamp: 'desc',
    },
  });

  console.log('--- Latest Signed Positions ---');
  positions.forEach(p => {
    console.log(`Device: ${p.deviceId} | Lat: ${p.latitude.toFixed(6)} | Lng: ${p.longitude.toFixed(6)} | Time: ${p.timestamp.toISOString()}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
