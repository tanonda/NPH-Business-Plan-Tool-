'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useCurrentUser, UserRole } from '@/components/useCurrentUser';
import { UserDepartmentAccessEditor } from '@/components/UserDepartmentAccessEditor';

type ManagedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  canAccessAllDepartments?: boolean;
  departmentIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
};

type Department = {
  id: string;
  code?: string | null;
  name?: string | null;
};

const ROLES: UserRole[] = ['ADMIN', 'PLANNER', 'APPROVER', 'REVIEWER', 'VIEWER'];

function roleDescription(role: UserRole) {
  switch (role) {
    case 'ADMIN':
      return 'Full access';
    case 'PLANNER':
      return 'Create, edit drafts, import, submit for review';
    case 'APPROVER':
      return 'Approve, submit final, comment, export';
    case 'REVIEWER':
      return 'View, comment, export';
    case 'VIEWER':
      return 'View and export only';
    default:
      return '';
  }
}

export function UserManagementPanel() {
  const { user, loading: userLoading } = useCurrentUser();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('VIEWER');
  const [password, setPassword] = useState('changeme123');
  const [canAccessAllDepartments, setCanAccessAllDepartments] = useState(true);

  const isAdmin = user?.role === 'ADMIN';

  const activeCount = useMemo(
    () => users.filter((item) => item.isActive).length,
    [users]
  );

  async function loadUsers() {
    if (!isAdmin) return;

    setLoading(true);
    setMessage('');

    try {
      const [usersRes, departmentsRes] = await Promise.all([
        fetch('/api/users', { cache: 'no-store' }),
        fetch('/api/departments', { cache: 'no-store' })
      ]);

      if (!usersRes.ok) {
        const err = await usersRes.json().catch(() => ({}));
        throw new Error(err.error || `Could not load users. Status ${usersRes.status}`);
      }

      const nextUsers = await usersRes.json();
      setUsers(Array.isArray(nextUsers) ? nextUsers : []);

      if (departmentsRes.ok) {
        const nextDepartments = await departmentsRes.json();
        setDepartments(Array.isArray(nextDepartments) ? nextDepartments : []);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      setUsers([]);
      setMessage(error instanceof Error ? error.message : 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      void loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function createUser(event: FormEvent) {
    event.preventDefault();

    setCreating(true);
    setMessage('Creating user...');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          role,
          password,
          canAccessAllDepartments
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Could not create user.');
      }

      setName('');
      setEmail('');
      setRole('VIEWER');
      setPassword('changeme123');
      setCanAccessAllDepartments(true);
      setMessage('User created.');
      await loadUsers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create user.');
    } finally {
      setCreating(false);
    }
  }

  async function updateUser(userId: string, patch: Partial<ManagedUser> & { password?: string }) {
    setMessage('Updating user...');

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Could not update user.');
      }

      setMessage('User updated.');
      await loadUsers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update user.');
    }
  }

  async function resetPassword(targetUser: ManagedUser) {
    const nextPassword = window.prompt(
      `New temporary password for ${targetUser.email}`,
      'changeme123'
    );

    if (!nextPassword) return;

    await updateUser(targetUser.id, { password: nextPassword });
  }

  if (userLoading) {
    return null;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <section className="panel" style={{ marginTop: 18 }}>
      <div className="actions" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>User Management</h2>
          <p className="muted">
            ADMIN-only. Create users, assign roles, activate/deactivate accounts, reset passwords, and assign departments.
          </p>
        </div>

        <div className="hero-badges">
          <span className="badge good">{activeCount} active</span>
          <span className="badge">{users.length} total</span>
        </div>
      </div>

      <form onSubmit={createUser} className="grid cols-4" style={{ marginTop: 16 }}>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Role
          <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
            {ROLES.map((item) => (
              <option key={item} value={item}>
                {item} — {roleDescription(item)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Temporary password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={canAccessAllDepartments}
            onChange={(event) => setCanAccessAllDepartments(event.target.checked)}
          />
          Access all departments
        </label>

        <div className="actions">
          <button type="submit" disabled={creating}>
            {creating ? 'Creating...' : 'Create user'}
          </button>

          <button type="button" className="secondary" onClick={() => void loadUsers()}>
            Refresh
          </button>
        </div>
      </form>

      {message && <p className="muted" style={{ marginTop: 12 }}>{message}</p>}

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>All departments</th>
              <th>Assigned departments</th>
              <th>Last login</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>Loading users...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  No users found. Click Refresh. If this stays empty, check whether /api/users returns 200.
                </td>
              </tr>
            ) : (
              users.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.email}</td>

                  <td>
                    <select
                      value={item.role}
                      onChange={(event) =>
                        void updateUser(item.id, { role: event.target.value as UserRole })
                      }
                      disabled={item.id === user?.id}
                    >
                      {ROLES.map((nextRole) => (
                        <option key={nextRole} value={nextRole}>
                          {nextRole}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <span className={`badge ${item.isActive ? 'good' : 'warn'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={Boolean(item.canAccessAllDepartments)}
                        onChange={(event) =>
                          void updateUser(item.id, {
                            canAccessAllDepartments: event.target.checked
                          })
                        }
                      />
                      All
                    </label>
                  </td>

                  <td>
                    <UserDepartmentAccessEditor
                      userId={item.id}
                      departments={departments}
                      initialDepartmentIds={item.departmentIds || []}
                      disabled={Boolean(item.canAccessAllDepartments)}
                      onSaved={() => void loadUsers()}
                    />
                  </td>

                  <td>
                    {item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString() : 'Never'}
                  </td>

                  <td className="actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => void resetPassword(item)}
                    >
                      Reset password
                    </button>

                    <button
                      type="button"
                      className={item.isActive ? 'danger' : 'secondary'}
                      onClick={() => void updateUser(item.id, { isActive: !item.isActive })}
                      disabled={item.id === user?.id}
                    >
                      {item.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
