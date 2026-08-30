import { toNumber } from '@/lib/business-plan-engine';

type Split = { pillarBudgetAllocationId: string; amount: number };
type ActivityWithSplits = { activityDescription: string; estimatedCost: number; pillarFundingSplits?: Split[] };

export async function validatePillarFundingSplits(prisma: any, input: { fiscalYear: number; departmentId?: string | null; activities: ActivityWithSplits[]; existingPlanId?: string | null }) {
  const splits = input.activities.flatMap((activity, index) => (activity.pillarFundingSplits || []).map((split) => ({ ...split, index, activity })));
  if (splits.length === 0) return;

  const allocationIds = [...new Set(splits.map((split) => split.pillarBudgetAllocationId))];
  const allocations = await prisma.pillarBudgetAllocation.findMany({
    where: { id: { in: allocationIds } },
    include: { fundingSplits: { include: { activity: { include: { businessPlan: true } } } } }
  });
  if (allocations.length !== allocationIds.length) throw new Error('One or more selected Pillar Budget Allocations no longer exist.');

  const byId = new Map<string, any>();
  for (const allocation of allocations as any[]) {
    byId.set(allocation.id, allocation);
  }
  const requestedByAllocation = new Map<string, number>();
  for (const activity of input.activities) {
    const activitySplits = activity.pillarFundingSplits || [];
    if (!activitySplits.length) continue;
    const splitTotal = activitySplits.reduce((sum, split) => sum + Number(split.amount || 0), 0);
    if (Math.abs(splitTotal - Number(activity.estimatedCost || 0)) > 0.01) {
      throw new Error(`Pillar allocation splits for “${activity.activityDescription}” must equal the activity estimated cost.`);
    }
    for (const split of activitySplits) requestedByAllocation.set(split.pillarBudgetAllocationId, (requestedByAllocation.get(split.pillarBudgetAllocationId) || 0) + Number(split.amount));
  }

  for (const [allocationId, requested] of requestedByAllocation) {
    const allocation = byId.get(allocationId);
    if (!allocation || allocation.fiscalYear !== input.fiscalYear || (input.departmentId && allocation.departmentId !== input.departmentId)) {
      throw new Error('A selected Pillar Budget Allocation does not belong to this department and financial year.');
    }
    if (allocation.status === 'CLOSED' || allocation.status === 'RETURNED') throw new Error('A selected Pillar Budget Allocation is not available for planning.');
    const alreadyPlanned = allocation.fundingSplits.reduce((sum: number, split: any) => {
      if (input.existingPlanId && split.activity.businessPlanId === input.existingPlanId) return sum;
      return sum + toNumber(split.amount);
    }, 0);
    const limit = toNumber(allocation.status === 'APPROVED' ? allocation.approvedAmount : allocation.requestedAmount || allocation.indicativeAmount);
    if (requested + alreadyPlanned > limit + 0.01) throw new Error(`Pillar Budget Allocation is over-allocated by ${requested + alreadyPlanned - limit}.`);
  }
}
