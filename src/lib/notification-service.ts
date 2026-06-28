import { prisma } from '@/lib/prisma';

type NotificationInput = {
  userId?: string | null;
  businessPlanId?: string | null;
  type: string;
  title: string;
  message: string;
  metadata?: unknown;
};

export async function createNotification(input: NotificationInput) {
  if (!input.userId) return null;

  return prisma.notification.create({
    data: {
      userId: input.userId,
      businessPlanId: input.businessPlanId || null,
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: input.metadata === undefined ? undefined : (input.metadata as object)
    }
  }).catch((error: any) => {
    console.error('Notification creation failed', error);
    return null;
  });
}

export async function notifyPlanStakeholders({
  businessPlanId,
  actorUserId,
  type,
  title,
  message,
  metadata
}: {
  businessPlanId: string;
  actorUserId?: string | null;
  type: string;
  title: string;
  message: string;
  metadata?: unknown;
}) {
  const plan = await prisma.businessPlan.findUnique({
    where: { id: businessPlanId },
    select: {
      ownerId: true,
      createdById: true,
      updatedById: true
    }
  });

  if (!plan) return [];

  const userIds = Array.from(new Set([plan.ownerId, plan.createdById, plan.updatedById].filter(Boolean) as string[]))
    .filter((id) => id !== actorUserId);

  return Promise.all(userIds.map((userId) => createNotification({
    userId,
    businessPlanId,
    type,
    title,
    message,
    metadata
  })));
}
