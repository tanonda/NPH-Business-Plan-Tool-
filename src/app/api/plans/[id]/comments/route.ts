import { NextRequest, NextResponse } from 'next/server';
import { requirePlanDepartmentAccess } from '@/lib/department-access';
import { notifyPlanStakeholders } from '@/lib/notification-service';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/auth';
import { requireApiUser, requireApiRole } from '@/lib/api-auth-guard';

export const dynamic = 'force-dynamic';

const COMMENT_TYPES = ['GENERAL_COMMENT', 'REQUESTED_CHANGE', 'APPROVAL_NOTE', 'REJECTION_NOTE'] as const;

const commentSchema = z.object({
  comment: z.string().trim().min(1, 'Comment is required'),
  commentType: z.enum(COMMENT_TYPES).default('GENERAL_COMMENT'),
  stage: z.string().trim().optional().default('GENERAL'),
  decision: z.string().trim().optional().default('COMMENT')
});

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const businessPlanId = context.params.id;
  const departmentAccess = await requirePlanDepartmentAccess(auth.user, businessPlanId);
  if (!departmentAccess.ok) return departmentAccess.response;

  try {
    const comments = await prisma.auditLog.findMany({
      where: { businessPlanId, action: 'APPROVAL_COMMENT' },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true, role: true } } }
    });

    return NextResponse.json({
      comments: comments.map((entry: any) => {
        const parsed = entry.metadata && typeof entry.metadata === 'object'
          ? (entry.metadata as Record<string, unknown>)
          : {};

        return {
          id: entry.id,
          planId: entry.businessPlanId,
          comment: entry.details,
          commentType: parsed.commentType || parsed.decision || 'GENERAL_COMMENT',
          stage: parsed.stage || 'GENERAL',
          decision: parsed.decision || 'COMMENT',
          createdAt: entry.createdAt,
          user: entry.user
            ? { id: entry.user.id, name: entry.user.name, email: entry.user.email, role: entry.user.role }
            : { name: 'System', email: null }
        };
      })
    });
  } catch (error) {
    console.error('Failed to load approval comments:', error);
    return NextResponse.json({ error: 'Failed to load approval comments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireApiRole(['ADMIN', 'PLANNER', 'APPROVER', 'REVIEWER']);
  if (!auth.ok) return auth.response;

  const businessPlanId = context.params.id;
  const departmentAccess = await requirePlanDepartmentAccess(auth.user, businessPlanId);
  if (!departmentAccess.ok) return departmentAccess.response;

  try {
    const body = await request.json();
    const data = commentSchema.parse(body);

    const plan = await prisma.businessPlan.findUnique({
      where: { id: businessPlanId },
      select: { id: true, title: true, status: true }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Business plan not found' }, { status: 404 });
    }

    const audit = await writeAuditLog({
      businessPlanId,
      userId: auth.user.id,
      action: 'APPROVAL_COMMENT',
      details: data.comment,
      metadata: {
        commentType: data.commentType,
        stage: data.stage,
        decision: data.decision,
        planTitle: plan.title,
        statusAtTime: plan.status
      }
    });

    await notifyPlanStakeholders({
      businessPlanId,
      actorUserId: auth.user.id,
      type: data.commentType,
      title: data.commentType === 'REQUESTED_CHANGE' ? 'Requested change added' : data.commentType === 'REJECTION_NOTE' ? 'Rejection note added' : 'Approval comment added',
      message: `${auth.user.name || auth.user.email} added a ${data.commentType.replace(/_/g, ' ').toLowerCase()} on ${plan.title}.`,
      metadata: { commentId: audit.id, commentType: data.commentType }
    });

    return NextResponse.json({
      comment: {
        id: audit.id,
        planId: audit.businessPlanId,
        comment: audit.details,
        commentType: data.commentType,
        stage: data.stage,
        decision: data.decision,
        createdAt: audit.createdAt,
        user: { id: auth.user.id, name: auth.user.name, email: auth.user.email, role: auth.user.role }
      }
    });
  } catch (error) {
    console.error('Failed to save approval comment:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid approval comment', issues: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to save approval comment' }, { status: 500 });
  }
}
