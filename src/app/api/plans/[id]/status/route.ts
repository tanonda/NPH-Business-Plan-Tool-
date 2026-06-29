import { NextRequest, NextResponse } from 'next/server';
import { PlanStatus as PrismaPlanStatus } from '@prisma/client';
import { createApprovalSnapshot } from '@/lib/approval-snapshots';
import { notifyPlanStakeholders } from '@/lib/notification-service';
import { validatePlanForSubmission } from '@/lib/plan-validation';
import { prisma } from '@/lib/prisma';
import { requireApiUser } from '@/lib/api-auth-guard';
import { requirePlanDepartmentAccess, requirePlanDepartmentEditAccess, requirePlanDepartmentReviewAccess } from '@/lib/department-access';
import {
  canTransitionStatus,
  describeTransitionRule,
  isPlanStatus,
  isReturnTransition,
  normalizeWorkflowRole,
  normalizeWorkflowStatus
} from '@/lib/approval-workflow';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const roleForAccess = String(auth.user.role || '').toUpperCase();
  const departmentAccess = roleForAccess === 'PLANNER'
    ? await requirePlanDepartmentEditAccess(auth.user, params.id)
    : roleForAccess === 'APPROVER'
      ? await requirePlanDepartmentReviewAccess(auth.user, params.id)
      : await requirePlanDepartmentAccess(auth.user, params.id);
  if (!departmentAccess.ok) return departmentAccess.response;

  try {
    const body = await request.json();
    const rawRequestedStatus = String(body.status || '').toUpperCase();
    const reason = String(body.reason || body.comment || '').trim();

    if (!isPlanStatus(rawRequestedStatus)) {
      return NextResponse.json(
        { error: 'Invalid status. Use DRAFT, REVIEW, RETURNED, APPROVED, SUBMITTED, or REJECTED.' },
        { status: 400 }
      );
    }

    const requestedStatus = rawRequestedStatus as PrismaPlanStatus;

    const plan = await prisma.businessPlan.findUnique({
      where: { id: params.id },
      include: {
        activities: { orderBy: { sortOrder: 'asc' } }
      }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found.' }, { status: 404 });
    }

    const currentStatus = normalizeWorkflowStatus(plan.status);
    const role = normalizeWorkflowRole(auth.user.role);
    const returnTransition = isReturnTransition(currentStatus, requestedStatus);

    if (currentStatus === requestedStatus) {
      return NextResponse.json({
        ok: true,
        previousStatus: currentStatus,
        status: requestedStatus,
        message: `Plan is already ${requestedStatus}.`
      });
    }

    if (!canTransitionStatus(currentStatus, requestedStatus, role)) {
      return NextResponse.json(
        {
          error: describeTransitionRule(currentStatus, requestedStatus, role),
          currentStatus,
          requestedStatus,
          role,
          allowedStatuses: []
        },
        { status: 403 }
      );
    }

    if (returnTransition && !reason) {
      return NextResponse.json(
        { error: 'A return/rejection reason is required when sending a plan back to the planner.' },
        { status: 400 }
      );
    }

    if (['REVIEW', 'APPROVED', 'SUBMITTED'].includes(requestedStatus)) {
      const issues = validatePlanForSubmission(plan as any);
      if (issues.length > 0) {
        return NextResponse.json(
          {
            error: 'Plan cannot move forward until required fields are complete.',
            issues
          },
          { status: 400 }
        );
      }
    }

    const updatedPlan = await prisma.businessPlan.update({
      where: { id: params.id },
      data: {
        status: requestedStatus,
        updatedById: auth.user.id,
        submittedAt: requestedStatus === 'SUBMITTED' ? new Date() : plan.submittedAt,
        approvedAt: requestedStatus === 'APPROVED' ? new Date() : plan.approvedAt
      },
      include: {
        activities: { orderBy: { sortOrder: 'asc' } }
      }
    });

    if (['REVIEW', 'APPROVED', 'SUBMITTED'].includes(requestedStatus)) {
      await createApprovalSnapshot(params.id, requestedStatus, {
        id: auth.user.id,
        name: auth.user.name,
        email: auth.user.email
      }).catch((snapshotError) => {
        console.error('Approval snapshot creation failed', snapshotError);
      });
    }

    if (returnTransition || reason) {
      await prisma.auditLog.create({
        data: {
          action: (returnTransition ? 'APPROVAL_COMMENT' : 'APPROVAL_COMMENT') as any,
          details: reason,
          businessPlanId: params.id,
          userId: auth.user.id,
          metadata: {
            commentType: returnTransition ? 'REQUESTED_CHANGE' : 'APPROVAL_NOTE',
            fromStatus: currentStatus,
            toStatus: requestedStatus,
            role
          }
        }
      }).catch(() => null);
    }

    const transitionMessage = reason
      ? `${describeTransitionRule(currentStatus, requestedStatus, role)} Reason: ${reason}`
      : describeTransitionRule(currentStatus, requestedStatus, role);

    await prisma.auditLog.create({
      data: {
        action: `STATUS_${requestedStatus}` as any,
        details: transitionMessage,
        businessPlanId: params.id,
        userId: auth.user.id,
        metadata: {
          fromStatus: currentStatus,
          toStatus: requestedStatus,
          role,
          reason: reason || null,
          workflow: 'DRAFT -> REVIEW -> APPROVED -> SUBMITTED with return/rejection support'
        }
      }
    }).catch(() => null);

    await notifyPlanStakeholders({
      businessPlanId: params.id,
      actorUserId: auth.user.id,
      type: returnTransition ? 'PLAN_RETURNED' : `PLAN_${requestedStatus}`,
      title: returnTransition ? 'Plan returned for changes' : `Plan moved to ${requestedStatus}`,
      message: transitionMessage,
      metadata: { fromStatus: currentStatus, toStatus: requestedStatus, reason: reason || null }
    });

    return NextResponse.json({
      ok: true,
      plan: updatedPlan,
      previousStatus: currentStatus,
      status: requestedStatus,
      message: transitionMessage
    });
  } catch (error) {
    console.error('Status transition failed', error);

    return NextResponse.json(
      { error: 'Could not update plan status.' },
      { status: 500 }
    );
  }
}
