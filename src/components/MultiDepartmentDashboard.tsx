'use client';

import { useMemo, useState } from 'react';
import { formatVatu } from '@/lib/business-plan-engine';

type PlanStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'SUBMITTED';

type PlanSummary = {
  totalEstimatedCost?: number;
  totalRecurrentBudget?: number;
  unfundedCost?: number;
  cashflowTotal?: number;
  activityCount?: number;
};

type PlanLike = {
  id: string;
  title: string;
  organization?: string | null;
  year: number | string;
  facility?: string | null;
  costCenter?: string | null;
  costCenterName?: string | null;
  ceilingAmount?: number | string | null;
  status: PlanStatus;
  updatedAt?: string | null;
  summary?: PlanSummary | null;
  activities?: unknown[];
};

type DepartmentRow = {
  key: string;
  label: string;
  planCount: number;
  activityCount: number;
  totalEstimatedCost: number;
  totalRecurrentBudget: number;
  cashflowTotal: number;
  ceilingAmount: number;
  overCeiling: number;
  statuses: Record<PlanStatus, number>;
  latestUpdatedAt?: string | null;
};

type MultiDepartmentDashboardProps = {
  plans: PlanLike[];
  onLoadPlan?: (planId: string) => void;
};

const STATUSES: PlanStatus[] = ['DRAFT', 'REVIEW', 'APPROVED', 'SUBMITTED'];

function toNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDepartmentKey(plan: PlanLike): string {
  return (
    plan.costCenterName?.trim() ||
    plan.facility?.trim() ||
    plan.organization?.trim() ||
    plan.costCenter?.trim() ||
    'Unassigned Department'
  );
}

function getActivityCount(plan: PlanLike): number {
  return Number(plan.summary?.activityCount ?? plan.activities?.length ?? 0);
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function statusClass(status: PlanStatus): string {
  return `badge status-${status.toLowerCase()}`;
}

export function MultiDepartmentDashboard({ plans, onLoadPlan }: MultiDepartmentDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | PlanStatus>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchesStatus = statusFilter === 'ALL' || plan.status === statusFilter;
      const matchesDepartment = departmentFilter === 'ALL' || getDepartmentKey(plan) === departmentFilter;
      return matchesStatus && matchesDepartment;
    });
  }, [plans, statusFilter, departmentFilter]);

  const departmentNames = useMemo(() => {
    return Array.from(new Set(plans.map(getDepartmentKey))).sort((a, b) => a.localeCompare(b));
  }, [plans]);

  const portfolio = useMemo(() => {
    return filteredPlans.reduce(
      (acc, plan) => {
        acc.planCount += 1;
        acc.activityCount += getActivityCount(plan);
        acc.totalEstimatedCost += toNumber(plan.summary?.totalEstimatedCost);
        acc.totalRecurrentBudget += toNumber(plan.summary?.totalRecurrentBudget);
        acc.cashflowTotal += toNumber(plan.summary?.cashflowTotal);
        acc.ceilingAmount += toNumber(plan.ceilingAmount);
        acc.statuses[plan.status] += 1;
        return acc;
      },
      {
        planCount: 0,
        activityCount: 0,
        totalEstimatedCost: 0,
        totalRecurrentBudget: 0,
        cashflowTotal: 0,
        ceilingAmount: 0,
        statuses: { DRAFT: 0, REVIEW: 0, APPROVED: 0, SUBMITTED: 0 } as Record<PlanStatus, number>
      }
    );
  }, [filteredPlans]);

  const departmentRows = useMemo<DepartmentRow[]>(() => {
    const rows = new Map<string, DepartmentRow>();

    for (const plan of filteredPlans) {
      const key = getDepartmentKey(plan);
      const existing = rows.get(key) || {
        key,
        label: key,
        planCount: 0,
        activityCount: 0,
        totalEstimatedCost: 0,
        totalRecurrentBudget: 0,
        cashflowTotal: 0,
        ceilingAmount: 0,
        overCeiling: 0,
        statuses: { DRAFT: 0, REVIEW: 0, APPROVED: 0, SUBMITTED: 0 },
        latestUpdatedAt: null
      };

      existing.planCount += 1;
      existing.activityCount += getActivityCount(plan);
      existing.totalEstimatedCost += toNumber(plan.summary?.totalEstimatedCost);
      existing.totalRecurrentBudget += toNumber(plan.summary?.totalRecurrentBudget);
      existing.cashflowTotal += toNumber(plan.summary?.cashflowTotal);
      existing.ceilingAmount += toNumber(plan.ceilingAmount);
      existing.statuses[plan.status] += 1;

      if (plan.updatedAt) {
        const currentLatest = existing.latestUpdatedAt ? new Date(existing.latestUpdatedAt).getTime() : 0;
        const candidate = new Date(plan.updatedAt).getTime();
        if (candidate > currentLatest) existing.latestUpdatedAt = plan.updatedAt;
      }

      rows.set(key, existing);
    }

    return Array.from(rows.values())
      .map((row) => ({
        ...row,
        overCeiling: Math.max(0, row.totalEstimatedCost - row.ceilingAmount)
      }))
      .sort((a, b) => b.totalEstimatedCost - a.totalEstimatedCost);
  }, [filteredPlans]);

  const totalOverCeiling = Math.max(0, portfolio.totalEstimatedCost - portfolio.ceilingAmount);
  const utilization = portfolio.ceilingAmount > 0
    ? (portfolio.totalEstimatedCost / portfolio.ceilingAmount) * 100
    : 0;

  return (
    <section className="panel" style={{ marginTop: 18 }}>
      <div className="actions" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h2>Multi-department planning dashboard</h2>
          <p className="muted">
            Portfolio view across saved business plans, departments, approval status, ceiling exposure, and activity volume.
          </p>
        </div>
        <div className="actions">
          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
            <option value="ALL">All departments</option>
            {departmentNames.map((department) => (
              <option value={department} key={department}>{department}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'ALL' | PlanStatus)}>
            <option value="ALL">All statuses</option>
            {STATUSES.map((status) => (
              <option value={status} key={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <section className="kpis" style={{ marginTop: 18 }}>
        <div className="kpi"><span>Plans</span><strong>{portfolio.planCount}</strong></div>
        <div className="kpi"><span>Activities</span><strong>{portfolio.activityCount}</strong></div>
        <div className="kpi"><span>Total estimated</span><strong>{formatVatu(portfolio.totalEstimatedCost)}</strong></div>
        <div className="kpi"><span>Ceiling exposure</span><strong>{formatVatu(totalOverCeiling)}</strong></div>
      </section>

      <div className="grid cols-4" style={{ marginTop: 18 }}>
        {STATUSES.map((status) => (
          <div className="panel" key={status} style={{ padding: 14 }}>
            <span className={statusClass(status)}>{status}</span>
            <strong style={{ display: 'block', fontSize: 28, marginTop: 8 }}>{portfolio.statuses[status]}</strong>
            <p className="muted" style={{ margin: 0 }}>plans</p>
          </div>
        ))}
      </div>

      <div className="panel" style={{ marginTop: 18, padding: 14 }}>
        <div className="actions" style={{ justifyContent: 'space-between' }}>
          <strong>Portfolio ceiling utilization</strong>
          <span className={utilization > 100 ? 'badge status-review' : 'badge status-approved'}>
            {utilization.toFixed(1)}%
          </span>
        </div>
        <div className="progress" aria-label="Portfolio ceiling utilization" style={{ marginTop: 10 }}>
          <span style={{ width: `${Math.min(utilization, 100)}%` }} />
        </div>
        <p className="muted" style={{ marginBottom: 0 }}>
          Estimated cost {formatVatu(portfolio.totalEstimatedCost)} against ceiling {formatVatu(portfolio.ceilingAmount)}.
        </p>
      </div>

      <div className="table-wrap" style={{ marginTop: 18 }}>
        <table>
          <thead>
            <tr>
              <th>Department / Cost centre</th>
              <th>Plans</th>
              <th>Activities</th>
              <th>Status mix</th>
              <th className="money">Estimated</th>
              <th className="money">Ceiling</th>
              <th className="money">Over ceiling</th>
              <th>Latest update</th>
            </tr>
          </thead>
          <tbody>
            {departmentRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="muted">No department data matches the current filters.</td>
              </tr>
            ) : departmentRows.map((row) => (
              <tr key={row.key}>
                <td>
                  <strong>{row.label}</strong>
                </td>
                <td>{row.planCount}</td>
                <td>{row.activityCount}</td>
                <td>
                  <div className="actions" style={{ gap: 6 }}>
                    {STATUSES.filter((status) => row.statuses[status] > 0).map((status) => (
                      <span className={statusClass(status)} key={status} title={status}>
                        {status.slice(0, 1)}:{row.statuses[status]}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="money">{formatVatu(row.totalEstimatedCost)}</td>
                <td className="money">{formatVatu(row.ceilingAmount)}</td>
                <td className="money">{formatVatu(row.overCeiling)}</td>
                <td>{formatDate(row.latestUpdatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-wrap" style={{ marginTop: 18 }}>
        <table>
          <thead>
            <tr>
              <th>Plan</th>
              <th>Department</th>
              <th>Year</th>
              <th>Status</th>
              <th className="money">Estimated</th>
              <th className="money">Cashflow</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlans.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted">No plans match the current filters.</td>
              </tr>
            ) : filteredPlans.map((plan) => (
              <tr key={plan.id}>
                <td>{plan.title}</td>
                <td>{getDepartmentKey(plan)}</td>
                <td>{plan.year}</td>
                <td><span className={statusClass(plan.status)}>{plan.status}</span></td>
                <td className="money">{formatVatu(toNumber(plan.summary?.totalEstimatedCost))}</td>
                <td className="money">{formatVatu(toNumber(plan.summary?.cashflowTotal))}</td>
                <td className="actions">
                  {onLoadPlan && (
                    <button type="button" className="secondary" onClick={() => onLoadPlan(plan.id)}>
                      Edit
                    </button>
                  )}
                  <a href={`/api/plans/${plan.id}/export`}>Export</a>
                  <a href={`/api/plans/${plan.id}/executive-report`} target="_blank" rel="noreferrer">Report</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="footer-note">
        This dashboard uses the saved plans already loaded on the page. Later, department permissions can limit which rows each user sees.
      </p>
    </section>
  );
}
