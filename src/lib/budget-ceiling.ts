import { prisma } from '@/lib/prisma';
import { canManageBudgetCeilings } from '@/lib/access-policy';

function toNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'bigint') return Number(value);
  if (value && typeof (value as any).toString === 'function') {
    const parsed = Number((value as any).toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateAvailableCeiling(row: any) {
  if (!row) return 0;
  return Math.max(0,
    toNumber(row.approvedCeiling) +
    toNumber(row.supplementary) +
    toNumber(row.virementsIn) -
    toNumber(row.virementsOut) -
    toNumber(row.restrictedFunds) -
    toNumber(row.withdrawnFunds)
  );
}

export async function getApprovedCeilingForCostCenter(costCenterCode: string | null | undefined, fiscalYear: number | null | undefined) {
  const code = String(costCenterCode || '').trim();
  const year = Number(fiscalYear || new Date().getFullYear());
  if (!code || !Number.isFinite(year)) return null;

  const row = await prisma.departmentBudgetCeiling.findUnique({
    where: { fiscalYear_costCenterCode: { fiscalYear: year, costCenterCode: code } }
  }).catch(() => null);

  if (!row) return null;
  return calculateAvailableCeiling(row);
}

export async function resolvePlanCeilingForSave(options: {
  role: unknown;
  requestedCeilingAmount: number;
  costCenterCode: string | null | undefined;
  fiscalYear: number | null | undefined;
  existingCeilingAmount?: unknown;
}) {
  const requested = toNumber(options.requestedCeilingAmount);

  if (canManageBudgetCeilings(options.role)) {
    return requested;
  }

  // Non-ceiling roles cannot alter an existing plan's ceiling through plan save.
  if (options.existingCeilingAmount !== undefined && options.existingCeilingAmount !== null) {
    return toNumber(options.existingCeilingAmount);
  }

  // For new imported plans, prefer the official budget ceiling table when it exists.
  const approved = await getApprovedCeilingForCostCenter(options.costCenterCode, options.fiscalYear);
  if (approved !== null) return approved;

  // If no official ceiling record exists yet, keep the imported workbook value as a provisional baseline.
  // The field is still locked in the UI for non-ceiling roles, and official roles can later update it.
  return requested;
}
