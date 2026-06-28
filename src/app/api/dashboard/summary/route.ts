import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiUser } from '@/lib/api-auth-guard';
import { getDepartmentScopedPlanWhere } from '@/lib/department-access';
import { toNumber } from '@/lib/business-plan-engine';

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const where = await getDepartmentScopedPlanWhere(auth.user);
  const plans = await prisma.businessPlan.findMany({
    where,
    include: {
      department: true,
      activities: true
    }
  });

  const map = new Map<string, any>();
  const overall = { planCount: 0, activityCount: 0, estimatedCost: 0, recurrentBudget: 0, developmentPartners: 0, unfundedBudget: 0 };

  for (const plan of plans) {
    const departmentKey = plan.departmentId || plan.costCenter || 'UNASSIGNED';
    const key = `${departmentKey}__${plan.status}`;
    const estimatedCost = plan.activities.reduce((sum: number, activity: any) => sum + toNumber(activity.estimatedCost), 0);
    const recurrentBudget = plan.activities.reduce((sum: number, activity: any) => sum + toNumber(activity.recurrentBudget), 0);
    const developmentPartners = plan.activities.reduce((sum: number, activity: any) => sum + toNumber(activity.developmentPartners), 0);
    const unfundedBudget = estimatedCost - recurrentBudget - developmentPartners;

    if (!map.has(key)) {
      map.set(key, {
        departmentId: plan.departmentId,
        departmentCode: plan.department?.code || plan.costCenter || 'UNASSIGNED',
        departmentName: plan.department?.name || plan.costCenterName || 'Unassigned Department',
        status: plan.status,
        planCount: 0,
        activityCount: 0,
        estimatedCost: 0,
        recurrentBudget: 0,
        developmentPartners: 0,
        unfundedBudget: 0
      });
    }

    const row = map.get(key);
    row.planCount += 1;
    row.activityCount += plan.activities.length;
    row.estimatedCost += estimatedCost;
    row.recurrentBudget += recurrentBudget;
    row.developmentPartners += developmentPartners;
    row.unfundedBudget += unfundedBudget;

    overall.planCount += 1;
    overall.activityCount += plan.activities.length;
    overall.estimatedCost += estimatedCost;
    overall.recurrentBudget += recurrentBudget;
    overall.developmentPartners += developmentPartners;
    overall.unfundedBudget += unfundedBudget;
  }

  return NextResponse.json({ overall, rows: Array.from(map.values()).sort((a, b) => `${a.departmentCode}${a.status}`.localeCompare(`${b.departmentCode}${b.status}`)) });
}
