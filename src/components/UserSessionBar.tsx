'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationBell } from '@/components/NotificationBell';

type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

export function UserSessionBar() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          if (!cancelled) setUser(null);
          return;
        }

        const data = await response.json();
        if (!cancelled) setUser(data.user ?? null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    setLoggingOut(true);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      router.replace('/login');
      router.refresh();
    }
  }

  if (loading) {
    return <div className="session-card">Checking session...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="session-card">
      <div className="session-card__identity">
        <div className="session-card__name">{user.name || user.email}</div>
        <div className="session-card__meta">{user.email} · {user.role}</div>
      </div>

      <div className="session-card__tools">
        <NotificationBell />
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="session-card__logout"
        >
          {loggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  );
}
