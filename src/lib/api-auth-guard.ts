import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

type ApiUser = Awaited<ReturnType<typeof getCurrentUser>>;

export type ApiAuthResult =
  | { ok: true; user: NonNullable<ApiUser> }
  | { ok: false; response: NextResponse };

export async function requireApiUser(): Promise<ApiAuthResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      )
    };
  }

  if ('isActive' in user && user.isActive === false) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'User account is disabled.' },
        { status: 403 }
      )
    };
  }

  return { ok: true, user };
}

export async function requireApiRole(allowedRoles: string[]): Promise<ApiAuthResult> {
  const auth = await requireApiUser();
  if (!auth.ok) return auth;

  const rawRole = String(auth.user.role || '');
  const role = rawRole === 'BUDGET_PLANNER' ? 'BUDGET_OFFICER' : rawRole;
  if (!allowedRoles.includes(role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'You do not have permission to perform this action.' },
        { status: 403 }
      )
    };
  }

  return auth;
}

export function getAuditUserId(user: NonNullable<ApiUser>): string {
  return user.id;
}
