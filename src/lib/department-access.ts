import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type AuthUser = {
  id: string;
  role?: string;
  canAccessAllDepartments?: boolean;
};

export function userHasGlobalDepartmentAccess(user: AuthUser) {
  return user.role === 'ADMIN' || Boolean(user.canAccessAllDepartments);
}

export async function getUserDepartmentIds(userId: string) {
  const rows = await prisma.userDepartmentAccess.findMany({
    where: { userId },
    select: { departmentId: true }
  });

  return rows.map((row: any) => row.departmentId);
}

export async function getDepartmentScopedPlanWhere(user: AuthUser) {
  if (userHasGlobalDepartmentAccess(user)) {
    return {};
  }

  const departmentIds = await getUserDepartmentIds(user.id);

  if (departmentIds.length === 0) {
    return {
      id: '__NO_ACCESSIBLE_PLANS__'
    };
  }

  return {
    departmentId: {
      in: departmentIds
    }
  };
}

export async function requirePlanDepartmentAccess(user: AuthUser, planId: string) {
  if (userHasGlobalDepartmentAccess(user)) {
    return { ok: true as const };
  }

  const plan = await prisma.businessPlan.findUnique({
    where: { id: planId },
    select: {
      id: true,
      departmentId: true
    }
  });

  if (!plan) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Plan not found.' }, { status: 404 })
    };
  }

  if (!plan.departmentId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'This plan is not linked to a department.' },
        { status: 403 }
      )
    };
  }

  const access = await prisma.userDepartmentAccess.findFirst({
    where: {
      userId: user.id,
      departmentId: plan.departmentId
    },
    select: { id: true }
  });

  if (!access) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'You do not have access to this department plan.' },
        { status: 403 }
      )
    };
  }

  return { ok: true as const };
}
