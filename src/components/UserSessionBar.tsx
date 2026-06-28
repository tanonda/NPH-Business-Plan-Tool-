'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
    return (
      <div className="flex items-center justify-end rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-400">
        Checking session...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="font-semibold text-white">{user.name || user.email}</div>
        <div className="text-xs text-slate-400">
          {user.email} · {user.role}
        </div>
      </div>

      <button
        type="button"
        onClick={logout}
        disabled={loggingOut}
        className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loggingOut ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
}
