'use client';

import { useEffect, useState } from 'react';

type Review = {
  id: string;
  entityType: string;
  entityId: string;
  previousStatus: string;
  newStatus: string;
  comment: string;
  snapshot: Record<string, unknown>;
  createdAt: string;
  reviewedBy: { name: string; email: string; role: string };
};

export function GovernanceReviewHistoryPanel() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function load(entityType = filter) {
    setLoading(true);
    const query = entityType ? `?entityType=${encodeURIComponent(entityType)}` : '';
    const response = await fetch(`/api/governance-reviews${query}`, { cache: 'no-store' });
    const data = await response.json().catch(() => []);
    if (!response.ok) setMessage(data.error || 'Could not load governance history.');
    else { setReviews(data); setMessage(''); }
    setLoading(false);
  }

  useEffect(() => { void load(''); }, []);

  return <section className="panel governance-review-history-panel">
    <div className="panel-title-row"><div><p className="eyebrow">Decision record</p><h2>Governance review history</h2><p className="muted">Immutable status transitions and reviewer decisions for strategic pillars, allocations, and job descriptions.</p></div><button className="secondary" type="button" onClick={() => void load()}>{loading ? 'Loading…' : 'Refresh'}</button></div>
    <div className="actions"><label>Record type<select value={filter} onChange={(event) => { setFilter(event.target.value); void load(event.target.value); }}><option value="">All review records</option><option value="PILLAR">Strategic pillars</option><option value="ALLOCATION">Budget allocations</option><option value="JOB_DESCRIPTION">Job descriptions</option></select></label></div>
    {message && <p className="notice" role="status">{message}</p>}
    {reviews.length === 0 && !loading && <p className="muted">No governance reviews have been recorded yet.</p>}
    {reviews.length > 0 && <div className="table-wrap compact-data-table"><table><thead><tr><th>Record</th><th>Transition</th><th>Reviewer</th><th>Comment</th><th>Reviewed</th><th>Snapshot</th></tr></thead><tbody>{reviews.map((review) => <tr key={review.id}><td><strong>{review.entityType.replace('_', ' ')}</strong><br /><span className="muted">{review.entityId}</span></td><td><span className="badge">{review.previousStatus}</span> → <span className="badge">{review.newStatus}</span></td><td>{review.reviewedBy.name}<br /><span className="muted">{review.reviewedBy.role}</span></td><td>{review.comment || 'No comment recorded'}</td><td>{new Date(review.createdAt).toLocaleString()}</td><td><details><summary>View data</summary><pre className="review-snapshot">{JSON.stringify(review.snapshot, null, 2)}</pre></details></td></tr>)}</tbody></table></div>}
  </section>;
}
