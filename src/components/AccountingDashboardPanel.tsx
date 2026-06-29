'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { formatVatu } from '@/lib/business-plan-engine';

type ReferenceItem = { code?: string; label?: string; description?: string; display?: string; name?: string; category?: string };

type Props = {
  selectedCostCenter?: string;
  selectedPlanId?: string | null;
  year: number;
};

type AccountingRow = {
  costCenterCode: string;
  availableBudget: number;
  planBudget: number;
  commitments: number;
  expenditure: number;
  remainingBudget: number;
};

function percent(value: number, total: number) {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, (value / total) * 100));
}

export function AccountingDashboardPanel({ selectedCostCenter, selectedPlanId, year }: Props) {
  const [rows, setRows] = useState<AccountingRow[]>([]);
  const [message, setMessage] = useState('');
  const [accountCodes, setAccountCodes] = useState<ReferenceItem[]>([]);
  const [costCenters, setCostCenters] = useState<ReferenceItem[]>([]);
  const [commitment, setCommitment] = useState({ lpoNumber: '', supplier: '', description: '', amount: 0, accountCodeText: '', costCenterCode: selectedCostCenter || '' });
  const [expenditure, setExpenditure] = useState({ voucherNumber: '', invoiceNumber: '', supplier: '', description: '', amount: 0, accountCodeText: '', costCenterCode: selectedCostCenter || '' });

  async function load() {
    const res = await fetch(`/api/accounting/summary?year=${year}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setRows(Array.isArray(data.rows) ? data.rows : []);
    }
  }

  useEffect(() => { void load(); }, [year]);
  useEffect(() => {
    const loadReferences = async () => {
      const [accountsRes, centersRes] = await Promise.all([
        fetch('/api/reference?list=account-codes', { cache: 'no-store' }),
        fetch('/api/reference?list=cost-centers', { cache: 'no-store' })
      ]);
      if (accountsRes.ok) setAccountCodes((await accountsRes.json()).items || []);
      if (centersRes.ok) setCostCenters((await centersRes.json()).items || []);
    };
    void loadReferences();
  }, []);
  useEffect(() => {
    setCommitment((current) => ({ ...current, costCenterCode: selectedCostCenter || current.costCenterCode }));
    setExpenditure((current) => ({ ...current, costCenterCode: selectedCostCenter || current.costCenterCode }));
  }, [selectedCostCenter]);

  const totals = useMemo(() => rows.reduce((acc, row) => ({
    availableBudget: acc.availableBudget + row.availableBudget,
    planBudget: acc.planBudget + row.planBudget,
    commitments: acc.commitments + row.commitments,
    expenditure: acc.expenditure + row.expenditure,
    remainingBudget: acc.remainingBudget + row.remainingBudget
  }), { availableBudget: 0, planBudget: 0, commitments: 0, expenditure: 0, remainingBudget: 0 }), [rows]);

  const executionRate = percent(totals.commitments + totals.expenditure, totals.availableBudget);
  const actualRate = percent(totals.expenditure, totals.availableBudget);
  const commitmentRate = percent(totals.commitments, totals.availableBudget);
  const pressureRows = rows.filter((row) => row.remainingBudget < 0 || percent(row.commitments + row.expenditure, row.availableBudget) >= 80);

  async function submitCommitment(event: FormEvent) {
    event.preventDefault();
    const res = await fetch('/api/accounting/commitments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...commitment, businessPlanId: selectedPlanId || undefined })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || 'Could not add commitment. Accounting role may be required.');
      return;
    }
    setMessage('Commitment added.');
    setCommitment({ lpoNumber: '', supplier: '', description: '', amount: 0, accountCodeText: '', costCenterCode: selectedCostCenter || '' });
    await load();
  }

  async function submitExpenditure(event: FormEvent) {
    event.preventDefault();
    const res = await fetch('/api/accounting/expenditures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...expenditure, businessPlanId: selectedPlanId || undefined })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || 'Could not add expenditure. Accounting role may be required.');
      return;
    }
    setMessage('Expenditure added.');
    setExpenditure({ voucherNumber: '', invoiceNumber: '', supplier: '', description: '', amount: 0, accountCodeText: '', costCenterCode: selectedCostCenter || '' });
    await load();
  }

  return (
    <section id="accounting-tracker" className="panel analytics-panel accounting-tracker-panel" style={{ marginTop: 18 }}>
      <div className="panel-title-row">
        <div>
          <h2>Accounting & Spending Tracker</h2>
          <p className="muted">Track LPO/commitments and actual expenditure against approved plans and cost centers.</p>
        </div>
        <button type="button" className="secondary" onClick={() => void load()}>Refresh</button>
      </div>

      <div className="analytics-grid">
        <article className="analytics-card hero-metric">
          <span>Execution rate</span>
          <strong>{executionRate.toFixed(1)}%</strong>
          <div className="progress-track"><span style={{ width: `${executionRate}%` }} /></div>
          <small>Commitments + actual expenditure</small>
        </article>
        <article className="analytics-card"><span>Committed</span><strong>{formatVatu(totals.commitments)}</strong><small>{commitmentRate.toFixed(1)}% of available</small></article>
        <article className="analytics-card"><span>Actual spent</span><strong>{formatVatu(totals.expenditure)}</strong><small>{actualRate.toFixed(1)}% of available</small></article>
        <article className="analytics-card"><span>Remaining</span><strong>{formatVatu(totals.remainingBudget)}</strong><small>{pressureRows.length} pressure point(s)</small></article>
      </div>

      <div className="chart-grid">
        <article className="chart-card">
          <h3>Spending mix</h3>
          <div className="stacked-bar accounting-mix" aria-label="Spending mix">
            <span style={{ width: `${commitmentRate}%` }} title="Commitments" />
            <span style={{ width: `${actualRate}%` }} title="Actual expenditure" />
          </div>
          <div className="chart-legend"><span>Commitments</span><span>Actual expenditure</span><span>Remaining capacity</span></div>
        </article>
        <article className="chart-card recommendation-card">
          <h3>Accounting recommendations</h3>
          <ul>
            {pressureRows.length > 0 && <li>Review {pressureRows.length} cost center(s) with high usage or negative remaining balance.</li>}
            {totals.commitments > totals.expenditure && <li>Follow up open commitments and convert paid LPOs into actual expenditure records.</li>}
            {totals.availableBudget === 0 && <li>Add budget ceilings/allocation data before relying on execution percentages.</li>}
            {pressureRows.length === 0 && totals.availableBudget > 0 && <li>Spending pressure is currently under control.</li>}
          </ul>
        </article>
      </div>

      <details className="collapsible-tool-panel" style={{ marginTop: 14 }}>
        <summary>Add commitment / actual expenditure</summary>
        <div className="grid cols-2 accounting-entry-grid">
          <form className="mini-form" onSubmit={submitCommitment}>
            <h3>Add Commitment / LPO</h3>
            <label>Cost center<select value={commitment.costCenterCode} onChange={(e) => setCommitment({ ...commitment, costCenterCode: e.target.value })}><option value="">Select cost center</option>{commitment.costCenterCode && !costCenters.some((item) => item.code === commitment.costCenterCode || item.display === commitment.costCenterCode) && <option value={commitment.costCenterCode}>{commitment.costCenterCode}</option>}{costCenters.map((item) => <option key={String(item.code || item.display)} value={String(item.code || item.display)}>{String(item.display || `${item.code} - ${item.name || item.label || ""}`)}</option>)}</select></label>
            <label>Account code<select value={commitment.accountCodeText} onChange={(e) => setCommitment({ ...commitment, accountCodeText: e.target.value })}><option value="">Select account code</option>{commitment.accountCodeText && !accountCodes.some((item) => item.display === commitment.accountCodeText) && <option value={commitment.accountCodeText}>{commitment.accountCodeText}</option>}{accountCodes.map((item) => <option key={`${item.category}-${item.code || item.display}-${item.label || item.description}`} value={String(item.display || `${item.code} - ${item.label || item.description || ""}`)}>{String(item.display || `${item.code} - ${item.label || item.description || ""}`)}{item.category ? ` · ${item.category}` : ""}</option>)}</select></label>
            <label>LPO number<input value={commitment.lpoNumber} onChange={(e) => setCommitment({ ...commitment, lpoNumber: e.target.value })} /></label>
            <label>Supplier<input value={commitment.supplier} onChange={(e) => setCommitment({ ...commitment, supplier: e.target.value })} /></label>
            <label>Description<textarea value={commitment.description} onChange={(e) => setCommitment({ ...commitment, description: e.target.value })} /></label>
            <label>Amount<input type="number" value={commitment.amount} onChange={(e) => setCommitment({ ...commitment, amount: Number(e.target.value) })} /></label>
            <button type="submit">Save commitment</button>
          </form>

          <form className="mini-form" onSubmit={submitExpenditure}>
            <h3>Add Actual Expenditure</h3>
            <label>Cost center<select value={expenditure.costCenterCode} onChange={(e) => setExpenditure({ ...expenditure, costCenterCode: e.target.value })}><option value="">Select cost center</option>{expenditure.costCenterCode && !costCenters.some((item) => item.code === expenditure.costCenterCode || item.display === expenditure.costCenterCode) && <option value={expenditure.costCenterCode}>{expenditure.costCenterCode}</option>}{costCenters.map((item) => <option key={String(item.code || item.display)} value={String(item.code || item.display)}>{String(item.display || `${item.code} - ${item.name || item.label || ""}`)}</option>)}</select></label>
            <label>Account code<select value={expenditure.accountCodeText} onChange={(e) => setExpenditure({ ...expenditure, accountCodeText: e.target.value })}><option value="">Select account code</option>{expenditure.accountCodeText && !accountCodes.some((item) => item.display === expenditure.accountCodeText) && <option value={expenditure.accountCodeText}>{expenditure.accountCodeText}</option>}{accountCodes.map((item) => <option key={`${item.category}-${item.code || item.display}-${item.label || item.description}`} value={String(item.display || `${item.code} - ${item.label || item.description || ""}`)}>{String(item.display || `${item.code} - ${item.label || item.description || ""}`)}{item.category ? ` · ${item.category}` : ""}</option>)}</select></label>
            <label>Voucher number<input value={expenditure.voucherNumber} onChange={(e) => setExpenditure({ ...expenditure, voucherNumber: e.target.value })} /></label>
            <label>Invoice number<input value={expenditure.invoiceNumber} onChange={(e) => setExpenditure({ ...expenditure, invoiceNumber: e.target.value })} /></label>
            <label>Supplier<input value={expenditure.supplier} onChange={(e) => setExpenditure({ ...expenditure, supplier: e.target.value })} /></label>
            <label>Description<textarea value={expenditure.description} onChange={(e) => setExpenditure({ ...expenditure, description: e.target.value })} /></label>
            <label>Amount<input type="number" value={expenditure.amount} onChange={(e) => setExpenditure({ ...expenditure, amount: Number(e.target.value) })} /></label>
            <button type="submit">Save expenditure</button>
          </form>
        </div>
      </details>

      {message && <p className="footer-note">{message}</p>}

      <div className="table-wrap compact-data-table" style={{ marginTop: 16 }}>
        <table>
          <thead><tr><th>Cost center</th><th className="money">Available</th><th className="money">Plan</th><th className="money">Commitments</th><th className="money">Actual</th><th className="money">Remaining</th><th>Used</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={7}>No accounting rows yet.</td></tr> : rows.map((row) => {
              const usedPct = percent(row.commitments + row.expenditure, row.availableBudget);
              return (
                <tr key={row.costCenterCode}>
                  <td><strong>{row.costCenterCode}</strong></td>
                  <td className="money">{formatVatu(row.availableBudget)}</td>
                  <td className="money">{formatVatu(row.planBudget)}</td>
                  <td className="money">{formatVatu(row.commitments)}</td>
                  <td className="money">{formatVatu(row.expenditure)}</td>
                  <td className="money">{formatVatu(row.remainingBudget)}</td>
                  <td><span className={usedPct >= 90 ? 'badge status-rejected' : usedPct >= 75 ? 'badge status-review' : 'badge status-approved'}>{usedPct.toFixed(0)}%</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
