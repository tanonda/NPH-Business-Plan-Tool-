import { prisma } from '@/lib/prisma';
import { requirePlanDepartmentAccess } from '@/lib/department-access';
import { requireApiUser, requireApiRole } from '@/lib/api-auth-guard';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const departmentAccess = await requirePlanDepartmentAccess(auth.user, params.id);
  if (!departmentAccess.ok) return departmentAccess.response;

  const logs = await prisma.auditLog.findMany({
    where: { businessPlanId: params.id },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  return Response.json(logs);
}
