import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole } from '@/lib/api-auth-guard';
import { DEFAULT_REFERENCE_DATA } from '@/lib/reference-data';

export const dynamic = 'force-dynamic';

async function resetReferenceList(key: string, name: string, values: readonly any[]) {
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
  return values.length;
}

export async function POST() {
  const auth = await requireApiRole(['ADMIN']);
  if (!auth.ok) return auth.response;

  let departments = 0;
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
    departments += 1;
  }

  const seenAccountCodes = new Set<string>();
  for (const account of DEFAULT_REFERENCE_DATA.accountCodes) {
    if (!account.code || seenAccountCodes.has(account.code)) continue;
    seenAccountCodes.add(account.code);
    await prisma.accountCode.upsert({
      where: { code: account.code },
      update: { description: account.label, budgetCategory: account.category, isActive: true },
      create: { code: account.code, description: account.label, budgetCategory: account.category, isActive: true }
    });
  }

  const counts = {
    departments,
    jobCodes: await resetReferenceList('job-codes', 'Job Codes', DEFAULT_REFERENCE_DATA.jobCodes),
    costCenters: await resetReferenceList('cost-centers', 'Cost Centers', DEFAULT_REFERENCE_DATA.costCenters),
    accountCodes: DEFAULT_REFERENCE_DATA.accountCodes.length,
    activityCategories: await resetReferenceList('activity-categories', 'Activity Categorisation', DEFAULT_REFERENCE_DATA.activityCategories),
    fundingSources: await resetReferenceList('funding-sources', 'Funding Sources', DEFAULT_REFERENCE_DATA.fundingSources),
    budgetCategories: await resetReferenceList('budget-categories', 'Budget Categories', DEFAULT_REFERENCE_DATA.budgetCategories),
    nsdpTargets: await resetReferenceList('nsdp-targets', 'NSDP Targets', DEFAULT_REFERENCE_DATA.nsdpTargets),
    accountCodeReferences: await resetReferenceList('account-codes', 'Account Codes', DEFAULT_REFERENCE_DATA.accountCodes)
  };

  await prisma.auditLog.create({ data: { userId: auth.user.id, action: 'REFERENCE_DATA_IMPORTED', details: 'Imported reference data from workbook Lists tab fallback data.', metadata: counts } }).catch(() => null);
  return NextResponse.json({ ok: true, counts });
}
