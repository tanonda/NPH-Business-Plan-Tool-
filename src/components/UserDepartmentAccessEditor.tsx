'use client';

import { useMemo, useState } from 'react';

type Department = {
  id: string;
  code?: string | null;
  name?: string | null;
};

type Props = {
  userId: string;
  departments: Department[];
  initialDepartmentIds: string[];
  disabled?: boolean;
  onSaved?: () => void;
};

function departmentLabel(department: Department) {
  const code = department.code ? `${department.code} — ` : '';
  return `${code}${department.name || department.id}`;
}

export function UserDepartmentAccessEditor({
  userId,
  departments,
  initialDepartmentIds,
  disabled,
  onSaved
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialDepartmentIds || []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  function toggleDepartment(departmentId: string) {
    if (disabled) return;

    setSaved(false);

    setSelectedIds((current) => {
      if (current.includes(departmentId)) {
        return current.filter((id) => id !== departmentId);
      }

      return [...current, departmentId];
    });
  }

  async function save() {
    if (disabled) return;

    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/users/${userId}/departments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentIds: selectedIds })
      });

      if (!res.ok) {
        throw new Error('Could not save department access.');
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
    <div style={{ minWidth: 260 }}>
      <div style={{ display: 'grid', gap: 6, maxHeight: 140, overflow: 'auto' }}>
        {departments.map((department) => (
          <label
            key={department.id}
            style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}
          >
            <input
              type="checkbox"
              checked={selectedSet.has(department.id)}
              disabled={disabled}
              onChange={() => toggleDepartment(department.id)}
            />
            <span>{departmentLabel(department)}</span>
          </label>
        ))}
      </div>

      <div className="actions" style={{ marginTop: 8 }}>
        <button
          type="button"
          className="secondary"
          onClick={() => void save()}
          disabled={disabled || saving}
        >
          {saving ? 'Saving...' : 'Save departments'}
        </button>

        {saved && <span className="badge good">Saved</span>}
      </div>
    </div>
  );
}
