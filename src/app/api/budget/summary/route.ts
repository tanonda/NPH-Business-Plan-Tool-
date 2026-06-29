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
  const year = Number(searchParams.get('year') || new Date().getFullYear());

  const scopedCostCenters = await getDepartmentScopedCostCenters(auth.user, year);
  const scopedSet = new Set(scopedCostCenters);

  const costCenters = await prisma.businessPlan.findMany({
    where: { year, ...(userHasGlobalDepartmentAccess(auth.user) ? {} : { costCenter: { in: scopedCostCenters.length ? scopedCostCenters : ['__NO_ACCESS__'] } }) },
    select: { costCenter: true },
    distinct: ['costCenter']
  }).catch(() => []);

  const ceilingCenters = await prisma.departmentBudgetCeiling.findMany({
    where: {
      fiscalYear: year,
      ...(userHasGlobalDepartmentAccess(auth.user) ? {} : { costCenterCode: { in: scopedCostCenters.length ? scopedCostCenters : ['__NO_ACCESS__'] } })
    },
    select: { costCenterCode: true }
  }).catch(() => []);

  const unique = Array.from(new Set([
    ...costCenters.map((c: any) => c.costCenter),
    ...ceilingCenters.map((c: any) => c.costCenterCode),
    ...scopedCostCenters
  ].filter(Boolean))).filter((code) => userHasGlobalDepartmentAccess(auth.user) || scopedSet.has(code));

  const rows = await Promise.all(unique.map((code) => getBudgetPosition(prisma, code, year)));
  const overall = rows.reduce((sum, row) => ({
    approvedCeiling: sum.approvedCeiling + row.approvedCeiling,
    availableBudget: sum.availableBudget + row.availableBudget,
    planBudget: sum.planBudget + row.planBudget,
    commitments: sum.commitments + row.commitments,
    expenditure: sum.expenditure + row.expenditure,
    remainingBudget: sum.remainingBudget + row.remainingBudget,
    pendingDonorFunds: sum.pendingDonorFunds + row.pendingDonorFunds,
    confirmedDonorFunds: sum.confirmedDonorFunds + row.confirmedDonorFunds
  }), { approvedCeiling: 0, availableBudget: 0, planBudget: 0, commitments: 0, expenditure: 0, remainingBudget: 0, pendingDonorFunds: 0, confirmedDonorFunds: 0 });

  return NextResponse.json({ year, overall, rows });
}
