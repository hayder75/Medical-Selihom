const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const tests = await prisma.labTest.findMany({ where: { name: { contains: 'CBC', mode: 'insensitive' } } });
  console.log('CBC Tests:', tests.map(t => ({ name: t.name, code: t.code })));
  await prisma.$disconnect();
}
main().catch(console.error);
