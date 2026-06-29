import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiUser } from '@/lib/api-auth-guard';
import { getBudgetPosition } from '@/lib/budget-control';
import { getDepartmentScopedCostCenters, userHasGlobalDepartmentAccess } from '@/lib/department-access';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get('year') || 2026);
  const costCenter = searchParams.get('costCenter') || '';
  const scopedCostCenters = await getDepartmentScopedCostCenters(auth.user, year);
  const scopedSet = new Set(scopedCostCenters);
  const hasGlobal = userHasGlobalDepartmentAccess(auth.user);

  if (costCenter) {
    if (!hasGlobal && !scopedSet.has(costCenter)) {
      return NextResponse.json({ error: 'You do not have access to this cost center.' }, { status: 403 });
    }
    const position = await getBudgetPosition(prisma, costCenter, year);
    return NextResponse.json({ year, rows: [position], overall: position });
  }

  const allowedFilter = hasGlobal ? {} : { in: scopedCostCenters.length ? scopedCostCenters : ['__NO_ACCESS__'] };
  const plans = await prisma.businessPlan.findMany({ where: { year, ...(hasGlobal ? {} : { costCenter: allowedFilter }) }, select: { costCenter: true }, distinct: ['costCenter'] }).catch(() => []);
  const commitments = await prisma.commitment.groupBy({ by: ['costCenterCode'], where: hasGlobal ? {} : { costCenterCode: allowedFilter }, _sum: { amount: true } }).catch(() => []);
  const expenditures = await prisma.expenditure.groupBy({ by: ['costCenterCode'], where: hasGlobal ? {} : { costCenterCode: allowedFilter }, _sum: { amount: true } }).catch(() => []);
  const codes = Array.from(new Set([...plans.map((p: any) => p.costCenter), ...commitments.map((c: any) => c.costCenterCode), ...expenditures.map((e: any) => e.costCenterCode), ...scopedCostCenters].filter(Boolean)))
    .filter((code) => hasGlobal || scopedSet.has(code));
  const rows = await Promise.all(codes.map((code) => getBudgetPosition(prisma, code, year)));
  const overall = rows.reduce((sum, row) => {
    sum.availableBudget += row.availableBudget;
    sum.planBudget += row.planBudget;
    sum.commitments += row.commitments;
    sum.expenditure += row.expenditure;
    sum.remainingBudget += row.remainingBudget;
    return sum;
  }, { availableBudget: 0, planBudget: 0, commitments: 0, expenditure: 0, remainingBudget: 0 });

  return NextResponse.json({ year, overall, rows });
}
