import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole, requireApiUser } from '@/lib/api-auth-guard';
import { PerformanceAppraisalSchema } from '@/lib/schemas';

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  return NextResponse.json(await prisma.performanceAppraisal.findMany({ include: { reviewer: { select: { name: true } }, positionAssignment: { include: { staffMember: true, jobDescription: true, department: true } }, _count: { select: { objectives: true } } }, orderBy: { updatedAt: 'desc' } }));
}

export async function POST(request: NextRequest) {
  const auth = await requireApiRole(['ADMIN', 'PLANNER', 'APPROVER', 'REVIEWER']);
  if (!auth.ok) return auth.response;
  const data = PerformanceAppraisalSchema.parse(await request.json());
  const assignment = await prisma.positionAssignment.findUnique({ where: { id: data.positionAssignmentId }, include: { jobDescription: { include: { objectives: { orderBy: { sortOrder: 'asc' } } } } } });
  if (!assignment) return NextResponse.json({ error: 'Position assignment not found.' }, { status: 404 });
  const appraisal = await prisma.performanceAppraisal.create({ data: { ...data, reviewerId: auth.user.id, status: 'IN_PROGRESS', objectives: { create: assignment.jobDescription.objectives.map((objective, index) => ({ kra: objective.kra, kta: objective.kta, kpi: objective.kpi, targetDate: objective.targetDate, sortOrder: index + 1 })) } }, include: { positionAssignment: { include: { staffMember: true, jobDescription: true } }, objectives: { orderBy: { sortOrder: 'asc' } } } });
  return NextResponse.json(appraisal, { status: 201 });
}
