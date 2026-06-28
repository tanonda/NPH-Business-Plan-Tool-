'use client';

import { useEffect, useState } from 'react';

type Props = { planId: string; refreshKey?: string | number };

function describeChange(change: any) {
  if (change.type === 'PLAN_FIELD_CHANGED') return `Plan field ${change.field} changed from "${change.before}" to "${change.after}".`;
  if (change.type === 'ACTIVITY_ADDED') return `Activity ${change.activityNumber} was added.`;
  if (change.type === 'ACTIVITY_REMOVED') return `Activity ${change.activityNumber} was removed.`;
  if (change.type === 'ACTIVITY_FIELD_CHANGED') return `Activity ${change.activityNumber}: ${change.field} changed from "${change.before}" to "${change.after}".`;
  return JSON.stringify(change);
}

export function PlanComparisonPanel({ planId, refreshKey }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function loadComparison() {
    setLoading(true);
    const res = await fetch(`/api/plans/${planId}/comparison`, { cache: 'no-store' });
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    void loadComparison();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, refreshKey]);

  return (
    <section className="panel" style={{ marginTop: 18 }}>
      <div className="actions" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Change Comparison</h2>
          <p className="muted">Current plan compared with the latest approved/submitted snapshot.</p>
        </div>
        <button type="button" className="secondary" onClick={() => void loadComparison()}>{loading ? 'Checking...' : 'Refresh'}</button>
      </div>

      {!data ? <p className="muted">No comparison loaded.</p> : !data.hasSnapshot ? (
        <p className="muted">No approved or submitted snapshot exists yet.</p>
      ) : data.changes.length === 0 ? (
        <div className="notice"><strong>No differences found.</strong><p className="muted" style={{ marginBottom: 0 }}>Current plan matches the latest frozen snapshot.</p></div>
      ) : (
        <>
          <div className="kpis" style={{ marginTop: 12 }}>
            <div className="kpi"><span>Added</span><strong>{data.summary.added}</strong></div>
            <div className="kpi"><span>Removed</span><strong>{data.summary.removed}</strong></div>
            <div className="kpi"><span>Changed fields</span><strong>{data.summary.changed}</strong></div>
          </div>
          <div className="stack" style={{ marginTop: 12 }}>
            {data.changes.slice(0, 30).map((change: any, index: number) => (
              <article className="card" key={index}>{describeChange(change)}</article>
            ))}
            {data.changes.length > 30 && <p className="muted">Showing first 30 of {data.changes.length} differences.</p>}
          </div>
        </>
      )}
    </section>
  );
}
