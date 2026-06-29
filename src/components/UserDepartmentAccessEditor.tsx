'use client';

import { useEffect, useMemo, useState } from 'react';

type Department = {
  id: string;
  code?: string | null;
  name?: string | null;
};

type DepartmentAccessLevel = 'OWNER' | 'EDITOR' | 'REVIEWER' | 'VIEWER';

type Props = {
  userId: string;
  role?: string;
  departments: Department[];
  initialDepartmentIds: string[];
  canAccessAllDepartments?: boolean;
  disabled?: boolean;
  onAccessModeChange?: (canAccessAllDepartments: boolean) => Promise<void> | void;
  onSaved?: () => void;
};

function departmentLabel(department: Department) {
  const code = department.code ? `${department.code} — ` : '';
  return `${code}${department.name || department.id}`;
}

function compactDepartmentLabel(department: Department) {
  return department.code || department.name || department.id;
}

function selectedSummary(accessAll: boolean, selectedIds: string[], departments: Department[]) {
  if (accessAll) return 'All departments';
  if (selectedIds.length === 0) return 'No departments selected';
  if (selectedIds.length === 1) {
    const selected = departments.find((department) => department.id === selectedIds[0]);
    return selected ? compactDepartmentLabel(selected) : '1 department selected';
  }
  return `${selectedIds.length} departments selected`;
}

function defaultAccessLevelForRole(role?: string): DepartmentAccessLevel {
  switch (String(role || '').toUpperCase()) {
    case 'ADMIN':
    case 'PLANNER':
    case 'ACCOUNTING':
    case 'FINANCE':
    case 'BUDGET_OFFICER':
    case 'BUDGET_PLANNER':
      return 'EDITOR';
    case 'DONOR_MANAGER':
      return 'REVIEWER';
    case 'APPROVER':
    case 'REVIEWER':
      return 'REVIEWER';
    default:
      return 'VIEWER';
  }
}

export function UserDepartmentAccessEditor({
  userId,
  role,
  departments,
  initialDepartmentIds,
  canAccessAllDepartments = false,
  disabled,
  onAccessModeChange,
  onSaved
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialDepartmentIds || []);
  const [accessAll, setAccessAll] = useState(Boolean(canAccessAllDepartments));
  const [accessLevel, setAccessLevel] = useState<DepartmentAccessLevel>(() => defaultAccessLevelForRole(role));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setSelectedIds(initialDepartmentIds || []);
  }, [initialDepartmentIds]);

  useEffect(() => {
    setAccessAll(Boolean(canAccessAllDepartments));
  }, [canAccessAllDepartments]);

  useEffect(() => {
    setAccessLevel(defaultAccessLevelForRole(role));
  }, [role]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filteredDepartments = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return departments;

    return departments.filter((department) =>
      departmentLabel(department).toLowerCase().includes(needle)
    );
  }, [departments, query]);

  function chooseAllDepartments() {
    if (disabled) return;
    setSaved(false);
    setAccessAll(true);
  }

  function toggleDepartment(departmentId: string) {
    if (disabled) return;

    setSaved(false);
    setAccessAll(false);
    setSelectedIds((current) => {
      if (current.includes(departmentId)) {
        return current.filter((id) => id !== departmentId);
      }

      return [...current, departmentId];
    });
  }

  function selectFilteredDepartments() {
    if (disabled) return;
    setSaved(false);
    setAccessAll(false);
    const next = new Set(selectedIds);
    filteredDepartments.forEach((department) => next.add(department.id));
    setSelectedIds(Array.from(next));
  }

  function clearDepartments() {
    if (disabled) return;
    setSaved(false);
    setAccessAll(false);
    setSelectedIds([]);
  }

  async function save() {
    if (disabled) return;

    setSaving(true);
    setSaved(false);

    try {
      await onAccessModeChange?.(accessAll);

      if (!accessAll) {
        const res = await fetch(`/api/users/${userId}/departments`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ departmentIds: selectedIds, accessLevel })
        });

        if (!res.ok) {
          throw new Error('Could not save department access.');
        }
      }

      setSaved(true);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  if (departments.length === 0) {
    return <span className="muted">No departments found.</span>;
  }

  return (
    <details className="department-access-menu department-access-single-menu">
      <summary className={accessAll ? 'is-all' : ''}>
        <span>{selectedSummary(accessAll, selectedIds, departments)}</span>
      </summary>

      <div className="department-access-menu__panel department-access-single-menu__panel">
        <label className={`department-access-single-menu__all ${accessAll ? 'is-selected' : ''}`}>
          <input
            type="radio"
            name={`department-access-${userId}`}
            checked={accessAll}
            disabled={disabled}
            onChange={chooseAllDepartments}
          />
          <span>
            <strong>All departments</strong>
            <small>Full access to every current and future department</small>
          </span>
        </label>

        <div className="department-access-single-menu__divider" />

        <input
          className="department-access-menu__search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search department code or name"
          aria-label="Search departments"
        />

        <label style={{ display: 'grid', gap: 4, marginTop: 8 }}>
          <span className="muted">Department access level</span>
          <select
            value={accessLevel}
            disabled={disabled || accessAll}
            onChange={(event) => {
              setSaved(false);
              setAccessLevel(event.target.value as DepartmentAccessLevel);
            }}
          >
            <option value="OWNER">OWNER — full department owner</option>
            <option value="EDITOR">EDITOR — create/edit plans and finance records</option>
            <option value="REVIEWER">REVIEWER — review/comment/approve visibility</option>
            <option value="VIEWER">VIEWER — read-only</option>
          </select>
        </label>

        <div className="department-access-menu__toolbar">
          <button type="button" className="link-button" onClick={selectFilteredDepartments} disabled={disabled}>
            Select visible
          </button>
          <button type="button" className="link-button" onClick={clearDepartments} disabled={disabled}>
            Clear selected
          </button>
        </div>

        <div className={`department-access-menu__list ${accessAll ? 'is-muted' : ''}`}>
          {filteredDepartments.map((department) => (
            <label key={department.id}>
              <input
                type="checkbox"
                checked={!accessAll && selectedSet.has(department.id)}
                disabled={disabled}
                onChange={() => toggleDepartment(department.id)}
              />
              <span>{departmentLabel(department)}</span>
            </label>
          ))}
        </div>

        <div className="department-access-menu__actions">
          <span className="department-access-menu__hint">
            {accessAll ? 'All access selected' : `${selectedSummary(false, selectedIds, departments)} · ${accessLevel}`}
          </span>
          <button type="button" className="secondary" onClick={() => void save()} disabled={disabled || saving}>
            {saving ? 'Saving...' : 'Apply'}
          </button>
          {saved && <span className="badge good">Saved</span>}
        </div>
      </div>
    </details>
  );
}
