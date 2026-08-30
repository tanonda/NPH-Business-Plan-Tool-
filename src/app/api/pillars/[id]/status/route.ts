import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole } from '@/lib/api-auth-guard';
import { userCanAccessDepartment, userHasGlobalDepartmentAccess } from '@/lib/department-access';
import { createGovernanceReview } from '@/lib/governance';

const transitions: Record<string, string[]> = {
  DRAFT: ['REVIEW'],
  REVIEW: ['APPROVED', 'RETURNED'],
  RETURNED: ['REVIEW'],
  APPROVED: ['ARCHIVED'],
  ARCHIVED: []
};

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(['ADMIN', 'PLANNER', 'APPROVER', 'REVIEWER']);
  if (!auth.ok) return auth.response;
  const body = await request.json();
  const comment = String(body.comment || '').trim();
  const requestedStatus = String(body.status || '').toUpperCase();
  const pillar = await prisma.strategicPillar.findUnique({ where: { id: params.id }, select: { status: true, type: true, code: true, title: true, objective: true, operationalGuidance: true, strategicAlignment: true, ownerDepartmentId: true, parentPillarId: true } });
  if (!pillar) return NextResponse.json({ error: 'Strategic Pillar not found.' }, { status: 404 });
  if (pillar.type === 'MASTER' && auth.user.role !== 'ADMIN') return NextResponse.json({ error: 'Only an administrator can review Master Pillars.' }, { status: 403 });
  if (!transitions[pillar.status]?.includes(requestedStatus)) return NextResponse.json({ error: `Invalid pillar transition from ${pillar.status} to ${requestedStatus}.` }, { status: 409 });
  if (requestedStatus === 'RETURNED' && !comment) return NextResponse.json({ error: 'A return reason is required.' }, { status: 400 });
  const [updated] = await prisma.$transaction(async (tx) => [
    await tx.strategicPillar.update({ where: { id: params.id }, data: { status: requestedStatus as any } }),
    await createGovernanceReview(tx, { entityType: 'PILLAR', entityId: params.id, previousStatus: pillar.status, newStatus: requestedStatus, comment, reviewedById: auth.user.id, snapshot: pillar })
  ]);
  return NextResponse.json({ ok: true, pillar: updated, previousStatus: pillar.status });
}
