import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export type DepartmentAccessLevel = 'OWNER' | 'EDITOR' | 'REVIEWER' | 'VIEWER';

type AuthUser = {
  id: string;
  role?: string;
  canAccessAllDepartments?: boolean;
};

const EDIT_LEVELS: DepartmentAccessLevel[] = ['OWNER', 'EDITOR'];
const REVIEW_LEVELS: DepartmentAccessLevel[] = ['OWNER', 'EDITOR', 'REVIEWER'];
const ROLE_CAN_EDIT_WITH_ANY_ASSIGNED_DEPARTMENT = ['PLANNER', 'ACCOUNTING', 'FINANCE', 'BUDGET_OFFICER'];

export function userHasGlobalDepartmentAccess(user: AuthUser) {
  return user.role === 'ADMIN' || Boolean(user.canAccessAllDepartments);
}

export async function getUserDepartmentIds(userId: string, levels?: DepartmentAccessLevel[]) {
  const rows = await prisma.userDepartmentAccess.findMany({
    where: { userId, ...(levels?.length ? { accessLevel: { in: levels } } : {}) },
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

export async function getDepartmentScopedCostCenters(user: AuthUser, year?: number) {
  const departmentWhere = userHasGlobalDepartmentAccess(user)
    ? {}
    : { id: { in: await getUserDepartmentIds(user.id) } };

  const departments = await prisma.department.findMany({
    where: departmentWhere,
    select: { costCenter: true, costCenterName: true }
  }).catch(() => []);

  const planWhere = {
    ...(year ? { year } : {}),
    ...(await getDepartmentScopedPlanWhere(user))
  };

  const plans = await prisma.businessPlan.findMany({
    where: planWhere,
    select: { costCenter: true },
    distinct: ['costCenter']
  }).catch(() => []);

  return Array.from(new Set([
    ...departments.map((department: any) => department.costCenter),
    ...plans.map((plan: any) => plan.costCenter)
  ].filter(Boolean)));
}

export async function userCanAccessDepartment(user: AuthUser, departmentId: string | null | undefined, levels?: DepartmentAccessLevel[]) {
  if (userHasGlobalDepartmentAccess(user)) return true;
  if (!departmentId) return false;

  const access = await prisma.userDepartmentAccess.findFirst({
    where: {
      userId: user.id,
      departmentId,
      ...(levels?.length ? { accessLevel: { in: levels } } : {})
    },
    select: { id: true }
  });

  return Boolean(access);
}


export function roleCanEditAssignedDepartments(user: AuthUser) {
  return ROLE_CAN_EDIT_WITH_ANY_ASSIGNED_DEPARTMENT.includes(String(user.role || '').toUpperCase());
}

export async function resolveEditableDepartmentForPlan(user: AuthUser, departmentId: string | null | undefined, costCenter?: string | null) {
  if (userHasGlobalDepartmentAccess(user)) {
    if (departmentId) return departmentId;

    if (costCenter) {
      const department = await prisma.department.findFirst({
        where: { isActive: true, costCenter },
        select: { id: true }
      }).catch(() => null);
      return department?.id || null;
    }

    return null;
  }

  const editableDepartmentIds = await getUserDepartmentIds(user.id, EDIT_LEVELS);
  const assignedDepartmentIds = await getUserDepartmentIds(user.id);
  const candidateDepartmentIds = editableDepartmentIds.length > 0
    ? editableDepartmentIds
    : (roleCanEditAssignedDepartments(user) ? assignedDepartmentIds : []);

  if (candidateDepartmentIds.length === 0) return null;

  if (departmentId && candidateDepartmentIds.includes(departmentId)) {
    return departmentId;
  }

  if (costCenter) {
    const department = await prisma.department.findFirst({
      where: {
        id: { in: candidateDepartmentIds },
        isActive: true,
        OR: [
          { costCenter },
          { costCenters: { some: { code: costCenter, isActive: true } } }
        ]
      },
      select: { id: true }
    }).catch(() => null);

    if (department?.id) return department.id;
  }

  // If the user only has one eligible department, default imported plans to that department.
  // This keeps Excel imports saveable even when the workbook has a cost center but no app department id.
  if (!departmentId && candidateDepartmentIds.length === 1) {
    return candidateDepartmentIds[0];
  }

  return null;
}

export async function requireResolvedDepartmentEditAccess(user: AuthUser, departmentId: string | null | undefined, costCenter?: string | null) {
  const resolvedDepartmentId = await resolveEditableDepartmentForPlan(user, departmentId, costCenter);

  if (userHasGlobalDepartmentAccess(user)) {
    return { ok: true as const, departmentId: resolvedDepartmentId };
  }

  if (!resolvedDepartmentId) {
    return {
      ok: false as const,
      response: NextResponse.json({
        error: 'Select one of your assigned departments before saving. If this workbook imported without a department, choose it from the Department dropdown and save again.'
      }, { status: 403 })
    };
  }

  const allowed = await userCanAccessDepartment(user, resolvedDepartmentId, EDIT_LEVELS);
  const assignedFallbackAllowed = roleCanEditAssignedDepartments(user)
    ? await userCanAccessDepartment(user, resolvedDepartmentId)
    : false;
  if (!allowed && !assignedFallbackAllowed) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'You need OWNER or EDITOR access for this department to create or edit plans.' }, { status: 403 })
    };
  }

  return { ok: true as const, departmentId: resolvedDepartmentId };
}

async function requirePlanDepartmentAccessByLevel(user: AuthUser, planId: string, levels?: DepartmentAccessLevel[], message = 'You do not have access to this department plan.') {
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

  const allowed = await userCanAccessDepartment(user, plan.departmentId, levels);

  // Backward-compatible edit fallback:
  // Older department assignment saves sometimes created rows with VIEWER access even for PLANNER
  // or finance/budget roles. Those users should not be blocked from editing their assigned
  // department's DRAFT/RETURNED plans purely because the legacy accessLevel is too weak.
  // The plan content lock still runs separately, so REVIEW/APPROVED/SUBMITTED remain protected.
  const editLevelCheck = Array.isArray(levels)
    && levels.length === EDIT_LEVELS.length
    && EDIT_LEVELS.every((level) => levels.includes(level));
  const assignedEditFallbackAllowed = !allowed && editLevelCheck && roleCanEditAssignedDepartments(user)
    ? await userCanAccessDepartment(user, plan.departmentId)
    : false;

  if (!allowed && !assignedEditFallbackAllowed) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: message }, { status: 403 })
    };
  }

  return { ok: true as const };
}

export async function requirePlanDepartmentAccess(user: AuthUser, planId: string) {
  return requirePlanDepartmentAccessByLevel(user, planId);
}

export async function requirePlanDepartmentEditAccess(user: AuthUser, planId: string) {
  return requirePlanDepartmentAccessByLevel(user, planId, EDIT_LEVELS, 'You need OWNER or EDITOR access for this department to edit this plan.');
}

export async function requirePlanDepartmentReviewAccess(user: AuthUser, planId: string) {
  return requirePlanDepartmentAccessByLevel(user, planId, REVIEW_LEVELS, 'You need OWNER, EDITOR, or REVIEWER department access to review this plan.');
}

export async function requireDepartmentEditAccess(user: AuthUser, departmentId: string | null | undefined) {
  if (userHasGlobalDepartmentAccess(user)) return { ok: true as const };
  if (!departmentId) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'A department is required for non-admin plan creation.' }, { status: 400 })
    };
  }

  const allowed = await userCanAccessDepartment(user, departmentId, EDIT_LEVELS);
  const assignedFallbackAllowed = !allowed && roleCanEditAssignedDepartments(user)
    ? await userCanAccessDepartment(user, departmentId)
    : false;

  if (!allowed && !assignedFallbackAllowed) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'You need OWNER or EDITOR access for this department to create or edit plans.' }, { status: 403 })
    };
  }
  return { ok: true as const };
}

export async function filterRowsByScopedCostCenter<T extends { costCenterCode?: string | null; costCenter?: string | null }>(user: AuthUser, rows: T[], year?: number) {
  if (userHasGlobalDepartmentAccess(user)) return rows;
  const allowed = new Set(await getDepartmentScopedCostCenters(user, year));
  return rows.filter((row) => allowed.has(String(row.costCenterCode || row.costCenter || '')));
}
