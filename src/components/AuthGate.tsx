'use client';

import { ReactNode, useEffect, useState } from 'react';

type AuthState = 'checking' | 'authenticated' | 'unauthenticated';

export function AuthGate({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>('checking');

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      try {
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (cancelled) return;

        if (res.ok) {
          setAuthState('authenticated');
          return;
        }

        setAuthState('unauthenticated');
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.replace(`/login?next=${next}`);
      } catch {
        if (cancelled) return;
        setAuthState('unauthenticated');
        window.location.replace('/login');
      }
    }

    verifySession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (authState !== 'authenticated') {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
        <section className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
          <div className="text-sm uppercase tracking-[0.3em] text-cyan-300">VNH Business Plan</div>
          <h1 className="mt-4 text-2xl font-semibold">Checking your session…</h1>
          <p className="mt-3 text-sm text-slate-400">You will be redirected to login if your session is not valid.</p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
