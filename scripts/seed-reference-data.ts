import { PrismaClient } from '@prisma/client';
import { DEFAULT_REFERENCE_DATA } from '../src/lib/reference-data';

const prisma = new PrismaClient();

async function upsertReferenceList(key: string, name: string, values: readonly any[]) {
  const list = await prisma.referenceList.upsert({
    where: { key },
    update: { name },
    create: { key, name }
  });

  await prisma.referenceItem.deleteMany({ where: { referenceListId: list.id } });
  await prisma.referenceItem.createMany({
    data: values.map((value: any, index: number) => {
      const code = value.code || value.display || value.label || value.name || String(value);
      const label = value.label || value.description || value.display || value.name || String(value);
      return { referenceListId: list.id, code: String(code), label: String(label), category: value.category || '', sortOrder: index + 1, metadata: value };
    })
  });
}

async function main() {
  for (const dep of DEFAULT_REFERENCE_DATA.departments as readonly any[]) {
    if (!dep.costCenterCode) continue;
    const department = await prisma.department.upsert({
      where: { code: dep.costCenterCode },
      update: { name: dep.name, facility: 'Vila Central Hospital', costCenter: dep.costCenterCode, costCenterName: dep.costCenterName || dep.name, isActive: true },
      create: { code: dep.costCenterCode, name: dep.name, facility: 'Vila Central Hospital', costCenter: dep.costCenterCode, costCenterName: dep.costCenterName || dep.name, isActive: true }
    });
    await prisma.costCenter.upsert({
      where: { code: dep.costCenterCode },
      update: { name: dep.costCenterName || dep.name, departmentId: department.id, isActive: true },
      create: { code: dep.costCenterCode, name: dep.costCenterName || dep.name, departmentId: department.id, facility: 'Vila Central Hospital', isActive: true }
    });
  }

  for (const account of DEFAULT_REFERENCE_DATA.accountCodes) {
    await prisma.accountCode.upsert({
      where: { code: account.code },
      update: { description: account.label, budgetCategory: account.category, isActive: true },
      create: { code: account.code, description: account.label, budgetCategory: account.category, isActive: true }
    });
  }

  for (const source of DEFAULT_REFERENCE_DATA.fundingSources) {
    await prisma.fundingSource.upsert({
      where: { id: String(source).toLowerCase().replace(/[^a-z0-9]+/g, '-') },
      update: { name: source, type: source === 'Recurrent' ? 'GOVERNMENT_RECURRENT' : 'OTHER', confirmationStatus: source === 'Recurrent' ? 'CONFIRMED' : 'PENDING', isActive: true },
      create: { id: String(source).toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: source, type: source === 'Recurrent' ? 'GOVERNMENT_RECURRENT' : 'OTHER', confirmationStatus: source === 'Recurrent' ? 'CONFIRMED' : 'PENDING', isActive: true }
    });
  }

  // ReferenceItem has generated IDs. To keep the script idempotent without adding a composite unique constraint, refresh generated lists.
  for (const key of ['activity-categories', 'funding-sources', 'budget-categories', 'nsdp-targets', 'account-codes']) {
    const existing = await prisma.referenceList.findUnique({ where: { key } });
    if (existing) await prisma.referenceItem.deleteMany({ where: { referenceListId: existing.id } });
  }

  await upsertReferenceList('activity-categories', 'Activity Categorisation', DEFAULT_REFERENCE_DATA.activityCategories);
  await upsertReferenceList('funding-sources', 'Funding Sources', DEFAULT_REFERENCE_DATA.fundingSources);
  await upsertReferenceList('budget-categories', 'Budget Categories', DEFAULT_REFERENCE_DATA.budgetCategories);
  await upsertReferenceList('nsdp-targets', 'NSDP Targets', DEFAULT_REFERENCE_DATA.nsdpTargets);
  await upsertReferenceList('account-codes', 'Account Codes', DEFAULT_REFERENCE_DATA.accountCodes);

  console.log('Reference data seeded from workbook Lists tab fallback data.');
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(async () => prisma.$disconnect());
