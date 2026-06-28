import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const logs = await prisma.auditLog.findMany({
    where: { businessPlanId: params.id },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  return Response.json(logs);
}
