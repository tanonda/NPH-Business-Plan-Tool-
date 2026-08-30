import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole } from '@/lib/api-auth-guard';
import { PillarBudgetAllocationSchema } from '@/lib/schemas';
import { userCanAccessDepartment } from '@/lib/department-access';
import { createGovernanceReview } from '@/lib/governance';

const transitions: Record<string, string[]> = {
  INDICATIVE: ['REQUESTED'],
  REQUESTED: ['APPROVED', 'RETURNED'],
  RETURNED: ['REQUESTED'],
  APPROVED: ['CLOSED'],
  CLOSED: []
};

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(['ADMIN', 'PLANNER', 'FINANCE', 'BUDGET_OFFICER']);
  if (!auth.ok) return auth.response;
  const body = await request.json();
  const requestedStatus = String(body.status || '').toUpperCase();
  const comment = String(body.comment || '').trim();
  const allocation = await prisma.pillarBudgetAllocation.findUnique({ where: { id: params.id }, select: { status: true, requestedAmount: true, approvedAmount: true, indicativeAmount: true, pillarId: true, departmentId: true, fiscalYear: true } });
  if (!allocation) return NextResponse.json({ error: 'Pillar Budget Allocation not found.' }, { status: 404 });
  if (!transitions[allocation.status]?.includes(requestedStatus)) return NextResponse.json({ error: `Invalid allocation transition from ${allocation.status} to ${requestedStatus}.` }, { status: 409 });
  if (requestedStatus === 'RETURNED' && !comment) return NextResponse.json({ error: 'A return reason is required.' }, { status: 400 });
  if (requestedStatus === 'APPROVED' && !['ADMIN', 'FINANCE', 'BUDGET_OFFICER'].includes(auth.user.role)) return NextResponse.json({ error: 'Only Finance, Budget Officer, or Admin can approve an allocation.' }, { status: 403 });
  if (requestedStatus === 'APPROVED' && Number(allocation.approvedAmount) <= 0 && Number(allocation.requestedAmount) <= 0) return NextResponse.json({ error: 'An allocation needs a positive requested or approved amount before approval.' }, { status: 400 });
  const [updated] = await prisma.$transaction(async (tx) => [
    await tx.pillarBudgetAllocation.update({ where: { id: params.id }, data: { status: requestedStatus as any } }),
    await createGovernanceReview(tx, { entityType: 'ALLOCATION', entityId: params.id, previousStatus: allocation.status, newStatus: requestedStatus, comment, reviewedById: auth.user.id, snapshot: allocation })
  ]);
  return NextResponse.json({ ok: true, allocation: updated, previousStatus: allocation.status });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(['ADMIN', 'PLANNER', 'FINANCE', 'BUDGET_OFFICER']);
  if (!auth.ok) return auth.response;
  const data = PillarBudgetAllocationSchema.parse(await request.json());
  const current = await prisma.pillarBudgetAllocation.findUnique({ where: { id: params.id }, include: { fundingSplits: true } });
  if (!current) return NextResponse.json({ error: 'Pillar Budget Allocation not found.' }, { status: 404 });
  if (!(await userCanAccessDepartment(auth.user, data.departmentId, ['OWNER', 'EDITOR'])) && !['ADMIN', 'FINANCE', 'BUDGET_OFFICER'].includes(auth.user.role)) return NextResponse.json({ error: 'You do not have edit access to this department allocation.' }, { status: 403 });
  if (data.status === 'APPROVED' && !['ADMIN', 'FINANCE', 'BUDGET_OFFICER'].includes(auth.user.role)) return NextResponse.json({ error: 'Only Finance, Budget Officer, or Admin can approve a Pillar Budget Allocation.' }, { status: 403 });
  const usedAmount = current.fundingSplits.reduce((sum, split) => sum + Number(split.amount), 0);
  const limit = data.status === 'APPROVED' ? data.approvedAmount : data.requestedAmount || data.indicativeAmount;
  if (limit + 0.01 < usedAmount) return NextResponse.json({ error: `The allocation limit cannot be below its already planned amount of ${usedAmount}.` }, { status: 409 });
  const updated = await prisma.pillarBudgetAllocation.update({ where: { id: params.id }, data, include: { pillar: true, department: true, fundingSource: true, fundingSplits: true } });
  return NextResponse.json({ ...updated, usedAmount, availableAmount: limit - usedAmount });
}
