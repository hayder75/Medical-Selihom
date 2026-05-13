const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const results = await prisma.labTestResult.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { order: true }
  });
  
  console.log('Recent Lab Results:');
  results.forEach(r => {
    console.log('---');
    console.log('Order:', r.orderId);
    console.log('Results:', JSON.stringify(r.results).substring(0, 200));
  });
  
  await prisma.();
}

main().catch(console.error);
