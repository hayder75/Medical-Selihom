const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tests = await prisma.labTest.findMany({ 
    where: { name: { contains: 'CBC', mode: 'insensitive' } },
    include: { resultFields: true }
  });
  console.log('=== CBC Tests ===');
  tests.forEach(t => {
    console.log('Name:', t.name, '| Code:', t.code);
    if (t.resultFields) {
      console.log('Fields:', t.resultFields.map(f => f.fieldName).join(', '));
    }
  });
  await prisma.$disconnect();
}

main().catch(console.error);
