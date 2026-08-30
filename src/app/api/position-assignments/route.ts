import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole, requireApiUser } from '@/lib/api-auth-guard';
import { PositionAssignmentSchema } from '@/lib/schemas';
import { getUserDepartmentIds, userCanAccessDepartment, userHasGlobalDepartmentAccess } from '@/lib/department-access';

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const departmentIds = userHasGlobalDepartmentAccess(auth.user) ? null : await getUserDepartmentIds(auth.user.id);
  return NextResponse.json(await prisma.positionAssignment.findMany({ where: { isActive: true, ...(departmentIds ? { departmentId: { in: departmentIds } } : {}) }, include: { staffMember: true, jobDescription: true, department: true, appraisals: true }, orderBy: { updatedAt: 'desc' } }));
}

export async function POST(request: NextRequest) {
  const auth = await requireApiRole(['ADMIN', 'PLANNER', 'APPROVER']);
  if (!auth.ok) return auth.response;
  const data = PositionAssignmentSchema.parse(await request.json());
  const staffMember = await prisma.staffMember.findUnique({ where: { id: data.staffMemberId }, select: { departmentId: true } });
  if (!staffMember) return NextResponse.json({ error: 'Staff member not found.' }, { status: 404 });
  if (!(await userCanAccessDepartment(auth.user, data.departmentId || staffMember.departmentId, ['OWNER', 'EDITOR']))) return NextResponse.json({ error: 'You do not have edit access to this department.' }, { status: 403 });
  const jobDescription = await prisma.jobDescription.findUnique({ where: { id: data.jobDescriptionId } });
  if (!jobDescription || jobDescription.status !== 'APPROVED') return NextResponse.json({ error: 'Only an approved Job Description can be assigned.' }, { status: 400 });
  const assignment = await prisma.$transaction(async (tx) => {
    await tx.positionAssignment.updateMany({ where: { staffMemberId: data.staffMemberId, isActive: true }, data: { isActive: false, endsOn: data.startsOn } });
    return tx.positionAssignment.create({ data: { ...data, departmentId: data.departmentId || jobDescription.departmentId }, include: { staffMember: true, jobDescription: true, department: true } });
  });
  return NextResponse.json(assignment, { status: 201 });
}
