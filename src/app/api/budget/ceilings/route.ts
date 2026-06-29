import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole, requireApiUser } from '@/lib/api-auth-guard';
import { DepartmentBudgetCeilingSchema } from '@/lib/schemas';
import { getDepartmentScopedCostCenters, userHasGlobalDepartmentAccess } from '@/lib/department-access';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(request.url);
  const fiscalYear = Number(searchParams.get('year') || new Date().getFullYear());
  const allowedCostCenters = userHasGlobalDepartmentAccess(auth.user)
    ? null
    : await getDepartmentScopedCostCenters(auth.user, fiscalYear);
  const rows = await prisma.departmentBudgetCeiling.findMany({
    where: {
      fiscalYear,
      ...(allowedCostCenters ? { costCenterCode: { in: allowedCostCenters.length ? allowedCostCenters : ['__NO_ACCESS__'] } } : {})
    },
    include: { department: true },
    orderBy: { costCenterCode: 'asc' }
  }).catch(() => []);
  return NextResponse.json({ fiscalYear, rows });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiRole(['ADMIN', 'FINANCE', 'BUDGET_OFFICER']);
  if (!auth.ok) return auth.response;
  const data = DepartmentBudgetCeilingSchema.parse(await request.json());
  if (!userHasGlobalDepartmentAccess(auth.user)) {
    const allowedCostCenters = await getDepartmentScopedCostCenters(auth.user, data.fiscalYear);
    if (!allowedCostCenters.includes(data.costCenterCode)) {
      return NextResponse.json({ error: 'You do not have access to this cost center.' }, { status: 403 });
    }
  }
  const row = await prisma.departmentBudgetCeiling.upsert({
    where: { fiscalYear_costCenterCode: { fiscalYear: data.fiscalYear, costCenterCode: data.costCenterCode } },
    update: { ...data, createdById: auth.user.id },
    create: { ...data, createdById: auth.user.id }
  });
  await prisma.auditLog.create({ data: { userId: auth.user.id, action: 'BUDGET_CEILING_UPDATED' as any, details: `Updated budget ceiling for ${data.costCenterCode} ${data.fiscalYear}`, metadata: data } }).catch(() => null);
  return NextResponse.json(row);
}
