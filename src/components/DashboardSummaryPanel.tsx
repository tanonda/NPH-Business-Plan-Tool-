'use client';

import { useEffect, useState } from 'react';
import { formatVatu } from '@/lib/business-plan-engine';

type SummaryRow = {
  departmentCode: string;
  departmentName: string;
  status: string;
  planCount: number;
  activityCount: number;
  estimatedCost: number;
  recurrentBudget: number;
  developmentPartners: number;
  unfundedBudget: number;
};

export function DashboardSummaryPanel() {
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [overall, setOverall] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function loadSummary() {
    setLoading(true);
    const res = await fetch('/api/dashboard/summary', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setOverall(data.overall || null);
    }
    setLoading(false);
  }

  useEffect(() => {
    void loadSummary();
  }, []);

  return (
    <section className="panel" style={{ marginTop: 18 }}>
      <div className="actions" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Department Status Dashboard</h2>
          <p className="muted">Totals by department, workflow status, recurrent budget, and unfunded budget.</p>
        </div>
        <button type="button" className="secondary" onClick={() => void loadSummary()}>{loading ? 'Loading...' : 'Refresh'}</button>
      </div>

      {overall && (
        <div className="kpis" style={{ marginTop: 12 }}>
          <div className="kpi"><span>Plans</span><strong>{overall.planCount}</strong></div>
          <div className="kpi"><span>Total estimated</span><strong>{formatVatu(overall.estimatedCost)}</strong></div>
          <div className="kpi"><span>Recurrent</span><strong>{formatVatu(overall.recurrentBudget)}</strong></div>
          <div className="kpi"><span>Unfunded</span><strong>{formatVatu(overall.unfundedBudget)}</strong></div>
        </div>
      )}

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr><th>Department</th><th>Status</th><th>Plans</th><th>Activities</th><th className="money">Estimated</th><th className="money">Recurrent</th><th className="money">Unfunded</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={7}>{loading ? 'Loading...' : 'No dashboard rows yet.'}</td></tr> : rows.map((row) => (
              <tr key={`${row.departmentCode}-${row.status}`}>
                <td><strong>{row.departmentCode}</strong><br /><span className="muted">{row.departmentName}</span></td>
                <td><span className={`badge status-${row.status.toLowerCase()}`}>{row.status}</span></td>
                <td>{row.planCount}</td>
                <td>{row.activityCount}</td>
                <td className="money">{formatVatu(row.estimatedCost)}</td>
                <td className="money">{formatVatu(row.recurrentBudget)}</td>
                <td className="money">{formatVatu(row.unfundedBudget)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
