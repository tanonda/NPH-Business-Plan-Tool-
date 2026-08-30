import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole, requireApiUser } from '@/lib/api-auth-guard';
import { PositionAssignmentSchema } from '@/lib/schemas';

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  return NextResponse.json(await prisma.positionAssignment.findMany({ where: { isActive: true }, include: { staffMember: true, jobDescription: true, department: true, appraisals: true }, orderBy: { updatedAt: 'desc' } }));
}

export async function POST(request: NextRequest) {
  const auth = await requireApiRole(['ADMIN', 'PLANNER', 'APPROVER']);
  if (!auth.ok) return auth.response;
  const data = PositionAssignmentSchema.parse(await request.json());
  const jobDescription = await prisma.jobDescription.findUnique({ where: { id: data.jobDescriptionId } });
  if (!jobDescription || jobDescription.status !== 'APPROVED') return NextResponse.json({ error: 'Only an approved Job Description can be assigned.' }, { status: 400 });
  const assignment = await prisma.$transaction(async (tx) => {
    await tx.positionAssignment.updateMany({ where: { staffMemberId: data.staffMemberId, isActive: true }, data: { isActive: false, endsOn: data.startsOn } });
    return tx.positionAssignment.create({ data: { ...data, departmentId: data.departmentId || jobDescription.departmentId }, include: { staffMember: true, jobDescription: true, department: true } });
  });
  return NextResponse.json(assignment, { status: 201 });
}
