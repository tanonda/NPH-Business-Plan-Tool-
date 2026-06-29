import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole } from '@/lib/api-auth-guard';

type DepartmentAccessLevel = 'OWNER' | 'EDITOR' | 'REVIEWER' | 'VIEWER';

const ACCESS_LEVELS: DepartmentAccessLevel[] = ['OWNER', 'EDITOR', 'REVIEWER', 'VIEWER'];

function normalizeAccessLevel(value: unknown, role?: string): DepartmentAccessLevel {
  const explicit = String(value || '').toUpperCase();
  if (ACCESS_LEVELS.includes(explicit as DepartmentAccessLevel)) {
    return explicit as DepartmentAccessLevel;
  }

  switch (String(role || '').toUpperCase()) {
    case 'ADMIN':
    case 'PLANNER':
    case 'ACCOUNTING':
    case 'FINANCE':
    case 'BUDGET_OFFICER':
    case 'BUDGET_PLANNER':
      return 'EDITOR';
    case 'DONOR_MANAGER':
      return 'REVIEWER';
    case 'APPROVER':
    case 'REVIEWER':
      return 'REVIEWER';
    default:
      return 'VIEWER';
  }
}

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
      role: true,
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
    select: { id: true, email: true, role: true }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  const accessLevel = normalizeAccessLevel(body.accessLevel, user.role);

  await prisma.$transaction([
    prisma.userDepartmentAccess.deleteMany({
      where: { userId: params.id }
    }),
    ...(departmentIds.length > 0
      ? [
          prisma.userDepartmentAccess.createMany({
            data: departmentIds.map((departmentId: string) => ({
              userId: params.id,
              departmentId,
              accessLevel: accessLevel as any
            })),
            skipDuplicates: true
          })
        ]
      : [])
  ]);

  await prisma.auditLog.create({
    data: {
      action: 'DEPARTMENT_ACCESS_GRANTED' as any,
      details: `Updated department access for ${user.email}.`,
      userId: auth.user.id,
      metadata: {
        updatedUserId: user.id,
        updatedUserEmail: user.email,
        departmentIds,
        accessLevel
      }
    }
  }).catch(() => null);

  return NextResponse.json({
    ok: true,
    userId: params.id,
    departmentIds,
    accessLevel
  });
}
