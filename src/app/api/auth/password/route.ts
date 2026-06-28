import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { requireApiUser } from '@/lib/api-auth-guard';
import { validatePasswordPolicy } from '@/lib/password-policy';

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');
    const confirmPassword = String(body.confirmPassword || '');

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required.' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'New password and confirmation do not match.' }, { status: 400 });
    }

    const policy = validatePasswordPolicy(newPassword);
    if (!policy.ok) {
      return NextResponse.json({ error: policy.issues.join(' ') }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const currentOk = verifyPassword(currentPassword, user.passwordHash);
    if (!currentOk) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: auth.user.id },
      data: { passwordHash: hashPassword(newPassword) }
    });

    await prisma.auditLog.create({
      data: {
        action: 'PASSWORD_CHANGED',
        userId: auth.user.id,
        details: 'User changed their own password.',
        metadata: { selfService: true }
      }
    }).catch(() => null);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Password change failed', error);
    return NextResponse.json({ error: 'Could not change password.' }, { status: 500 });
  }
}
