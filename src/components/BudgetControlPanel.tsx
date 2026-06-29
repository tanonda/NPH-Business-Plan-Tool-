'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { formatVatu } from '@/lib/business-plan-engine';
import { useCurrentUser } from '@/components/useCurrentUser';
import { canManageBudgetCeilings } from '@/lib/access-policy';

type BudgetPosition = {
  costCenterCode: string;
  fiscalYear: number;
  approvedCeiling: number;
  availableBudget: number;
  planBudget: number;
  commitments: number;
  expenditure: number;
  remainingBudget: number;
  varianceToCeiling: number;
  percentUsed: number;
  pendingDonorFunds: number;
  confirmedDonorFunds: number;
  warnings: string[];
};

type Props = {
  selectedCostCenter?: string;
  year: number;
};

function percent(value: number, total: number) {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, (value / total) * 100));
}

function riskLabel(percentUsed: number, warnings: number) {
  if (warnings > 0) return 'Needs attention';
  if (percentUsed >= 90) return 'High usage';
  if (percentUsed >= 75) return 'Watch';
  return 'Healthy';
}

function rowHasBudgetActivity(row: BudgetPosition) {
  return [
    row.approvedCeiling,
    row.availableBudget,
    row.planBudget,
    row.commitments,
    row.expenditure,
    row.pendingDonorFunds,
    row.confirmedDonorFunds
  ].some((value) => Math.abs(Number(value || 0)) > 0);
}

export function BudgetControlPanel({ selectedCostCenter, year }: Props) {
  const [rows, setRows] = useState<BudgetPosition[]>([]);
  const [overall, setOverall] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [ceilingForm, setCeilingForm] = useState({ approvedCeiling: 0, supplementary: 0, virementsIn: 0, virementsOut: 0, restrictedFunds: 0, withdrawnFunds: 0, notes: '' });
  const [message, setMessage] = useState('');
  const { user } = useCurrentUser();
  const canEditBudgetCeiling = canManageBudgetCeilings(user?.role);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/budget/summary?year=${year}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setOverall(data.overall || null);
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, [year]);

  const selected = rows.find((row) => row.costCenterCode === selectedCostCenter);
  const analytics = useMemo(() => {
    const available = Number(overall?.availableBudget || 0);
    const planBudget = Number(overall?.planBudget || 0);
    const commitments = Number(overall?.commitments || 0);
    const expenditure = Number(overall?.expenditure || 0);
    const used = commitments + expenditure;
    const remaining = Number(overall?.remainingBudget || available - planBudget - used);
    const warningCount = rows.reduce((sum, row) => sum + row.warnings.length, 0);
    const overCeilingCount = rows.filter((row) => row.varianceToCeiling < 0 || row.remainingBudget < 0).length;
    return { available, planBudget, commitments, expenditure, used, remaining, warningCount, overCeilingCount, utilization: percent(used + planBudget, available) };
  }, [overall, rows]);

  const recommendations = useMemo(() => {
    const items: string[] = [];
    const activeRows = rows.filter(rowHasBudgetActivity);

    if (activeRows.length === 0) {
      return ['No active budget activity yet. Import/save a plan or enter ceilings to begin budget monitoring.'];
    }

    if (analytics.overCeilingCount > 0) items.push(`${analytics.overCeilingCount} cost center(s) are over ceiling or negative remaining budget.`);
    if (analytics.warningCount > 0) items.push(`${analytics.warningCount} budget warning(s) need review before final clearance.`);
    if (analytics.utilization >= 90) items.push('Budget utilization is above 90%; require finance clearance before new commitments.');
    if (activeRows.some((row) => row.pendingDonorFunds > 0)) items.push('Pending donor funds exist; keep them provisional until confirmed.');
    if (items.length === 0) items.push('Budget position looks healthy. Continue monitoring commitments and actual spending.');
    return items;
  }, [analytics, rows]);

  async function saveCeiling(event: FormEvent) {
    event.preventDefault();
    if (!canEditBudgetCeiling) {
      setMessage('Your role can view budget ceilings but cannot update them. Ask Admin, Finance, or Budget Officer to adjust the ceiling.');
      return;
    }
    const costCenterCode = selectedCostCenter || selected?.costCenterCode || '';
    if (!costCenterCode) {
      setMessage('Select or enter a cost center before saving a ceiling.');
      return;
    }
    const res = await fetch('/api/budget/ceilings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fiscalYear: year, costCenterCode, ...ceilingForm })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || 'Could not update ceiling. Finance/Budget Officer role may be required.');
      return;
    }
    setMessage(`Budget ceiling updated for ${costCenterCode}.`);
    await load();
  }

  return (
    <section id="budget-control" className="panel analytics-panel budget-control-panel" style={{ marginTop: 18 }}>
      <div className="panel-title-row">
        <div>
          <h2>Budget Control</h2>
          <p className="muted">Ministry ceiling, donor impact, available budget, and remaining funds by cost center.</p>
        </div>
        <button type="button" className="secondary" onClick={() => void load()}>{loading ? 'Loading...' : 'Refresh'}</button>
      </div>

      <div className="analytics-grid">
        <article className="analytics-card hero-metric">
          <span>Budget utilization</span>
          <strong>{analytics.utilization.toFixed(1)}%</strong>
          <div className="progress-track"><span style={{ width: `${analytics.utilization}%` }} /></div>
          <small>{riskLabel(analytics.utilization, analytics.warningCount)}</small>
        </article>
        <article className="analytics-card"><span>Available budget</span><strong>{formatVatu(analytics.available)}</strong><small>Approved ceiling + confirmed increases</small></article>
        <article className="analytics-card"><span>Plan budget</span><strong>{formatVatu(analytics.planBudget)}</strong><small>{percent(analytics.planBudget, analytics.available).toFixed(1)}% of available</small></article>
        <article className="analytics-card"><span>Remaining</span><strong>{formatVatu(analytics.remaining)}</strong><small>{analytics.overCeilingCount} over-limit cost center(s)</small></article>
      </div>

      <div className="chart-grid">
        <article className="chart-card">
          <h3>Funding composition</h3>
          <div className="stacked-bar" aria-label="Funding composition">
            <span style={{ width: `${percent(analytics.planBudget, analytics.available)}%` }} title="Plan budget" />
            <span style={{ width: `${percent(analytics.commitments, analytics.available)}%` }} title="Commitments" />
            <span style={{ width: `${percent(analytics.expenditure, analytics.available)}%` }} title="Actual expenditure" />
          </div>
          <div className="chart-legend"><span>Plan</span><span>Commitments</span><span>Actual</span></div>
        </article>
        <article className="chart-card recommendation-card">
          <h3>Budget recommendations</h3>
          <ul>{recommendations.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
      </div>

      <details className="collapsible-tool-panel" style={{ marginTop: 14 }}>
        <summary>{canEditBudgetCeiling ? 'Update Ministry / Department Ceiling' : 'View Ministry / Department Ceiling Controls'}</summary>
        {!canEditBudgetCeiling && <p className="muted" style={{ marginTop: 10 }}>Ceiling updates are locked for this role. Admin, Finance, or Budget Officer can update approved ceiling, supplementary allocation, virements, and restrictions.</p>}
        <form className="mini-form" onSubmit={saveCeiling}>
          <fieldset disabled={!canEditBudgetCeiling} className="form-lock-fieldset nested-fieldset">
            <div className="grid cols-4">
              <label>Approved ceiling<input type="number" value={ceilingForm.approvedCeiling} onChange={(e) => setCeilingForm({ ...ceilingForm, approvedCeiling: Number(e.target.value) })} /></label>
              <label>Supplementary allocation<input type="number" value={ceilingForm.supplementary} onChange={(e) => setCeilingForm({ ...ceilingForm, supplementary: Number(e.target.value) })} /></label>
              <label>Virements in<input type="number" value={ceilingForm.virementsIn} onChange={(e) => setCeilingForm({ ...ceilingForm, virementsIn: Number(e.target.value) })} /></label>
              <label>Virements out<input type="number" value={ceilingForm.virementsOut} onChange={(e) => setCeilingForm({ ...ceilingForm, virementsOut: Number(e.target.value) })} /></label>
              <label>Restricted funds<input type="number" value={ceilingForm.restrictedFunds} onChange={(e) => setCeilingForm({ ...ceilingForm, restrictedFunds: Number(e.target.value) })} /></label>
              <label>Withdrawn/reduced funds<input type="number" value={ceilingForm.withdrawnFunds} onChange={(e) => setCeilingForm({ ...ceilingForm, withdrawnFunds: Number(e.target.value) })} /></label>
              <label>Notes<input value={ceilingForm.notes} onChange={(e) => setCeilingForm({ ...ceilingForm, notes: e.target.value })} /></label>
              <label>Action<button type="submit">Save ceiling</button></label>
            </div>
          </fieldset>
          {message && <p className="footer-note">{message}</p>}
        </form>
      </details>

      {selected && selected.warnings.length > 0 && (
        <div className="notice warn" style={{ marginTop: 14 }}>
          <strong>{selected.costCenterCode} budget warnings</strong>
          <ul>{selected.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
        </div>
      )}

      <div className="table-wrap compact-data-table" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>Cost center</th>
              <th className="money">Ceiling</th>
              <th className="money optional-laptop">Donor</th>
              <th className="money">Available</th>
              <th className="money">Plan</th>
              <th className="money optional-laptop">Committed</th>
              <th className="money">Actual</th>
              <th className="money">Remaining</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={9}>{loading ? 'Loading...' : 'No budget control rows yet.'}</td></tr> : rows.map((row) => (
              <tr key={row.costCenterCode}>
                <td><strong>{row.costCenterCode}</strong><br /><span className="muted">{row.percentUsed.toFixed(1)}% used</span></td>
                <td className="money">{formatVatu(row.approvedCeiling)}</td>
                <td className="money optional-laptop">{formatVatu(row.confirmedDonorFunds + row.pendingDonorFunds)}</td>
                <td className="money">{formatVatu(row.availableBudget)}</td>
                <td className="money">{formatVatu(row.planBudget)}</td>
                <td className="money optional-laptop">{formatVatu(row.commitments)}</td>
                <td className="money">{formatVatu(row.expenditure)}</td>
                <td className="money">{formatVatu(row.remainingBudget)}</td>
                <td>{row.warnings.length ? <span className="badge status-rejected">{row.warnings.length} issue(s)</span> : <span className="badge status-approved">OK</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
