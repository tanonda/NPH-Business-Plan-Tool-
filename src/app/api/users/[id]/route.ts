import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { validatePasswordPolicy, passwordPolicyMessage } from '@/lib/password-policy';
import { requireApiRole } from '@/lib/api-auth-guard';

const ALLOWED_ROLES = ['ADMIN', 'PLANNER', 'APPROVER', 'REVIEWER', 'ACCOUNTING', 'FINANCE', 'BUDGET_OFFICER', 'DONOR_MANAGER', 'VIEWER'] as const;
type AllowedRole = typeof ALLOWED_ROLES[number];

function normalizeRole(role: unknown): AllowedRole | null {
  if (role === undefined || role === null || role === '') return null;
  const value = String(role).toUpperCase();
  return ALLOWED_ROLES.includes(value as AllowedRole) ? (value as AllowedRole) : null;
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
    lastLoginAt: user.lastLoginAt
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireApiRole(['ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const userId = params.id;

    const existing = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const data: any = {};

    if (typeof body.name === 'string') {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 });
      }
      data.name = name;
    }

    const role = normalizeRole(body.role);
    if (role) {
      data.role = role;
    }

    if (typeof body.isActive === 'boolean') {
      if (existing.id === auth.user.id && body.isActive === false) {
        return NextResponse.json({ error: 'You cannot deactivate your own account.' }, { status: 400 });
      }
      data.isActive = body.isActive;
    }

    if (typeof body.canAccessAllDepartments === 'boolean') {
      // ADMIN decides whether a user has global department access.
      // Default remains false on creation, but Finance/Accounting/Budget users can be explicitly granted all departments.
      data.canAccessAllDepartments = body.canAccessAllDepartments;
    }

    if (typeof body.password === 'string' && body.password.trim()) {
      const password = body.password.trim();

      const passwordPolicy = validatePasswordPolicy(password);
      if (!passwordPolicy.ok) {
        return NextResponse.json({ error: `${passwordPolicyMessage()} ${passwordPolicy.issues.join(' ')}` }, { status: 400 });
      }

      data.passwordHash = await hashPassword(password);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No changes provided.' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data
    });

    await prisma.auditLog.create({
      data: {
        action: 'USER_UPDATED',
        details: `Updated user ${existing.email}.`,
        userId: auth.user.id,
        metadata: {
          updatedUserId: existing.id,
          updatedUserEmail: existing.email,
          changedFields: Object.keys(data)
        }
      }
    }).catch(() => null);

    return NextResponse.json(safeUser(updated));
  } catch (error) {
    console.error('Update user failed', error);
    return NextResponse.json({ error: 'Could not update user.' }, { status: 500 });
  }
}
