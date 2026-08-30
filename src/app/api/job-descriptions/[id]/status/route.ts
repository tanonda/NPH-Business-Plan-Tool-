import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole } from '@/lib/api-auth-guard';
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
  const requestedStatus = String(body.status || '').toUpperCase();
  const comment = String(body.comment || '').trim();
  const job = await prisma.jobDescription.findUnique({ where: { id: params.id }, select: { status: true, code: true, title: true, version: true, departmentId: true, purpose: true } });
  if (!job) return NextResponse.json({ error: 'Job Description not found.' }, { status: 404 });
  if (!transitions[job.status]?.includes(requestedStatus)) return NextResponse.json({ error: `Invalid JD transition from ${job.status} to ${requestedStatus}.` }, { status: 409 });
  if (requestedStatus === 'RETURNED' && !comment) return NextResponse.json({ error: 'A return reason is required.' }, { status: 400 });
  if (requestedStatus === 'APPROVED' && !['ADMIN', 'APPROVER', 'REVIEWER'].includes(auth.user.role)) return NextResponse.json({ error: 'Only a reviewer or approver can approve a Job Description.' }, { status: 403 });
  const [updated] = await prisma.$transaction(async (tx) => [
    await tx.jobDescription.update({ where: { id: params.id }, data: { status: requestedStatus as any, effectiveFrom: requestedStatus === 'APPROVED' ? new Date() : undefined } }),
    await createGovernanceReview(tx, { entityType: 'JOB_DESCRIPTION', entityId: params.id, previousStatus: job.status, newStatus: requestedStatus, comment, reviewedById: auth.user.id, snapshot: job })
  ]);
  return NextResponse.json({ ok: true, jobDescription: updated, previousStatus: job.status });
}
