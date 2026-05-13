const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.labOrder.findMany({ 
    take: 3,
    include: { patient: true, labTest: true }
  });
  console.log('=== Sample Lab Orders ===');
  orders.forEach(o => {
    console.log('Order ID:', o.id, '| Patient:', o.patient?.name, '| Test:', o.labTest?.name, '| Status:', o.status);
  });
  await prisma.$disconnect();
}

main().catch(console.error);
