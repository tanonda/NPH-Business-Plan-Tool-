import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiUser } from '@/lib/api-auth-guard';
import { requirePlanDepartmentAccess } from '@/lib/department-access';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const departmentAccess = await requirePlanDepartmentAccess(auth.user, params.id);
  if (!departmentAccess.ok) return departmentAccess.response;

  const snapshots = await prisma.approvalSnapshot.findMany({
    where: {
      businessPlanId: params.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return NextResponse.json(
    snapshots.map((snapshot: any) => ({
      id: snapshot.id,
      businessPlanId: snapshot.businessPlanId,
      snapshotType: snapshot.snapshotType,
      status: snapshot.status,
      title: snapshot.title,
      facility: snapshot.facility,
      departmentId: snapshot.departmentId,
      departmentName: snapshot.departmentName,
      totalEstimatedCost: snapshot.totalEstimatedCost,
      recurrentCost: snapshot.recurrentCost,
      unfundedCost: snapshot.unfundedCost,
      activityCount: snapshot.activityCount,
      createdById: snapshot.createdById,
      createdByName: snapshot.createdByName,
      createdByEmail: snapshot.createdByEmail,
      createdAt: snapshot.createdAt
    }))
  );
}
