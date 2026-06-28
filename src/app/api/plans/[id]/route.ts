import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canEditPlanContent, getPlanLockMessage } from '@/lib/plan-locking';
import { requirePlanDepartmentAccess } from '@/lib/department-access';
import { PlanSchema } from '@/lib/schemas';
import { writeAuditLog } from '@/lib/auth';
import { summarizePlan, toNumber } from '@/lib/business-plan-engine';
import { requireApiUser, requireApiRole } from '@/lib/api-auth-guard';

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

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const departmentAccess = await requirePlanDepartmentAccess(auth.user, params.id);
  if (!departmentAccess.ok) return departmentAccess.response;
const plan = await prisma.businessPlan.findUnique({
    where: { id: params.id },
    include: { activities: { orderBy: { sortOrder: 'asc' } } }
  });
  if (!plan) return Response.json({ error: 'Business plan not found' }, { status: 404 });
  return Response.json(withSummary(plan));
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(['ADMIN', 'PLANNER']);
  if (!auth.ok) return auth.response;

  const departmentAccess = await requirePlanDepartmentAccess(auth.user, params.id);
  if (!departmentAccess.ok) return departmentAccess.response;

  const parsed = PlanSchema.parse(await request.json());

  const plan = await prisma.$transaction(async (tx: any) => {
    await tx.activity.deleteMany({ where: { businessPlanId: params.id } });
    return tx.businessPlan.update({
      where: { id: params.id },
      data: {
        title: parsed.title,
        organization: parsed.organization,
        facility: parsed.facility,
        costCenter: parsed.costCenter,
        costCenterName: parsed.costCenterName,
        year: parsed.year,
        ceilingAmount: parsed.ceilingAmount,
        departmentId: parsed.departmentId || null,
        updatedById: auth.user.id,
        activities: {
          create: parsed.activities.map((a, index) => ({ ...a, sortOrder: a.sortOrder || index + 1 }))
        }
      },
      include: { activities: { orderBy: { sortOrder: 'asc' } } }
    });
  });

  await writeAuditLog({ businessPlanId: plan.id, action: 'PLAN_UPDATED', details: `Updated ${plan.title}` });
  return Response.json(withSummary(plan));
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(['ADMIN']);
  if (!auth.ok) return auth.response;

  const departmentAccess = await requirePlanDepartmentAccess(auth.user, params.id);
  if (!departmentAccess.ok) return departmentAccess.response;

  const plan = await prisma.businessPlan.findUnique({ where: { id: params.id } });
  await prisma.businessPlan.delete({ where: { id: params.id } });
  await writeAuditLog({ action: 'PLAN_DELETED', details: `Deleted ${plan?.title || params.id}` });
  return Response.json({ ok: true });
}
