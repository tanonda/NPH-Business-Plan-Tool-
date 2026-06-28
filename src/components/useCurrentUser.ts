'use client';

import { useEffect, useState } from 'react';

export type UserRole = 'ADMIN' | 'PLANNER' | 'APPROVER' | 'REVIEWER' | 'VIEWER';

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  canAccessAllDepartments?: boolean;
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        return data.user || null;
      })
      .then((nextUser) => {
        if (alive) setUser(nextUser);
      })
      .catch(() => {
        if (alive) setUser(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return { user, loading };
}
