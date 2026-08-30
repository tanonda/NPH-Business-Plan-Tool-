import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole, requireApiUser } from '@/lib/api-auth-guard';
import { userCanAccessDepartment } from '@/lib/department-access';
import { z } from 'zod';

const AppraisalUpdateSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'SELF_REVIEW', 'MANAGER_REVIEW', 'COMPLETED', 'CANCELLED']).optional(),
  developmentPlan: z.string().trim().default(''),
  overallComment: z.string().trim().default(''),
  objectives: z.array(z.object({
    kra: z.string().trim().min(1),
    kta: z.string().trim().min(1),
    kpi: z.string().trim().min(1),
    targetDate: z.string().trim().default(''),
    evidence: z.string().trim().default(''),
    rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
    reviewerComment: z.string().trim().default('')
  })).default([])
});

const allowedTransitions: Record<string, string[]> = {
  IN_PROGRESS: ['SELF_REVIEW', 'CANCELLED'],
  SELF_REVIEW: ['MANAGER_REVIEW', 'CANCELLED'],
  MANAGER_REVIEW: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
};

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const record = await prisma.performanceAppraisal.findUnique({ where: { id: params.id }, include: { reviewer: { select: { name: true } }, positionAssignment: { include: { staffMember: true, jobDescription: true, department: true } }, objectives: { orderBy: { sortOrder: 'asc' } } } });
  if (!record) return NextResponse.json({ error: 'Appraisal not found.' }, { status: 404 });
  if (!(await userCanAccessDepartment(auth.user, record.positionAssignment.departmentId || record.positionAssignment.staffMember.departmentId, ['REVIEWER']))) return NextResponse.json({ error: 'You do not have review access to this department appraisal.' }, { status: 403 });
  return NextResponse.json(record);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(['ADMIN', 'APPROVER', 'REVIEWER']);
  if (!auth.ok) return auth.response;
  const body = AppraisalUpdateSchema.parse(await request.json());
  const existing = await prisma.performanceAppraisal.findUnique({ where: { id: params.id }, select: { status: true, positionAssignment: { select: { departmentId: true, staffMember: { select: { departmentId: true, userId: true } } } } } });
  if (!existing) return NextResponse.json({ error: 'Appraisal not found.' }, { status: 404 });
  const nextStatus = body.status || existing.status;
  if (nextStatus !== existing.status && !allowedTransitions[existing.status]?.includes(nextStatus)) {
    return NextResponse.json({ error: `Invalid appraisal transition from ${existing.status} to ${nextStatus}.` }, { status: 409 });
  }
  if (nextStatus === 'CANCELLED' && auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only an administrator can cancel an appraisal.' }, { status: 403 });
  }
  const assignment = existing.positionAssignment;
  if (!assignment || !(await userCanAccessDepartment(auth.user, assignment.departmentId || assignment.staffMember.departmentId, ['REVIEWER'])) && assignment.staffMember.userId !== auth.user.id) return NextResponse.json({ error: 'You do not have review access to this department appraisal.' }, { status: 403 });
  const objectives = body.objectives;
  const record = await prisma.$transaction(async (tx) => {
    await tx.appraisalObjective.deleteMany({ where: { appraisalId: params.id } });
    return tx.performanceAppraisal.update({ where: { id: params.id }, data: { status: nextStatus, developmentPlan: body.developmentPlan, overallComment: body.overallComment, objectives: { create: objectives.map((objective, index) => ({ ...objective, sortOrder: index + 1 })) } }, include: { objectives: { orderBy: { sortOrder: 'asc' } } } });
  });
  return NextResponse.json(record);
}
