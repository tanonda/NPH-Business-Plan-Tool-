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

const ROLES: UserRole[] = ['ADMIN', 'PLANNER', 'APPROVER', 'REVIEWER', 'ACCOUNTING', 'FINANCE', 'BUDGET_OFFICER', 'DONOR_MANAGER', 'VIEWER'];

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
    case 'ACCOUNTING':
      return 'Commitments, expenditure, and budget checks';
    case 'FINANCE':
      return 'Finance clearance and budget approval';
    case 'BUDGET_OFFICER':
    case 'BUDGET_PLANNER':
      return 'Budget ceilings, virements, and allocations';
    case 'DONOR_MANAGER':
      return 'Donor funding and restrictions';
    case 'VIEWER':
      return 'View and export only';
    default:
      return '';
  }
}

function formatLastLogin(lastLoginAt?: string | null) {
  if (!lastLoginAt) return 'Never';

  return new Date(lastLoginAt).toLocaleString(undefined, {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function UserManagementPanel() {
  const { user, loading: userLoading } = useCurrentUser();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState<UserRole>('VIEWER');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('VIEWER');
  const [password, setPassword] = useState('changeme123');
  const [canAccessAllDepartments, setCanAccessAllDepartments] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const activeCount = useMemo(
    () => users.filter((item) => item.isActive).length,
    [users]
  );

  const selectableUsers = useMemo(
    () => users.filter((item) => item.id !== user?.id),
    [user?.id, users]
  );

  const selectedUsers = useMemo(
    () => users.filter((item) => selectedUserIds.includes(item.id)),
    [selectedUserIds, users]
  );

  const allSelectableSelected =
    selectableUsers.length > 0 && selectableUsers.every((item) => selectedUserIds.includes(item.id));

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
      const safeUsers = Array.isArray(nextUsers) ? nextUsers : [];
      setUsers(safeUsers);
      setSelectedUserIds((current) =>
        current.filter((id) => safeUsers.some((item: ManagedUser) => item.id === id && item.id !== user?.id))
      );

      if (departmentsRes.ok) {
        const nextDepartments = await departmentsRes.json();
        setDepartments(Array.isArray(nextDepartments) ? nextDepartments : []);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      setUsers([]);
      setSelectedUserIds([]);
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
      setCanAccessAllDepartments(false);
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

  async function bulkUpdateUsers(patch: Partial<ManagedUser>) {
    if (selectedUsers.length === 0) return;

    setBulkUpdating(true);
    setMessage(`Updating ${selectedUsers.length} users...`);

    try {
      const targets = selectedUsers.filter((item) => item.id !== user?.id);

      for (const target of targets) {
        const res = await fetch(`/api/users/${target.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch)
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Could not update ${target.email}.`);
        }
      }

      setSelectedUserIds([]);
      setMessage(`Updated ${targets.length} users.`);
      await loadUsers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Bulk update failed.');
    } finally {
      setBulkUpdating(false);
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

  function toggleUserSelection(userId: string) {
    if (userId === user?.id) return;

    setSelectedUserIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    );
  }

  function toggleSelectAll() {
    if (allSelectableSelected) {
      setSelectedUserIds([]);
      return;
    }

    setSelectedUserIds(selectableUsers.map((item) => item.id));
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

      <form onSubmit={createUser} className="grid cols-4 user-create-form" style={{ marginTop: 16 }}>
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

      <div className="table-bulk-toolbar user-table-toolbar">
        <label className="compact-checkbox">
          <input
            type="checkbox"
            checked={allSelectableSelected}
            onChange={toggleSelectAll}
            disabled={selectableUsers.length === 0 || loading}
          />
          Select all users
        </label>

        <span className="selected-count-pill">
          {selectedUsers.length} selected
        </span>

        <div className="bulk-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => void bulkUpdateUsers({ isActive: true })}
            disabled={selectedUsers.length === 0 || bulkUpdating}
          >
            Activate
          </button>

          <button
            type="button"
            className="secondary"
            onClick={() => void bulkUpdateUsers({ isActive: false })}
            disabled={selectedUsers.length === 0 || bulkUpdating}
          >
            Deactivate
          </button>

          <select
            value={bulkRole}
            onChange={(event) => setBulkRole(event.target.value as UserRole)}
            disabled={selectedUsers.length === 0 || bulkUpdating}
            aria-label="Bulk role"
          >
            {ROLES.map((nextRole) => (
              <option key={nextRole} value={nextRole}>{nextRole}</option>
            ))}
          </select>

          <button
            type="button"
            className="secondary"
            onClick={() => void bulkUpdateUsers({ role: bulkRole })}
            disabled={selectedUsers.length === 0 || bulkUpdating}
          >
            Set role
          </button>

          {selectedUsers.length > 0 && (
            <button type="button" className="ghost-button" onClick={() => setSelectedUserIds([])}>
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="table-wrap user-table-wrap" style={{ marginTop: 10 }}>
        <table className="user-management-table compact-user-table optimized-user-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Department access</th>
              <th>Last seen</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>Loading users...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  No users found. Click Refresh. If this stays empty, check whether /api/users returns 200.
                </td>
              </tr>
            ) : (
              users.map((item) => {
                const isCurrentUser = item.id === user?.id;
                const selected = selectedUserIds.includes(item.id);

                return (
                  <tr key={item.id} className={`user-management-row ${selected ? 'is-selected' : ''}`}>
                    <td className="user-identity-cell">
                      <label className="inline-row-selector">
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={isCurrentUser}
                          onChange={() => toggleUserSelection(item.id)}
                          title={isCurrentUser ? 'You cannot bulk-edit your own account.' : `Select ${item.email}`}
                          aria-label={`Select ${item.email}`}
                        />
                        <span>
                          <strong>{item.name || 'Unnamed user'}</strong>
                          <small>{item.email}</small>
                        </span>
                      </label>
                    </td>

                    <td className="role-cell">
                      <select
                        value={item.role}
                        onChange={(event) =>
                          void updateUser(item.id, { role: event.target.value as UserRole })
                        }
                        disabled={isCurrentUser}
                        aria-label={`Role for ${item.email}`}
                      >
                        {ROLES.map((nextRole) => (
                          <option key={nextRole} value={nextRole}>
                            {nextRole}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="status-cell">
                      <span className={`badge ${item.isActive ? 'good' : 'warn'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="department-access-cell">
                      <UserDepartmentAccessEditor
                        userId={item.id}
                        departments={departments}
                        initialDepartmentIds={item.departmentIds || []}
                        role={item.role}
                        canAccessAllDepartments={Boolean(item.canAccessAllDepartments)}
                        onAccessModeChange={(nextAccessAll) =>
                          updateUser(item.id, { canAccessAllDepartments: nextAccessAll })
                        }
                        onSaved={() => void loadUsers()}
                      />
                    </td>

                    <td className="last-login-cell">
                      {formatLastLogin(item.lastLoginAt)}
                    </td>

                    <td className="user-actions-cell">
                      <details className="row-actions-menu">
                        <summary aria-label={`Actions for ${item.email}`}>Actions</summary>
                        <div className="row-actions-menu__panel">
                          <button type="button" onClick={() => void resetPassword(item)}>
                            Reset password
                          </button>
                          <button
                            type="button"
                            className={item.isActive ? 'danger-text' : ''}
                            disabled={isCurrentUser}
                            onClick={() => void updateUser(item.id, { isActive: !item.isActive })}
                          >
                            {item.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </details>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
