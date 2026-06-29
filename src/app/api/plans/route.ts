import { prisma } from '@/lib/prisma';
import { getDepartmentScopedPlanWhere, requireResolvedDepartmentEditAccess } from '@/lib/department-access';
import { summarizePlan, toNumber } from '@/lib/business-plan-engine';
import { PlanSchema } from '@/lib/schemas';
import { writeAuditLog } from '@/lib/auth';
import { requireApiUser, requireApiRole } from '@/lib/api-auth-guard';
import { resolvePlanCeilingForSave } from '@/lib/budget-ceiling';

function withSummary(plan: any) {
  return {
    ...plan,
    summary: summarizePlan(plan.activities.map((a: any) => ({
      estimatedCost: toNumber(a.estimatedCost.toString()),
      recurrentBudget: toNumber(a.recurrentBudget.toString()),
      q1: a.q1,
      q2: a.q2,
      q3: a.q3,
      q4: a.q4
    })))
  };
}

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;  
  
  const departmentWhere = await getDepartmentScopedPlanWhere(auth.user);
const plans = await prisma.businessPlan.findMany({
    where: departmentWhere,
    include: { activities: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { updatedAt: 'desc' }
  });

  return Response.json(plans.map(withSummary));
}

export async function POST(request: Request) {
  const auth = await requireApiRole(['ADMIN', 'PLANNER']);
  if (!auth.ok) return auth.response;
  const parsed = PlanSchema.parse(await request.json());

  const departmentAccess = await requireResolvedDepartmentEditAccess(auth.user, parsed.departmentId || null, parsed.costCenter || null);
  if (!departmentAccess.ok) return departmentAccess.response;

  const savedCeilingAmount = await resolvePlanCeilingForSave({
    role: auth.user.role,
    requestedCeilingAmount: parsed.ceilingAmount,
    costCenterCode: parsed.costCenter,
    fiscalYear: parsed.year
  });

  const plan = await prisma.businessPlan.create({
    data: {
      title: parsed.title,
      organization: parsed.organization,
      facility: parsed.facility,
      costCenter: parsed.costCenter,
      costCenterName: parsed.costCenterName,
      year: parsed.year,
      ceilingAmount: savedCeilingAmount,
      ceilingJustification: parsed.ceilingJustification || '',
      departmentId: departmentAccess.departmentId || null,
      ownerId: auth.user.id,
      createdById: auth.user.id,
      updatedById: auth.user.id,
      activities: {
        create: parsed.activities.map((a, index) => ({ ...a, sortOrder: a.sortOrder || index + 1 }))
      }
    },
    include: { activities: { orderBy: { sortOrder: 'asc' } } }
  });

  await writeAuditLog({ businessPlanId: plan.id, action: 'PLAN_CREATED', details: `Created ${plan.title}` });
  return Response.json(withSummary(plan), { status: 201 });
}
