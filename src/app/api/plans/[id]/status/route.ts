import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/auth';
import { z } from 'zod';

const StatusSchema = z.object({
  status: z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'SUBMITTED'])
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { status } = StatusSchema.parse(await request.json());
  const now = new Date();
  const plan = await prisma.businessPlan.update({
    where: { id: params.id },
    data: {
      status,
      submittedAt: status === 'SUBMITTED' ? now : null,
      approvedAt: status === 'APPROVED' ? now : null
    }
  });
  await writeAuditLog({ businessPlanId: plan.id, action: `STATUS_${status}`, details: `Status changed to ${status}` });
  return Response.json(plan);
}
