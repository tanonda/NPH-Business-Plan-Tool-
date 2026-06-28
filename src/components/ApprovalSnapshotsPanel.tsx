'use client';

import { useEffect, useState } from 'react';

type ApprovalSnapshot = {
  id: string;
  businessPlanId: string;
  snapshotType: string;
  status: string;
  title: string;
  facility?: string | null;
  departmentName?: string | null;
  totalEstimatedCost: number;
  recurrentCost: number;
  unfundedCost: number;
  activityCount: number;
  createdByName?: string | null;
  createdByEmail?: string | null;
  createdAt: string;
};

type Props = {
  planId: string;
  planTitle?: string;
};

function formatAmount(value: number) {
  return new Intl.NumberFormat('en-VU', {
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function snapshotLabel(type: string) {
  if (type === 'REVIEW_SNAPSHOT') return 'Review snapshot';
  if (type === 'APPROVED_SNAPSHOT') return 'Approved snapshot';
  if (type === 'SUBMITTED_SNAPSHOT') return 'Submitted snapshot';
  return type;
}

export function ApprovalSnapshotsPanel({ planId, planTitle }: Props) {
  const [snapshots, setSnapshots] = useState<ApprovalSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function loadSnapshots() {
    if (!planId) return;

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`/api/plans/${planId}/snapshots`, {
        cache: 'no-store'
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Could not load approval snapshots.');
      }

      const data = await res.json();
      setSnapshots(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load approval snapshots.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSnapshots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  return (
    <section className="panel" style={{ marginTop: 18 }}>
      <div className="actions" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Approval Snapshots</h2>
          <p className="muted">
            {planTitle
              ? `Frozen approval records for ${planTitle}.`
              : 'Frozen approval records for this business plan.'}
          </p>
        </div>

        <div className="actions">
          <span className="badge">{snapshots.length} snapshots</span>
          <button type="button" className="secondary" onClick={() => void loadSnapshots()}>
            Refresh
          </button>
        </div>
      </div>

      {message && <p className="muted" style={{ marginTop: 12 }}>{message}</p>}

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>Snapshot</th>
              <th>Status</th>
              <th>Total estimated</th>
              <th>Recurrent</th>
              <th>Unfunded</th>
              <th>Activities</th>
              <th>Created by</th>
              <th>Created</th>
              <th>Export</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9}>Loading snapshots...</td>
              </tr>
            ) : snapshots.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  No approval snapshots yet. Snapshots are created when a plan moves to REVIEW, APPROVED, or SUBMITTED.
                </td>
              </tr>
            ) : (
              snapshots.map((snapshot) => (
                <tr key={snapshot.id}>
                  <td>
                    <strong>{snapshotLabel(snapshot.snapshotType)}</strong>
                    <br />
                    <span className="muted">{snapshot.departmentName || snapshot.facility || ''}</span>
                  </td>
                  <td>
                    <span className="badge">{snapshot.status}</span>
                  </td>
                  <td>{formatAmount(snapshot.totalEstimatedCost)}</td>
                  <td>{formatAmount(snapshot.recurrentCost)}</td>
                  <td>{formatAmount(snapshot.unfundedCost)}</td>
                  <td>{snapshot.activityCount}</td>
                  <td>{snapshot.createdByName || snapshot.createdByEmail || 'Unknown'}</td>
                  <td>{new Date(snapshot.createdAt).toLocaleString()}</td>
                  <td>
                    <div className="actions">
                      <a href={`/api/plans/${planId}/snapshots/${snapshot.id}/export?format=xlsx`}>Excel</a>
                      <a href={`/api/plans/${planId}/snapshots/${snapshot.id}/export?format=pdf`}>PDF</a>
                    </div>
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
