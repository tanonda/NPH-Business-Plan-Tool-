import { toNumber } from '@/lib/business-plan-engine';

export type BudgetPosition = {
  costCenterCode: string;
  fiscalYear: number;
  approvedCeiling: number;
  supplementary: number;
  virementsIn: number;
  virementsOut: number;
  restrictedFunds: number;
  withdrawnFunds: number;
  confirmedDonorFunds: number;
  pendingDonorFunds: number;
  availableBudget: number;
  planBudget: number;
  commitments: number;
  expenditure: number;
  remainingBudget: number;
  varianceToCeiling: number;
  percentUsed: number;
  warnings: string[];
};

export function calculateAvailableBudget(input: {
  approvedCeiling?: unknown;
  supplementary?: unknown;
  virementsIn?: unknown;
  virementsOut?: unknown;
  restrictedFunds?: unknown;
  withdrawnFunds?: unknown;
  confirmedDonorFunds?: unknown;
}) {
  return toNumber(input.approvedCeiling as any) +
    toNumber(input.supplementary as any) +
    toNumber(input.virementsIn as any) +
    toNumber(input.confirmedDonorFunds as any) -
    toNumber(input.virementsOut as any) -
    toNumber(input.restrictedFunds as any) -
    toNumber(input.withdrawnFunds as any);
}

export function hasBudgetActivity(position: Omit<BudgetPosition, 'warnings'>) {
  return [
    position.approvedCeiling,
    position.supplementary,
    position.virementsIn,
    position.virementsOut,
    position.restrictedFunds,
    position.withdrawnFunds,
    position.confirmedDonorFunds,
    position.pendingDonorFunds,
    position.planBudget,
    position.commitments,
    position.expenditure
  ].some((value) => Math.abs(toNumber(value as any)) > 0);
}

export function buildBudgetWarnings(position: Omit<BudgetPosition, 'warnings'>) {
  const warnings: string[] = [];
  const hasActivity = hasBudgetActivity(position);

  // Do not flag an untouched cost center as an issue. Department/cost-center
  // reference rows are allowed to exist before ceilings, plans, commitments,
  // or expenditures are entered.
  if (!hasActivity) return warnings;

  if (position.approvedCeiling <= 0 && (position.planBudget > 0 || position.commitments > 0 || position.expenditure > 0)) {
    warnings.push('No approved government ceiling has been entered for this cost center/year.');
  }
  if (position.planBudget > position.availableBudget) warnings.push(`Approved/planned budget is over available budget by ${position.planBudget - position.availableBudget}.`);
  if (position.pendingDonorFunds > 0) warnings.push('Plan contains pending donor funds that should not be treated as confirmed budget.');
  if (position.remainingBudget < 0) warnings.push(`Budget is overspent/overcommitted by ${Math.abs(position.remainingBudget)}.`);
  if (position.percentUsed >= 80 && position.percentUsed < 100) warnings.push('Budget usage is above 80%.');
  if (position.percentUsed >= 100) warnings.push('Budget usage is at or above 100%.');
  return warnings;
}

export async function getBudgetPosition(prisma: any, costCenterCode: string, fiscalYear: number): Promise<BudgetPosition> {
  const ceiling = await prisma.departmentBudgetCeiling.findFirst({
    where: { costCenterCode, fiscalYear },
    orderBy: { updatedAt: 'desc' }
  }).catch(() => null);

  const donorRows = await prisma.donorFundAllocation.findMany({
    where: { businessPlan: { is: { costCenter: costCenterCode, year: fiscalYear } } }
  }).catch(() => []);

  const plans = await prisma.businessPlan.findMany({
    where: { costCenter: costCenterCode, year: fiscalYear },
    include: { activities: true }
  }).catch(() => []);

  const commitments = await prisma.commitment.findMany({
    where: { costCenterCode, businessPlan: { is: { year: fiscalYear } }, status: { not: 'CANCELLED' } }
  }).catch(() => []);

  const expenditures = await prisma.expenditure.findMany({
    where: { costCenterCode, businessPlan: { is: { year: fiscalYear } } }
  }).catch(() => []);

  const confirmedDonorFunds = donorRows.reduce((sum: number, row: any) => sum + toNumber(row.confirmedAmount), 0);
  const pendingDonorFunds = donorRows.reduce((sum: number, row: any) => sum + toNumber(row.pendingAmount), 0);
  const planBudget = plans.reduce((sum: number, plan: any) => sum + (plan.activities || []).reduce((aSum: number, activity: any) => aSum + toNumber(activity.recurrentBudget || activity.estimatedCost), 0), 0);
  const committed = commitments.reduce((sum: number, row: any) => sum + toNumber(row.amount), 0);
  const spent = expenditures.reduce((sum: number, row: any) => sum + toNumber(row.amount), 0);

  const base = {
    costCenterCode,
    fiscalYear,
    approvedCeiling: toNumber(ceiling?.approvedCeiling),
    supplementary: toNumber(ceiling?.supplementary),
    virementsIn: toNumber(ceiling?.virementsIn),
    virementsOut: toNumber(ceiling?.virementsOut),
    restrictedFunds: toNumber(ceiling?.restrictedFunds),
    withdrawnFunds: toNumber(ceiling?.withdrawnFunds),
    confirmedDonorFunds,
    pendingDonorFunds,
    availableBudget: 0,
    planBudget,
    commitments: committed,
    expenditure: spent,
    remainingBudget: 0,
    varianceToCeiling: 0,
    percentUsed: 0
  };

  base.availableBudget = calculateAvailableBudget(base);
  base.remainingBudget = base.availableBudget - base.planBudget - base.commitments - base.expenditure;
  base.varianceToCeiling = base.availableBudget - base.planBudget;
  base.percentUsed = base.availableBudget > 0 ? ((base.planBudget + base.commitments + base.expenditure) / base.availableBudget) * 100 : 0;

  return { ...base, warnings: buildBudgetWarnings(base) };
}
