import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole } from '@/lib/api-auth-guard';
import { getAllowedNextStatuses, normalizeWorkflowRole, normalizeWorkflowStatus } from '@/lib/approval-workflow';
import { canEditPlanContent, getPlanLockMessage } from '@/lib/plan-locking';

function hasGlobalDepartmentAccess(user: any) {
  return user.role === 'ADMIN' || Boolean(user.canAccessAllDepartments);
}

async function userCanAccessPlanDepartment(user: any, plan: any) {
  if (hasGlobalDepartmentAccess(user)) {
    return true;
  }

  if (!plan.departmentId) {
    return false;
  }

  const access = await prisma.userDepartmentAccess.findFirst({
    where: {
      userId: user.id,
      departmentId: plan.departmentId
    },
    select: { id: true }
  });

  return Boolean(access);
}

export async function GET(request: NextRequest) {
  const auth = await requireApiRole(['ADMIN']);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const planId = searchParams.get('planId');

  if (!userId || !planId) {
    return NextResponse.json(
      { error: 'userId and planId are required.' },
      { status: 400 }
    );
  }

  const [targetUser, plan] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        departmentAccess: {
          include: {
            department: true
          }
        }
      }
    }),
    prisma.businessPlan.findUnique({
      where: { id: planId },
      include: {
        department: true
      }
    })
  ]);

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  if (!plan) {
    return NextResponse.json({ error: 'Plan not found.' }, { status: 404 });
  }

  const role = normalizeWorkflowRole(targetUser.role);
  const status = normalizeWorkflowStatus(plan.status);
  const departmentAllowed = await userCanAccessPlanDepartment(targetUser, plan);
  const allowedStatusTransitions = getAllowedNextStatuses(status, role);
  const canEditContent = departmentAllowed && canEditPlanContent(status, role);

  const result = {
    user: {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
      isActive: targetUser.isActive,
      canAccessAllDepartments: targetUser.canAccessAllDepartments,
      assignedDepartments: targetUser.departmentAccess.map((item: any) => ({
        id: item.department.id,
        code: item.department.code,
        name: item.department.name
      }))
    },
    plan: {
      id: plan.id,
      title: plan.title,
      status: plan.status,
      departmentId: plan.departmentId,
      department: plan.department
        ? {
            id: plan.department.id,
            code: plan.department.code,
            name: plan.department.name
          }
        : null
    },
    permissions: {
      canLogin: Boolean(targetUser.isActive),
      canViewPlan: Boolean(targetUser.isActive && departmentAllowed),
      canEditPlanContent: Boolean(targetUser.isActive && canEditContent),
      canSubmitForReview: Boolean(
        targetUser.isActive &&
        departmentAllowed &&
        allowedStatusTransitions.includes('REVIEW')
      ),
      canApprove: Boolean(
        targetUser.isActive &&
        departmentAllowed &&
        allowedStatusTransitions.includes('APPROVED')
      ),
      canSubmitFinal: Boolean(
        targetUser.isActive &&
        departmentAllowed &&
        allowedStatusTransitions.includes('SUBMITTED')
      ),
      canComment: Boolean(
        targetUser.isActive &&
        departmentAllowed &&
        ['ADMIN', 'PLANNER', 'APPROVER', 'REVIEWER'].includes(role)
      ),
      canExport: Boolean(targetUser.isActive && departmentAllowed),
      canManageUsers: role === 'ADMIN',
      departmentAccessAllowed: Boolean(departmentAllowed)
    },
    workflow: {
      currentStatus: status,
      allowedNextStatuses: allowedStatusTransitions,
      lockMessage: getPlanLockMessage(status, role)
    },
    explanation: {
      roleRule:
        role === 'ADMIN'
          ? 'ADMIN can override most workflow and access rules.'
          : role === 'PLANNER'
            ? 'PLANNER can edit DRAFT plans and submit DRAFT plans for REVIEW.'
            : role === 'APPROVER'
              ? 'APPROVER can approve REVIEW plans and submit APPROVED plans as final.'
              : role === 'REVIEWER'
                ? 'REVIEWER can view, comment, and export only.'
                : 'VIEWER can view and export only.',
      departmentRule: departmentAllowed
        ? 'User has department access for this plan.'
        : 'User does not have department access for this plan.',
      statusRule: allowedStatusTransitions.length
        ? `Allowed next status: ${allowedStatusTransitions.join(', ')}`
        : 'No status transition is allowed for this role/status combination.'
    }
  };

  return NextResponse.json(result);
}
