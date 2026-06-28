import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiUser } from '@/lib/api-auth-guard';
import { requirePlanDepartmentAccess } from '@/lib/department-access';
import { comparePlanToSnapshot } from '@/lib/snapshot-compare';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const departmentAccess = await requirePlanDepartmentAccess(auth.user, params.id);
  if (!departmentAccess.ok) return departmentAccess.response;

  const plan = await prisma.businessPlan.findUnique({
    where: { id: params.id },
    include: { activities: { orderBy: { sortOrder: 'asc' } } }
  });

  if (!plan) return NextResponse.json({ error: 'Plan not found.' }, { status: 404 });

  const snapshot = await prisma.approvalSnapshot.findFirst({
    where: {
      businessPlanId: params.id,
      status: { in: ['APPROVED', 'SUBMITTED'] }
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(comparePlanToSnapshot(plan, snapshot));
}
