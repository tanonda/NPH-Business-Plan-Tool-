'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type SnapshotAction = 'VERSION_SNAPSHOT_SUBMITTED' | 'VERSION_SNAPSHOT_APPROVED' | string;

type AuditLogRecord = {
  id: string;
  action: SnapshotAction;
  details: string;
  createdAt: string;
  user?: { name?: string | null; email?: string | null } | null;
};

type SnapshotPayload = {
  capturedAt?: string;
  status?: string;
  plan?: {
    id?: string;
    title?: string;
    organization?: string;
    facility?: string;
    year?: number;
    costCenter?: string;
    costCenterName?: string;
    ceilingAmount?: number | string;
  };
  summary?: {
    totalEstimatedCost?: number;
    totalRecurrentBudget?: number;
    totalDevelopmentPartners?: number;
    unfundedCost?: number;
    cashflowTotal?: number;
    activityCount?: number;
    [key: string]: unknown;
  };
  activities?: Array<unknown>;
  monthlyTotals?: Record<string, number>;
  [key: string]: unknown;
};

type VersionSnapshotsPanelProps = {
  planId: string;
  planTitle?: string;
};

function formatVatu(value: unknown): string {
  const amount = Number(value || 0);
  return `VT ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatDate(value?: string): string {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function safeParseSnapshot(details: string): SnapshotPayload | null {
  try {
    const parsed = JSON.parse(details) as SnapshotPayload;
    if (parsed && typeof parsed === 'object') return parsed;
    return null;
  } catch {
    return null;
  }
}

function snapshotLabel(action: string, snapshot?: SnapshotPayload | null): string {
  const status = snapshot?.status || action.replace('VERSION_SNAPSHOT_', '');
  return `${status}`.toUpperCase();
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function VersionSnapshotsPanel({ planId, planTitle }: VersionSnapshotsPanelProps) {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadSnapshots = useCallback(async () => {
    if (!planId) return;
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`/api/plans/${planId}/audit`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Could not load audit history for snapshots.');

      const data = (await res.json()) as AuditLogRecord[];
      const snapshotLogs = data.filter((log) => log.action.startsWith('VERSION_SNAPSHOT_'));
      setLogs(snapshotLogs);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load version snapshots.');
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    void loadSnapshots();
  }, [loadSnapshots]);

  const parsedSnapshots = useMemo(() => {
    return logs.map((log) => ({
      log,
      snapshot: safeParseSnapshot(log.details)
    }));
  }, [logs]);

  return (
    <section className="panel" style={{ marginTop: 18 }}>
      <div className="actions" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Version snapshots</h2>
          <p className="muted">
            Submitted and approved snapshots for {planTitle || 'this plan'}. These are read-only captured versions from workflow status changes.
          </p>
        </div>
        <button type="button" className="secondary" onClick={() => void loadSnapshots()} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {message && <p className="muted">{message}</p>}

      {loading ? (
        <p className="muted">Loading version snapshots...</p>
      ) : parsedSnapshots.length === 0 ? (
        <p className="muted">
          No version snapshots yet. A snapshot will be captured when the plan status is changed to SUBMITTED or APPROVED.
        </p>
      ) : (
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Captured</th>
                <th>By</th>
                <th className="money">Activities</th>
                <th className="money">Estimated</th>
                <th className="money">Cashflow</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {parsedSnapshots.map(({ log, snapshot }) => {
                const status = snapshotLabel(log.action, snapshot);
                const activityCount = snapshot?.summary?.activityCount ?? snapshot?.activities?.length ?? 0;
                const estimated = snapshot?.summary?.totalEstimatedCost ?? 0;
                const cashflow = snapshot?.summary?.cashflowTotal ?? 0;
                const capturedAt = snapshot?.capturedAt || log.createdAt;
                const isExpanded = expandedId === log.id;

                return (
                  <tr key={log.id}>
                    <td>
                      <span className={`badge status-${status.toLowerCase()}`}>{status}</span>
                    </td>
                    <td>{formatDate(capturedAt)}</td>
                    <td>{log.user?.name || log.user?.email || 'System'}</td>
                    <td className="money">{Number(activityCount).toLocaleString('en-US')}</td>
                    <td className="money">{formatVatu(estimated)}</td>
                    <td className="money">{formatVatu(cashflow)}</td>
                    <td className="actions">
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      >
                        {isExpanded ? 'Hide' : 'View'}
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => downloadJson(`version-snapshot-${status.toLowerCase()}-${log.id}.json`, snapshot || log.details)}
                      >
                        JSON
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {expandedId && (
        <div className="panel" style={{ marginTop: 14 }}>
          {(() => {
            const selected = parsedSnapshots.find((item) => item.log.id === expandedId);
            const snapshot = selected?.snapshot;
            if (!selected) return <p className="muted">Snapshot not found.</p>;
            if (!snapshot) {
              return (
                <>
                  <h3>Raw snapshot details</h3>
                  <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{selected.log.details}</pre>
                </>
              );
            }

            return (
              <>
                <div className="actions" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3>{snapshotLabel(selected.log.action, snapshot)} snapshot</h3>
                    <p className="muted">Captured {formatDate(snapshot.capturedAt || selected.log.createdAt)}</p>
                  </div>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => downloadJson(`version-snapshot-${selected.log.id}.json`, snapshot)}
                  >
                    Download JSON
                  </button>
                </div>

                <div className="kpis" style={{ marginTop: 14 }}>
                  <div className="kpi"><span>Plan</span><strong>{snapshot.plan?.title || planTitle || 'Business plan'}</strong></div>
                  <div className="kpi"><span>Activities</span><strong>{Number(snapshot.summary?.activityCount ?? snapshot.activities?.length ?? 0).toLocaleString('en-US')}</strong></div>
                  <div className="kpi"><span>Estimated</span><strong>{formatVatu(snapshot.summary?.totalEstimatedCost)}</strong></div>
                  <div className="kpi"><span>Cashflow</span><strong>{formatVatu(snapshot.summary?.cashflowTotal)}</strong></div>
                </div>

                {snapshot.monthlyTotals && (
                  <div className="table-wrap" style={{ marginTop: 14 }}>
                    <table>
                      <thead>
                        <tr>
                          {Object.keys(snapshot.monthlyTotals).map((month) => (
                            <th key={month} className="money">{month}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {Object.entries(snapshot.monthlyTotals).map(([month, value]) => (
                            <td key={month} className="money">{formatVatu(value)}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                <details style={{ marginTop: 14 }}>
                  <summary className="muted" style={{ cursor: 'pointer' }}>Show raw snapshot JSON</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto', marginTop: 12 }}>{JSON.stringify(snapshot, null, 2)}</pre>
                </details>
              </>
            );
          })()}
        </div>
      )}

      <p className="footer-note">
        This panel reads snapshot records from AuditLog actions beginning with VERSION_SNAPSHOT_. No extra database table is required.
      </p>
    </section>
  );
}
