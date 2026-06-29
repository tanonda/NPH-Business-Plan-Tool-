import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { validatePasswordPolicy, passwordPolicyMessage } from '@/lib/password-policy';
import { requireApiRole } from '@/lib/api-auth-guard';

const ALLOWED_ROLES = ['ADMIN', 'PLANNER', 'APPROVER', 'REVIEWER', 'ACCOUNTING', 'FINANCE', 'BUDGET_OFFICER', 'DONOR_MANAGER', 'VIEWER'] as const;
type AllowedRole = typeof ALLOWED_ROLES[number];

function normalizeRole(role: unknown): AllowedRole {
  const value = String(role || 'VIEWER').toUpperCase();
  return ALLOWED_ROLES.includes(value as AllowedRole) ? (value as AllowedRole) : 'VIEWER';
}

function safeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    canAccessAllDepartments: user.canAccessAllDepartments,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
    departmentIds: Array.isArray(user.departmentAccess)
      ? user.departmentAccess.map((item: any) => item.departmentId)
      : []
  };
}

export async function GET() {
  const auth = await requireApiRole(['ADMIN']);
  if (!auth.ok) return auth.response;

  const users = await prisma.user.findMany({
    include: {
      departmentAccess: {
        select: {
          departmentId: true
        }
      }
    },
    orderBy: [
      { role: 'asc' },
      { name: 'asc' }
    ]
  });

  return NextResponse.json(users.map(safeUser));
}

export async function POST(request: NextRequest) {
  const auth = await requireApiRole(['ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();

    const email = String(body.email || '').trim().toLowerCase();
    const name = String(body.name || '').trim();
    const password = String(body.password || '').trim();
    const role = normalizeRole(body.role);
    const canAccessAllDepartments = Boolean(body.canAccessAllDepartments ?? false);

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'Temporary password is required.' }, { status: 400 });
    }

    const passwordPolicy = validatePasswordPolicy(password);
    if (!passwordPolicy.ok) {
      return NextResponse.json({ error: `${passwordPolicyMessage()} ${passwordPolicy.issues.join(' ')}` }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        isActive: true,
        passwordHash,
        canAccessAllDepartments
      },
      include: {
        departmentAccess: {
          select: {
            departmentId: true
          }
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'USER_CREATED',
        details: `Created user ${email} with role ${role}.`,
        userId: auth.user.id,
        metadata: {
          createdUserId: user.id,
          createdUserEmail: email,
          role,
          canAccessAllDepartments
        }
      }
    }).catch(() => null);

    return NextResponse.json(safeUser(user), { status: 201 });
  } catch (error) {
    console.error('Create user failed', error);
    return NextResponse.json({ error: 'Could not create user.' }, { status: 500 });
  }
}
