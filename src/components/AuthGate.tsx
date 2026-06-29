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
      <main className="auth-check-shell">
        <section className="auth-check-card" aria-live="polite">
          <div className="auth-check-orbit" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="auth-check-mark">VNH</div>
          <p className="auth-check-eyebrow">Business Plan Platform</p>
          <h1>Checking your session…</h1>
          <p className="auth-check-copy">Securing your dashboard and loading the right role access.</p>
          <div className="auth-check-progress" aria-hidden="true"><span /></div>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
