import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole, requireApiUser } from '@/lib/api-auth-guard';
import { PillarBudgetAllocationSchema } from '@/lib/schemas';
import { getUserDepartmentIds, userHasGlobalDepartmentAccess } from '@/lib/department-access';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(request.url);
  const fiscalYear = Number(searchParams.get('year') || 0) || undefined;
  const requestedDepartmentId = searchParams.get('departmentId') || undefined;
  const accessibleDepartmentIds = userHasGlobalDepartmentAccess(auth.user) ? null : await getUserDepartmentIds(auth.user.id);
  const departmentId = requestedDepartmentId || undefined;
  const rows = await prisma.pillarBudgetAllocation.findMany({
    where: { ...(fiscalYear ? { fiscalYear } : {}), ...(departmentId ? { departmentId } : accessibleDepartmentIds ? { departmentId: { in: accessibleDepartmentIds } } : {}) },
    include: { pillar: true, department: true, fundingSource: true, fundingSplits: true }, orderBy: [{ fiscalYear: 'desc' }, { updatedAt: 'desc' }]
  });
  return NextResponse.json(rows.map((row: any) => {
    const usedAmount = row.fundingSplits.reduce((sum: number, split: any) => sum + Number(split.amount), 0);
    const limit = Number(row.status === 'APPROVED' ? row.approvedAmount : row.requestedAmount || row.indicativeAmount);
    return { ...row, usedAmount, availableAmount: limit - usedAmount };
  }));
}

export async function POST(request: NextRequest) {
  const auth = await requireApiRole(['ADMIN', 'PLANNER', 'FINANCE', 'BUDGET_OFFICER']);
  if (!auth.ok) return auth.response;
  const data = PillarBudgetAllocationSchema.parse(await request.json());
  if (data.status === 'APPROVED' && !['ADMIN', 'FINANCE', 'BUDGET_OFFICER'].includes(auth.user.role)) return NextResponse.json({ error: 'Only Finance, Budget Officer, or Admin can approve a Pillar Budget Allocation.' }, { status: 403 });
  const allocation = await prisma.pillarBudgetAllocation.create({ data, include: { pillar: true, department: true, fundingSource: true } });
  return NextResponse.json(allocation, { status: 201 });
}
