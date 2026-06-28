'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCurrentUser } from '@/components/useCurrentUser';

type ManagedUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
};

type PlanSummary = {
  id: string;
  title: string;
  status: string;
  facility?: string;
  costCenterName?: string;
};

type AccessTestResult = {
  user: {
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    canAccessAllDepartments: boolean;
    assignedDepartments: Array<{
      id: string;
      code?: string | null;
      name?: string | null;
    }>;
  };
  plan: {
    title: string;
    status: string;
    department?: {
      code?: string | null;
      name?: string | null;
    } | null;
  };
  permissions: Record<string, boolean>;
  workflow: {
    currentStatus: string;
    allowedNextStatuses: string[];
    lockMessage: string;
  };
  explanation: {
    roleRule: string;
    departmentRule: string;
    statusRule: string;
  };
};

function labelPermission(key: string) {
  const labels: Record<string, string> = {
    canLogin: 'Can login',
    canViewPlan: 'Can view plan',
    canEditPlanContent: 'Can edit plan content',
    canSubmitForReview: 'Can submit for review',
    canApprove: 'Can approve',
    canSubmitFinal: 'Can submit final',
    canComment: 'Can comment',
    canExport: 'Can export',
    canManageUsers: 'Can manage users',
    departmentAccessAllowed: 'Department access allowed'
  };

  return labels[key] || key;
}

export function RoleAccessTestPanel() {
  const { user } = useCurrentUser();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [result, setResult] = useState<AccessTestResult | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const selectedUser = useMemo(
    () => users.find((item) => item.id === selectedUserId),
    [users, selectedUserId]
  );

  const selectedPlan = useMemo(
    () => plans.find((item) => item.id === selectedPlanId),
    [plans, selectedPlanId]
  );

  async function loadInitialData() {
    if (!isAdmin) return;

    setLoading(true);
    setMessage('');

    try {
      const [usersRes, plansRes] = await Promise.all([
        fetch('/api/users', { cache: 'no-store' }),
        fetch('/api/plans', { cache: 'no-store' })
      ]);

      if (!usersRes.ok) {
        throw new Error('Could not load users.');
      }

      if (!plansRes.ok) {
        throw new Error('Could not load plans.');
      }

      const nextUsers = await usersRes.json();
      const nextPlans = await plansRes.json();

      const safeUsers = Array.isArray(nextUsers) ? nextUsers : [];
      const safePlans = Array.isArray(nextPlans) ? nextPlans : [];

      setUsers(safeUsers);
      setPlans(safePlans);

      if (!selectedUserId && safeUsers[0]?.id) {
        setSelectedUserId(safeUsers[0].id);
      }

      if (!selectedPlanId && safePlans[0]?.id) {
        setSelectedPlanId(safePlans[0].id);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load access test data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function runTest() {
    if (!selectedUserId || !selectedPlanId) {
      setMessage('Select a user and a plan first.');
      return;
    }

    setLoading(true);
    setMessage('');
    setResult(null);

    try {
      const res = await fetch(
        `/api/admin/access-test?userId=${encodeURIComponent(selectedUserId)}&planId=${encodeURIComponent(selectedPlanId)}`,
        { cache: 'no-store' }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Could not run access test.');
      }

      setResult(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not run access test.');
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) return null;

  return (
    <section className="panel" style={{ marginTop: 18 }}>
      <div className="actions" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Role &amp; Access Test</h2>
          <p className="muted">
            ADMIN diagnostic tool. Select a user and plan to see what that user should be allowed to do.
          </p>
        </div>

        <button type="button" className="secondary" onClick={() => void loadInitialData()}>
          Refresh
        </button>
      </div>

      <div className="grid cols-3" style={{ marginTop: 16 }}>
        <label>
          User
          <select
            value={selectedUserId}
            onChange={(event) => {
              setSelectedUserId(event.target.value);
              setResult(null);
            }}
          >
            {users.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} — {item.email} — {item.role}
              </option>
            ))}
          </select>
        </label>

        <label>
          Plan
          <select
            value={selectedPlanId}
            onChange={(event) => {
              setSelectedPlanId(event.target.value);
              setResult(null);
            }}
          >
            {plans.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} — {item.status}
              </option>
            ))}
          </select>
        </label>

        <div className="actions" style={{ alignItems: 'end' }}>
          <button type="button" onClick={() => void runTest()} disabled={loading || !selectedUserId || !selectedPlanId}>
            {loading ? 'Testing...' : 'Run access test'}
          </button>
        </div>
      </div>

      {selectedUser && selectedPlan && (
        <p className="muted" style={{ marginTop: 12 }}>
          Testing <strong>{selectedUser.name}</strong> against <strong>{selectedPlan.title}</strong>.
        </p>
      )}

      {message && <p className="muted" style={{ marginTop: 12 }}>{message}</p>}

      {result && (
        <div style={{ marginTop: 16 }}>
          <div className="grid cols-3">
            <div className="card">
              <h3>User</h3>
              <p><strong>{result.user.name}</strong></p>
              <p className="muted">{result.user.email}</p>
              <p><span className="badge">{result.user.role}</span></p>
              <p className="muted">
                {result.user.isActive ? 'Active account' : 'Inactive account'}
              </p>
            </div>

            <div className="card">
              <h3>Plan</h3>
              <p><strong>{result.plan.title}</strong></p>
              <p><span className="badge">{result.plan.status}</span></p>
              <p className="muted">
                Department:{' '}
                {result.plan.department
                  ? `${result.plan.department.code || ''} ${result.plan.department.name || ''}`.trim()
                  : 'None'}
              </p>
            </div>

            <div className="card">
              <h3>Workflow</h3>
              <p className="muted">Current status: {result.workflow.currentStatus}</p>
              <p className="muted">
                Next allowed:{' '}
                {result.workflow.allowedNextStatuses.length
                  ? result.workflow.allowedNextStatuses.join(', ')
                  : 'None'}
              </p>
              <p className="muted">{result.workflow.lockMessage}</p>
            </div>
          </div>

          <div className="table-wrap" style={{ marginTop: 16 }}>
            <table>
              <thead>
                <tr>
                  <th>Permission</th>
                  <th>Result</th>
                </tr>
              </thead>

              <tbody>
                {Object.entries(result.permissions).map(([key, value]) => (
                  <tr key={key}>
                    <td>{labelPermission(key)}</td>
                    <td>
                      <span className={`badge ${value ? 'good' : 'warn'}`}>
                        {value ? 'Allowed' : 'Blocked'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="notice" style={{ marginTop: 16 }}>
            <p><strong>Role rule:</strong> {result.explanation.roleRule}</p>
            <p><strong>Department rule:</strong> {result.explanation.departmentRule}</p>
            <p style={{ marginBottom: 0 }}>
              <strong>Status rule:</strong> {result.explanation.statusRule}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
