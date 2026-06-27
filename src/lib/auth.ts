import { prisma } from './prisma';

export async function getSystemUser() {
  const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@vnh.local';
  const name = process.env.DEFAULT_ADMIN_NAME || 'Business Plan Admin';

  return prisma.user.upsert({
    where: { email },
    update: { name, role: 'ADMIN' },
    create: { email, name, role: 'ADMIN' }
  });
}

export async function writeAuditLog(input: { businessPlanId?: string; action: string; details?: string }) {
  const user = await getSystemUser();
  return prisma.auditLog.create({
    data: {
      businessPlanId: input.businessPlanId,
      userId: user.id,
      action: input.action,
      details: input.details || ''
    }
  });
}
