import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole, requireApiUser } from '@/lib/api-auth-guard';
import { JobDescriptionSchema } from '@/lib/schemas';
import { getUserDepartmentIds, userHasGlobalDepartmentAccess } from '@/lib/department-access';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const departmentId = new URL(request.url).searchParams.get('departmentId') || undefined;
  const departmentIds = userHasGlobalDepartmentAccess(auth.user) ? null : await getUserDepartmentIds(auth.user.id);
  const where = departmentId ? { departmentId } : departmentIds ? { OR: [{ departmentId: { in: departmentIds } }, { departmentId: null }] } : {};
  const rows = await prisma.jobDescription.findMany({ where, include: { department: true, _count: { select: { objectives: true, assignments: true } } }, orderBy: [{ title: 'asc' }, { version: 'desc' }] });
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiRole(['ADMIN', 'PLANNER', 'APPROVER', 'REVIEWER']);
  if (!auth.ok) return auth.response;
  const { objectives, ...data } = JobDescriptionSchema.parse(await request.json());
  const jobDescription = await prisma.jobDescription.create({ data: { ...data, objectives: { create: objectives.map((objective, index) => ({ ...objective, sortOrder: index + 1 })) } }, include: { department: true, objectives: { orderBy: { sortOrder: 'asc' } } } });
  return NextResponse.json(jobDescription, { status: 201 });
}
