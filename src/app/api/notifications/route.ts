import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiUser } from '@/lib/api-auth-guard';

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const notifications = await prisma.notification.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: 'desc' },
    take: 30
  });

  return NextResponse.json({
    unreadCount: notifications.filter((item: any) => !item.readAt).length,
    notifications
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const notificationId = body.id ? String(body.id) : null;

  if (notificationId) {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId: auth.user.id },
      data: { readAt: new Date() }
    });
  } else {
    await prisma.notification.updateMany({
      where: { userId: auth.user.id, readAt: null },
      data: { readAt: new Date() }
    });
  }

  await prisma.auditLog.create({
    data: {
      action: 'NOTIFICATION_READ',
      userId: auth.user.id,
      details: notificationId ? 'Marked notification as read.' : 'Marked all notifications as read.'
    }
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
