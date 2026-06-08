const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, "seed-data");

async function main() {
  console.log("Starting seed...\n");

  // ── Admin User ──
  const adminData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "admin.json"), "utf8"));
  const existingAdmin = await prisma.user.findUnique({ where: { username: adminData.username } });
  if (!existingAdmin) {
    await prisma.user.create({ data: adminData });
    console.log("Admin user created:", adminData.username);
  } else {
    console.log("Admin user already exists:", adminData.username);
  }

  // ── Services ──
  const services = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "services.json"), "utf8"));
  let svcCreated = 0, svcSkipped = 0;
  for (const s of services) {
    const exists = await prisma.service.findUnique({ where: { code: s.code } });
    if (!exists) {
      await prisma.service.create({ data: s });
      svcCreated++;
    } else svcSkipped++;
  }
  console.log("Services:", svcCreated, "created,", svcSkipped, "skipped");

  // ── Lab Groups + Tests + Result Fields ──
  const labGroups = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "lab-groups.json"), "utf8"));
  let testsCreated = 0;
  for (const g of labGroups) {
    const { labTests, ...groupData } = g;
    let group = await prisma.labTestGroup.findFirst({ where: { name: groupData.name } });
    if (!group) {
      group = await prisma.labTestGroup.create({ data: groupData });
    }
    for (const t of labTests) {
      const { resultFields, ...testData } = t;
      const existing = await prisma.labTest.findFirst({ where: { name: testData.name } });
      if (existing) continue;
      const test = await prisma.labTest.create({
        data: { ...testData, groupId: group.id }
      });
      if (resultFields.length > 0) {
        await prisma.labTestResultField.createMany({
          data: resultFields.map(f => ({ ...f, testId: test.id }))
        });
      }
      testsCreated++;
    }
  }
  console.log("Lab tests created (grouped):", testsCreated);

  // ── Standalone Lab Tests ──
  const standalonePath = path.join(DATA_DIR, "standalone-tests.json");
  const standalone = fs.existsSync(standalonePath)
    ? JSON.parse(fs.readFileSync(standalonePath, "utf8")) : [];
  let soloCreated = 0;
  for (const t of standalone) {
    const { resultFields, ...testData } = t;
    const existing = await prisma.labTest.findFirst({ where: { name: testData.name } });
    if (existing) continue;
    const test = await prisma.labTest.create({ data: testData });
    if (resultFields.length > 0) {
      await prisma.labTestResultField.createMany({
        data: resultFields.map(f => ({ ...f, testId: test.id }))
      });
    }
    soloCreated++;
  }
  console.log("Standalone lab tests created:", soloCreated);

  // ── Investigation Types ──
  const invTypes = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "investigation-types.json"), "utf8"));
  let invCreated = 0;
  for (const inv of invTypes) {
    const existing = await prisma.investigationType.findFirst({ where: { name: inv.name } });
    if (!existing) {
      await prisma.investigationType.create({ data: inv });
      invCreated++;
    }
  }
  console.log("Investigation types created:", invCreated);

  // ── Insurance ──
  const insurances = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "insurances.json"), "utf8"));
  let insCreated = 0;
  for (const ins of insurances) {
    const existing = await prisma.insurance.findUnique({ where: { code: ins.code } });
    if (!existing) {
      await prisma.insurance.create({ data: ins });
      insCreated++;
    }
  }
  console.log("Insurance companies created:", insCreated);

  // ── Medications ──
  const medications = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "medications.json"), "utf8"));
  let medCreated = 0, medSkipped = 0;
  for (const m of medications) {
    const existing = await prisma.medicationCatalog.findFirst({
      where: { name: m.name, dosageForm: m.dosageForm, strength: m.strength }
    });
    if (!existing) {
      await prisma.medicationCatalog.create({ data: m });
      medCreated++;
    } else medSkipped++;
  }
  console.log("Medications:", medCreated, "created,", medSkipped, "skipped");

  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
