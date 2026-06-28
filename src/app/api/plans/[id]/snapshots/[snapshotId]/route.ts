import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiUser } from '@/lib/api-auth-guard';
import { requirePlanDepartmentAccess } from '@/lib/department-access';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; snapshotId: string } }
) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const departmentAccess = await requirePlanDepartmentAccess(auth.user, params.id);
  if (!departmentAccess.ok) return departmentAccess.response;

  const snapshot = await prisma.approvalSnapshot.findFirst({
    where: {
      id: params.snapshotId,
      businessPlanId: params.id
    }
  });

  if (!snapshot) {
    return NextResponse.json({ error: 'Snapshot not found.' }, { status: 404 });
  }

  const url = new URL(request.url);
  const download = url.searchParams.get('download') === '1';

  if (download) {
    return new NextResponse(JSON.stringify(snapshot.snapshotData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${snapshot.snapshotType}-${snapshot.businessPlanId}.json"`
      }
    });
  }

  return NextResponse.json(snapshot);
}
