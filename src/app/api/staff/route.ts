import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole, requireApiUser } from '@/lib/api-auth-guard';
import { StaffMemberSchema } from '@/lib/schemas';
import { getUserDepartmentIds, userHasGlobalDepartmentAccess, userCanAccessDepartment } from '@/lib/department-access';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const departmentId = new URL(request.url).searchParams.get('departmentId') || undefined;
  const departmentIds = userHasGlobalDepartmentAccess(auth.user) ? null : await getUserDepartmentIds(auth.user.id);
  if (departmentId && departmentIds && !departmentIds.includes(departmentId)) return NextResponse.json({ error: 'You do not have access to this department.' }, { status: 403 });
  return NextResponse.json(await prisma.staffMember.findMany({ where: { isActive: true, ...(departmentId ? { departmentId } : departmentIds ? { departmentId: { in: departmentIds } } : {}) }, include: { department: true, assignments: { where: { isActive: true }, include: { jobDescription: true } } }, orderBy: { fullName: 'asc' } }));
}

export async function POST(request: NextRequest) {
  const auth = await requireApiRole(['ADMIN', 'PLANNER', 'APPROVER']);
  if (!auth.ok) return auth.response;
  const data = StaffMemberSchema.parse(await request.json());
  if (!(await userCanAccessDepartment(auth.user, data.departmentId, ['OWNER', 'EDITOR']))) return NextResponse.json({ error: 'You do not have edit access to this department.' }, { status: 403 });
  return NextResponse.json(await prisma.staffMember.create({ data, include: { department: true } }), { status: 201 });
}
