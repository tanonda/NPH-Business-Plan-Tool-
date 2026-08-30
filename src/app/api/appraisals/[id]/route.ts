import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole, requireApiUser } from '@/lib/api-auth-guard';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const record = await prisma.performanceAppraisal.findUnique({ where: { id: params.id }, include: { reviewer: { select: { name: true } }, positionAssignment: { include: { staffMember: true, jobDescription: true, department: true } }, objectives: { orderBy: { sortOrder: 'asc' } } } });
  if (!record) return NextResponse.json({ error: 'Appraisal not found.' }, { status: 404 });
  return NextResponse.json(record);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(['ADMIN', 'APPROVER', 'REVIEWER']);
  if (!auth.ok) return auth.response;
  const body = await request.json();
  const objectives = Array.isArray(body.objectives) ? body.objectives : [];
  const record = await prisma.$transaction(async (tx) => {
    await tx.appraisalObjective.deleteMany({ where: { appraisalId: params.id } });
    return tx.performanceAppraisal.update({ where: { id: params.id }, data: { status: body.status || 'MANAGER_REVIEW', developmentPlan: String(body.developmentPlan || ''), overallComment: String(body.overallComment || ''), objectives: { create: objectives.map((objective: any, index: number) => ({ kra: String(objective.kra || ''), kta: String(objective.kta || ''), kpi: String(objective.kpi || ''), targetDate: String(objective.targetDate || ''), evidence: String(objective.evidence || ''), rating: objective.rating ? Number(objective.rating) : null, reviewerComment: String(objective.reviewerComment || ''), sortOrder: index + 1 })) } }, include: { objectives: { orderBy: { sortOrder: 'asc' } } } });
  });
  return NextResponse.json(record);
}
