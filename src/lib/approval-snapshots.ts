import { prisma } from '@/lib/prisma';

type SnapshotUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
};

function numberValue(value: unknown) {
  const next = Number(value || 0);
  return Number.isFinite(next) ? next : 0;
}

function getActivityAmount(activity: any) {
  return numberValue(
    activity.estimatedCost ??
    activity.totalEstimatedCost ??
    activity.recurrentCost ??
    activity.amount ??
    0
  );
}

export function snapshotTypeFromStatus(status: string) {
  const normalized = String(status || '').toUpperCase();

  if (normalized === 'REVIEW') return 'REVIEW_SNAPSHOT';
  if (normalized === 'APPROVED') return 'APPROVED_SNAPSHOT';
  if (normalized === 'SUBMITTED') return 'SUBMITTED_SNAPSHOT';

  return `${normalized || 'UNKNOWN'}_SNAPSHOT`;
}

export async function createApprovalSnapshot(
  businessPlanId: string,
  status: string,
  user: SnapshotUser
) {
  const plan = await prisma.businessPlan.findUnique({
    where: { id: businessPlanId },
    include: {
      department: true,
      activities: {
        orderBy: { sortOrder: 'asc' }
      }
    }
  });

  if (!plan) {
    return null;
  }

  const activities = Array.isArray(plan.activities) ? plan.activities : [];

  const totalEstimatedCost = activities.reduce(
    (sum: number, activity: any) => sum + getActivityAmount(activity),
    0
  );

  const recurrentCost = activities.reduce(
    (sum: number, activity: any) => sum + numberValue(activity.recurrentCost ?? getActivityAmount(activity)),
    0
  );

  const unfundedCost = activities.reduce(
    (sum: number, activity: any) => sum + numberValue(activity.unfundedCost ?? 0),
    0
  );

  const snapshotType = snapshotTypeFromStatus(status);

  const snapshotData = {
    plan,
    summary: {
      businessPlanId,
      snapshotType,
      status,
      totalEstimatedCost,
      recurrentCost,
      unfundedCost,
      activityCount: activities.length,
      createdBy: {
        id: user.id || null,
        name: user.name || null,
        email: user.email || null
      },
      createdAt: new Date().toISOString()
    }
  };

  return prisma.approvalSnapshot.create({
    data: {
      businessPlanId,
      snapshotType,
      status,
      title: plan.title || 'Untitled Business Plan',
      facility: plan.facility || null,
      departmentId: plan.departmentId || null,
      departmentName: plan.department?.name || plan.department?.code || null,
      totalEstimatedCost,
      recurrentCost,
      unfundedCost,
      activityCount: activities.length,
      snapshotData,
      createdById: user.id || null,
      createdByName: user.name || null,
      createdByEmail: user.email || null
    }
  });
}
