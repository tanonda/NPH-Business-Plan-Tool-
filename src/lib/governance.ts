type GovernanceReviewInput = {
  entityType: string;
  entityId: string;
  previousStatus: string;
  newStatus: string;
  comment: string;
  reviewedById: string;
  snapshot: unknown;
};

export async function createGovernanceReview(prisma: any, input: GovernanceReviewInput) {
  const review = await prisma.governanceReview.create({ data: input });
  const users = await prisma.user.findMany({
    where: { isActive: true, id: { not: input.reviewedById }, role: { in: ['ADMIN', 'APPROVER', 'REVIEWER', 'FINANCE', 'BUDGET_OFFICER'] } },
    select: { id: true }
  });
  if (users.length > 0) {
    await prisma.notification.createMany({
      data: users.map((user: { id: string }) => ({
        userId: user.id,
        type: 'GOVERNANCE_REVIEW',
        title: `${input.entityType} moved to ${input.newStatus}`,
        message: `${input.entityType} ${input.entityId} moved from ${input.previousStatus} to ${input.newStatus}.${input.comment ? ` Comment: ${input.comment}` : ''}`,
        metadata: { entityType: input.entityType, entityId: input.entityId, reviewId: review.id }
      }))
    });
  }
  return review;
}