'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-frame" aria-label="VNH business plan login">
        <aside className="login-brand-panel">
          <div className="login-brand-mark">VNH</div>
          <div>
            <p className="login-eyebrow">Vila Central Hospital</p>
            <h1>Business Plan Control Platform</h1>
            <p className="login-brand-copy">
              Manage planning, approval workflow, budget controls, snapshots, exports,
              and accounting visibility from one secure workspace.
            </p>
          </div>

          <div className="login-feature-grid" aria-label="Platform highlights">
            <div>
              <strong>Budget Control</strong>
              <span>Ceilings, donor funds, commitments and remaining balances.</span>
            </div>
            <div>
              <strong>Approval Workflow</strong>
              <span>Planner, approver, accounting and finance review gates.</span>
            </div>
            <div>
              <strong>Audit Ready</strong>
              <span>Snapshots, exports, comments and action history.</span>
            </div>
          </div>
        </aside>

        <section className="login-card">
          <div className="login-card-header">
            <p className="login-eyebrow dark">Secure access</p>
            <h2>Sign in</h2>
            <p>Use your assigned account to continue to the business planning dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="name@vnh.local"
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="login-submit">
              {loading ? 'Signing in...' : 'Sign in to dashboard'}
            </button>
          </form>

          {process.env.NODE_ENV !== 'production' && (
            <details className="login-dev-default">
              <summary>Development login</summary>
              <div>
                <p>Use the account created by your seed settings.</p>
                <p>Set DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD in your local environment.</p>
              </div>
            </details>
          )}
        </section>
      </section>
    </main>
  );
}
