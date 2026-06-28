import { cookies } from 'next/headers';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';
import type { DepartmentAccessLevel, Role, User } from '@prisma/client';

export const SESSION_COOKIE_NAME = 'vnh_bp_session';
const SESSION_DAYS = 7;

export type AuthUser = User;

function getDefaultAdminEmail() {
  return process.env.DEFAULT_ADMIN_EMAIL || 'admin@vnh.local';
}

function getDefaultAdminName() {
  return process.env.DEFAULT_ADMIN_NAME || 'Business Plan Admin';
}

function getDefaultAdminPassword() {
  return process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
}

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;

  const [algorithm, salt, hash] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !salt || !hash) return false;

  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');

  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export function getSessionExpiry(days = SESSION_DAYS): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}

export async function ensureDefaultAdminUser() {
  const email = getDefaultAdminEmail();
  const name = getDefaultAdminName();
  const password = getDefaultAdminPassword();

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name,
        role: 'ADMIN',
        isActive: true,
        canAccessAllDepartments: true,
        passwordHash: existing.passwordHash || hashPassword(password)
      }
    });
  }

  return prisma.user.create({
    data: {
      email,
      name,
      role: 'ADMIN',
      isActive: true,
      canAccessAllDepartments: true,
      passwordHash: hashPassword(password)
    }
  });
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  return user;
}

export async function createSession(userId: string) {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = getSessionExpiry();

  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });

  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/'
  });

  return session;
}

export async function destroySession() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  }

  cookies().delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date() || !session.user.isActive) {
    if (session) {
      await prisma.session.deleteMany({ where: { id: session.id } });
    }
    cookies().delete(SESSION_COOKIE_NAME);
    return null;
  }

  return session.user;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Authentication required');
  return user;
}

export function hasRole(user: Pick<User, 'role'>, roles: Role[]) {
  return roles.includes(user.role);
}

export async function requireRole(roles: Role[]) {
  const user = await requireCurrentUser();
  if (!hasRole(user, roles)) {
    throw new Error('Insufficient permissions');
  }
  return user;
}

function hasDepartmentAccessLevel(
  accessLevel: DepartmentAccessLevel,
  allowed: DepartmentAccessLevel[]
) {
  return allowed.includes(accessLevel);
}

export async function canAccessDepartment(userId: string, departmentId?: string | null) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) return false;
  if (user.role === 'ADMIN' || user.canAccessAllDepartments) return true;
  if (!departmentId) return true;

  const access = await prisma.userDepartmentAccess.findFirst({
    where: { userId, departmentId }
  });

  if (!access) return false;
  return hasDepartmentAccessLevel(access.accessLevel, ['OWNER', 'EDITOR', 'REVIEWER', 'VIEWER']);
}

export async function canEditDepartment(userId: string, departmentId?: string | null) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) return false;
  if (user.role === 'ADMIN' || user.canAccessAllDepartments) return true;
  if (!departmentId) return true;

  const access = await prisma.userDepartmentAccess.findFirst({
    where: { userId, departmentId }
  });

  if (!access) return false;
  return hasDepartmentAccessLevel(access.accessLevel, ['OWNER', 'EDITOR']);
}

type WriteAuditLogInput = {
  planId?: string | null;
  businessPlanId?: string | null;
  userId?: string | null;
  action: string;
  details?: string | null;
  metadata?: unknown;
};

export async function writeAuditLog(input: WriteAuditLogInput) {
  return prisma.auditLog.create({
    data: {
      businessPlanId: input.businessPlanId || input.planId || null,
      userId: input.userId || null,
      action: input.action as any,
      details: input.details || '',
      metadata: input.metadata === undefined ? undefined : (input.metadata as object)
    }
  });
}
