import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole, requireApiUser } from '@/lib/api-auth-guard';
import { StrategicPillarSchema } from '@/lib/schemas';
import { getUserDepartmentIds, userHasGlobalDepartmentAccess } from '@/lib/department-access';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(request.url);
  const requestedDepartmentId = searchParams.get('departmentId') || undefined;
  const accessibleDepartmentIds = userHasGlobalDepartmentAccess(auth.user) ? null : await getUserDepartmentIds(auth.user.id);
  const departmentIds = requestedDepartmentId ? [requestedDepartmentId] : accessibleDepartmentIds;
  const where = departmentIds ? { OR: [{ type: 'MASTER' as const }, { ownerDepartmentId: { in: departmentIds } }, { allocations: { some: { departmentId: { in: departmentIds } } } }] } : {};
  const pillars = await prisma.strategicPillar.findMany({
    where,
    include: { ownerDepartment: true, strategicPlan: true, parentPillar: true, allocations: { include: { fundingSplits: true } } },
    orderBy: [{ type: 'asc' }, { code: 'asc' }]
  });
  return NextResponse.json(pillars.map((pillar: any) => ({ ...pillar, allocations: pillar.allocations.map((allocation: any) => ({ ...allocation, usedAmount: allocation.fundingSplits.reduce((sum: number, split: any) => sum + Number(split.amount), 0) })) })));
}

export async function POST(request: NextRequest) {
  const auth = await requireApiRole(['ADMIN', 'PLANNER', 'APPROVER', 'REVIEWER']);
  if (!auth.ok) return auth.response;
  const data = StrategicPillarSchema.parse(await request.json());
  if (data.type === 'MASTER' && auth.user.role !== 'ADMIN') return NextResponse.json({ error: 'Only an administrator can create a Master Pillar.' }, { status: 403 });
  if (data.type === 'LOCAL') {
    if (!data.ownerDepartmentId) return NextResponse.json({ error: 'A Local Pillar must have an owning department.' }, { status: 400 });
    if (!userHasGlobalDepartmentAccess(auth.user)) {
      const departmentIds = await getUserDepartmentIds(auth.user.id);
      if (!departmentIds.includes(data.ownerDepartmentId)) return NextResponse.json({ error: 'You do not have access to create a pillar for this department.' }, { status: 403 });
    }
  }
  const pillar = await prisma.strategicPillar.create({ data, include: { ownerDepartment: true, parentPillar: true } });
  return NextResponse.json(pillar, { status: 201 });
}
