import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole, requireApiUser } from '@/lib/api-auth-guard';
import { ExpenditureSchema } from '@/lib/schemas';
import { getDepartmentScopedCostCenters, requirePlanDepartmentReviewAccess, userHasGlobalDepartmentAccess } from '@/lib/department-access';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(request.url);
  const businessPlanId = searchParams.get('businessPlanId') || undefined;
  const costCenterCode = searchParams.get('costCenterCode') || undefined;

  if (businessPlanId) {
    const access = await requirePlanDepartmentReviewAccess(auth.user, businessPlanId);
    if (!access.ok) return access.response;
  }

  const allowedCostCenters = userHasGlobalDepartmentAccess(auth.user)
    ? null
    : await getDepartmentScopedCostCenters(auth.user);

  if (costCenterCode && allowedCostCenters && !allowedCostCenters.includes(costCenterCode)) {
    return NextResponse.json({ error: 'You do not have access to this cost center.' }, { status: 403 });
  }

  const rows = await prisma.expenditure.findMany({
    where: {
      ...(businessPlanId ? { businessPlanId } : {}),
      ...(costCenterCode ? { costCenterCode } : {}),
      ...(allowedCostCenters ? { costCenterCode: { in: allowedCostCenters.length ? allowedCostCenters : ['__NO_ACCESS__'] } } : {})
    },
    orderBy: { expenditureDate: 'desc' },
    take: 100
  }).catch(() => []);
  return NextResponse.json({ rows });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiRole(['ADMIN', 'ACCOUNTING', 'FINANCE', 'BUDGET_OFFICER']);
  if (!auth.ok) return auth.response;
  const data = ExpenditureSchema.parse(await request.json());
  if (data.businessPlanId) {
    const access = await requirePlanDepartmentReviewAccess(auth.user, data.businessPlanId);
    if (!access.ok) return access.response;
  } else if (!userHasGlobalDepartmentAccess(auth.user)) {
    const allowedCostCenters = await getDepartmentScopedCostCenters(auth.user);
    if (!allowedCostCenters.includes(data.costCenterCode)) {
      return NextResponse.json({ error: 'You do not have access to this cost center.' }, { status: 403 });
    }
  }
  const row = await prisma.expenditure.create({ data: { ...data, createdById: auth.user.id, expenditureDate: data.expenditureDate || new Date() } });
  await prisma.auditLog.create({ data: { businessPlanId: data.businessPlanId || null, userId: auth.user.id, action: 'EXPENDITURE_ADDED' as any, details: `Expenditure ${data.voucherNumber || ''} ${data.amount}`, metadata: data } }).catch(() => null);
  return NextResponse.json(row, { status: 201 });
}
