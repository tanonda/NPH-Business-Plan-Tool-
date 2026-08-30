import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole, requireApiUser } from '@/lib/api-auth-guard';
import { StrategicPillarSchema } from '@/lib/schemas';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const pillar = await prisma.strategicPillar.findUnique({
    where: { id: params.id },
    include: { strategicPlan: true, ownerDepartment: true, parentPillar: true, childPillars: true, allocations: { include: { department: true, fundingSource: true, fundingSplits: { include: { activity: { include: { businessPlan: true } } } } }, orderBy: { fiscalYear: 'asc' } } }
  });
  if (!pillar) return NextResponse.json({ error: 'Strategic Pillar not found.' }, { status: 404 });
  return NextResponse.json(pillar);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(['ADMIN', 'PLANNER', 'APPROVER', 'REVIEWER']);
  if (!auth.ok) return auth.response;
  const data = StrategicPillarSchema.parse(await request.json());
  if (data.type === 'MASTER' && auth.user.role !== 'ADMIN') return NextResponse.json({ error: 'Only an administrator can manage a Master Pillar.' }, { status: 403 });
  const pillar = await prisma.strategicPillar.update({ where: { id: params.id }, data, include: { ownerDepartment: true, parentPillar: true } });
  return NextResponse.json(pillar);
}
