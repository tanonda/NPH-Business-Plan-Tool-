import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole } from '@/lib/api-auth-guard';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireApiRole(['ADMIN']);
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      email: true,
      name: true,
      canAccessAllDepartments: true
    }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  const access = await prisma.userDepartmentAccess.findMany({
    where: { userId: params.id },
    include: { department: true }
  });

  return NextResponse.json({
    user,
    departmentIds: access.map((item: any) => item.departmentId),
    access
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireApiRole(['ADMIN']);
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const departmentIds: string[] = Array.isArray(body.departmentIds)
    ? Array.from(new Set(body.departmentIds.map((id: unknown) => String(id)).filter(Boolean)))
    : [];

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, email: true }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.userDepartmentAccess.deleteMany({
      where: { userId: params.id }
    }),
    ...(departmentIds.length > 0
      ? [
          prisma.userDepartmentAccess.createMany({
            data: departmentIds.map((departmentId: string) => ({
              userId: params.id,
              departmentId
            })),
            skipDuplicates: true
          })
        ]
      : [])
  ]);

  await prisma.auditLog.create({
    data: {
      action: 'USER_DEPARTMENT_ACCESS_UPDATED',
      details: `Updated department access for ${user.email}.`,
      userId: auth.user.id,
      metadata: {
        updatedUserId: user.id,
        updatedUserEmail: user.email,
        departmentIds
      }
    }
  }).catch(() => null);

  return NextResponse.json({
    ok: true,
    userId: params.id,
    departmentIds
  });
}
