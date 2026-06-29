'use client';

import { UserSessionBar } from '@/components/UserSessionBar';
import { UserManagementPanel } from '@/components/UserManagementPanel';
import { RoleAccessTestPanel } from '@/components/RoleAccessTestPanel';
import { useCurrentUser } from '@/components/useCurrentUser';
import { FormEvent, ChangeEvent, useEffect, useMemo, useState } from 'react';
import { allocateMonthly, formatVatu, MONTHS, summarizePlan } from '@/lib/business-plan-engine';
import { ExecutiveReportButton } from '@/components/ExecutiveReportButton';
import { AuthGate } from '@/components/AuthGate';
import { ApprovalCommentsPanel } from '@/components/ApprovalCommentsPanel';
import { ApprovalSnapshotsPanel } from '@/components/ApprovalSnapshotsPanel';
import { DashboardSummaryPanel } from '@/components/DashboardSummaryPanel';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { PasswordChangePanel } from '@/components/PasswordChangePanel';
import { PlanComparisonPanel } from '@/components/PlanComparisonPanel';
import { AccountingDashboardPanel } from '@/components/AccountingDashboardPanel';
import { BudgetControlPanel } from '@/components/BudgetControlPanel';
import { ThemeToggle } from '@/components/ThemeToggle';
import { canManageBudgetCeilings } from '@/lib/access-policy';

type Status = 'DRAFT' | 'REVIEW' | 'RETURNED' | 'BUDGET_REVIEW' | 'FINANCE_REVIEW' | 'BUDGET_CLEARED' | 'APPROVED' | 'SUBMITTED' | 'EXECUTION' | 'REJECTED' | 'LOCKED';

type ActivityInput = {
  subProgram: string;
  corporatePlanKeyActivity: string;
  outputOrServiceTarget: string;
  targetForYear: string;
  responsibility: string;
  activityNumber: string;
  activityDescription: string;
  jobCode: string;
  expenditureDescription: string;
  estimatedCost: number;
  recurrentBudget: number;
  developmentPartners: number;
  q1: boolean;
  q2: boolean;
  q3: boolean;
  q4: boolean;
  funding: string;
  budgetCategory: string;
  accountCode: string;
  costCenterCode: string;
  nsdpTarget: string;
  activityCategory: string;
  fundingSourceId?: string | null;
  approvedBudget: number;
  sortOrder: number;
};

type Department = { id: string; code: string; name: string; costCenter?: string | null; costCenterName?: string | null };
type ReferenceItem = { code?: string; label?: string; description?: string; display?: string; category?: string; name?: string; jobCode?: string; costCenterCode?: string; costCenterName?: string };
type ReferenceData = { fundingSources: ReferenceItem[]; budgetCategories: ReferenceItem[]; accountCodes: ReferenceItem[]; activityCategories: ReferenceItem[]; nsdpTargets: ReferenceItem[]; departments: ReferenceItem[]; jobCodes: ReferenceItem[]; costCenters: ReferenceItem[] };

type Plan = {
  id: string;
  title: string;
  organization: string;
  year: number;
  facility: string;
  costCenter: string;
  costCenterName: string;
  departmentId?: string | null;
  ceilingAmount: string | number;
  ceilingJustification?: string;
  status: Status;
  updatedAt?: string;
  activities: ActivityInput[];
  summary?: ReturnType<typeof summarizePlan>;
};

type AuditLog = {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  user?: { name: string; email: string } | null;
};

const emptyActivity = (sortOrder: number): ActivityInput => ({
  subProgram: 'Management & Administration',
  corporatePlanKeyActivity: '',
  outputOrServiceTarget: '',
  targetForYear: '',
  responsibility: '',
  activityNumber: `RB${String(sortOrder).padStart(2, '0')}`,
  activityDescription: '',
  jobCode: '611180 VCH Administration',
  expenditureDescription: '',
  estimatedCost: 0,
  recurrentBudget: 0,
  developmentPartners: 0,
  q1: true,
  q2: true,
  q3: true,
  q4: true,
  funding: 'Recurrent',
  budgetCategory: 'Admin',
  accountCode: '',
  costCenterCode: '611180',
  nsdpTarget: '',
  activityCategory: '',
  fundingSourceId: null,
  approvedBudget: 0,
  sortOrder
});

function normalizeActivity(activity: any, index: number): ActivityInput {
  return {
    subProgram: activity.subProgram || '',
    corporatePlanKeyActivity: activity.corporatePlanKeyActivity || '',
    outputOrServiceTarget: activity.outputOrServiceTarget || '',
    targetForYear: activity.targetForYear || '',
    responsibility: activity.responsibility || '',
    activityNumber: activity.activityNumber || `RB${String(index + 1).padStart(2, '0')}`,
    activityDescription: activity.activityDescription || '',
    jobCode: activity.jobCode || '',
    expenditureDescription: activity.expenditureDescription || '',
    estimatedCost: Number(activity.estimatedCost || 0),
    recurrentBudget: Number(activity.recurrentBudget || activity.estimatedCost || 0),
    developmentPartners: Number(activity.developmentPartners || 0),
    q1: Boolean(activity.q1),
    q2: Boolean(activity.q2),
    q3: Boolean(activity.q3),
    q4: Boolean(activity.q4),
    funding: activity.funding || 'Recurrent',
    budgetCategory: activity.budgetCategory || 'Admin',
    accountCode: activity.accountCode || '',
    costCenterCode: activity.costCenterCode || '',
    nsdpTarget: activity.nsdpTarget || '',
    activityCategory: activity.activityCategory || '',
    fundingSourceId: activity.fundingSourceId || null,
    approvedBudget: Number(activity.approvedBudget || activity.recurrentBudget || activity.estimatedCost || 0),
    sortOrder: Number(activity.sortOrder || index + 1)
  };
}

export default function HomePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [referenceData, setReferenceData] = useState<ReferenceData>({ fundingSources: [], budgetCategories: [], accountCodes: [], activityCategories: [], nsdpTargets: [], departments: [], jobCodes: [], costCenters: [] });
  const [comparisonRefreshKey, setComparisonRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedSavedPlanIds, setSelectedSavedPlanIds] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>('DRAFT');
  const [title, setTitle] = useState('VNH ED 2026 Business Plan');
  const [organization, setOrganization] = useState('Ministry of Health');
  const [year, setYear] = useState(2026);
  const [facility, setFacility] = useState('Vila Central Hospital');
  const [costCenter, setCostCenter] = useState('61RB');
  const [costCenterName, setCostCenterName] = useState('Vila Central Hospital');
  const [departmentId, setDepartmentId] = useState('');
  const [ceilingAmount, setCeilingAmount] = useState(283739303);
  const [ceilingJustification, setCeilingJustification] = useState('');
  const [activities, setActivities] = useState<ActivityInput[]>([emptyActivity(1)]);
  const [message, setMessage] = useState('');
  const [importing, setImporting] = useState(false);
  const [suggestingIndex, setSuggestingIndex] = useState<number | null>(null);

  const { user } = useCurrentUser();
  const role = user?.role || 'VIEWER';

  const canEditPlan =
    role === 'ADMIN' || (role === 'PLANNER' && (status === 'DRAFT' || status === 'RETURNED'));
  const canDeletePlan = role === 'ADMIN';
  const canImport = role === 'ADMIN' || role === 'PLANNER';
  const canViewBudgetControl = ['ADMIN', 'FINANCE', 'BUDGET_OFFICER', 'DONOR_MANAGER'].includes(role);
  const canEditBudgetCeiling = canManageBudgetCeilings(role);
  const canViewAccounting = ['ADMIN', 'ACCOUNTING', 'FINANCE', 'BUDGET_OFFICER'].includes(role);

  const planLockedForUser = Boolean(selectedPlanId) && !canEditPlan;

  const planLockMessage =
    role === 'ADMIN'
      ? ''
      : status === 'REVIEW'
        ? 'This plan is under review and locked from normal editing.'
        : status === 'BUDGET_REVIEW'
          ? 'This plan is with accounting for budget availability review.'
          : status === 'FINANCE_REVIEW'
            ? 'This plan is with finance for budget clearance.'
            : status === 'BUDGET_CLEARED'
              ? 'This plan has budget clearance and is awaiting final approval.'
              : status === 'APPROVED'
          ? 'This plan is approved and locked from normal editing.'
          : status === 'SUBMITTED'
            ? 'This plan is submitted and fully locked.'
            : role !== 'PLANNER'
              ? 'Your role can view this plan but cannot edit plan content.'
              : '';
  const canSuggestDescriptions =
    role === 'ADMIN' || role === 'PLANNER' || role === 'APPROVER' || role === 'REVIEWER';

  const allowedStatusTransitions = (() => {
    if (role === 'ADMIN') {
      return (['DRAFT', 'REVIEW', 'RETURNED', 'APPROVED', 'SUBMITTED', 'REJECTED'] as Status[]).filter((item) => item !== status);
    }

    if (role === 'PLANNER' && (status === 'DRAFT' || status === 'RETURNED')) {
      return ['REVIEW'] as Status[];
    }

    if (role === 'APPROVER' && status === 'REVIEW') {
      return ['APPROVED', 'RETURNED', 'REJECTED'] as Status[];
    }

    if (role === 'APPROVER' && status === 'APPROVED') {
      return ['SUBMITTED'] as Status[];
    }

    return [] as Status[];
  })();

  const canChangeStatus = allowedStatusTransitions.length > 0;

  const optionLabel = (item: ReferenceItem) => item.display || item.label || item.name || item.description || item.code || '';
  const accountOptions = referenceData.accountCodes;

  async function loadReferenceData() {
    const fetchList = async (list: string) => {
      const res = await fetch(`/api/reference?list=${list}`, { cache: 'no-store' });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data.items) ? data.items : [];
    };
    const [fundingSources, budgetCategories, accountCodes, activityCategories, nsdpTargets, refDepartments, jobCodes, costCenters] = await Promise.all([
      fetchList('funding-sources'),
      fetchList('budget-categories'),
      fetchList('account-codes'),
      fetchList('activity-categories'),
      fetchList('nsdp-targets'),
      fetchList('departments'),
      fetchList('job-codes'),
      fetchList('cost-centers')
    ]);
    setReferenceData({ fundingSources, budgetCategories, accountCodes, activityCategories, nsdpTargets, departments: refDepartments, jobCodes, costCenters });
  }

  async function createReferenceItem(list: string, defaults: Partial<ReferenceItem> = {}, afterCreate?: (item: ReferenceItem) => void) {
    const code = prompt(`Enter code for new ${list.replace('-', ' ')}`, defaults.code || '');
    if (code === null) return;
    const label = prompt(`Enter description/name for ${code || 'new item'}`, defaults.label || defaults.name || defaults.description || '');
    if (label === null) return;
    const category = defaults.category || (list === 'account-codes' ? prompt('Enter budget category for this account code', 'Other Codes Not Listed') || 'Other Codes Not Listed' : '');
    const display = defaults.display || (code.trim() && label.trim() ? `${code.trim()} - ${label.trim()}` : label.trim() || code.trim());
    const res = await fetch('/api/reference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ list, code: code.trim(), label: label.trim(), description: label.trim(), category, display })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || `Could not create ${list} item.`);
      return;
    }
    const data = await res.json();
    await loadReferenceData();
    const created = data.item || { code, label, description: label, category, display };
    afterCreate?.(created);
    setMessage(`Added ${display} to ${list.replace('-', ' ')}.`);
  }

  async function refresh() {
    setLoading(true);
    const res = await fetch('/api/plans', { cache: 'no-store' });
    const data = await res.json();
    setPlans(data);
    const deptRes = await fetch('/api/departments', { cache: 'no-store' });
    if (deptRes.ok) setDepartments(await deptRes.json());
    setLoading(false);
  }

  useEffect(() => { refresh(); void loadReferenceData(); }, []);

  const summary = useMemo(() => summarizePlan(activities), [activities]);
  const ceilingVariance = summary.totalEstimatedCost - Number(ceilingAmount || 0);
  const isOverCeiling = Number(ceilingAmount || 0) > 0 && ceilingVariance > 0;
  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === selectedPlanId), [plans, selectedPlanId]);

  function canEditRowPlan(plan: Plan) {
    return role === 'ADMIN' || (role === 'PLANNER' && (plan.status === 'DRAFT' || plan.status === 'RETURNED'));
  }

  function updateActivity(index: number, patch: Partial<ActivityInput>) {
    setActivities((current) => current.map((activity, i) => i === index ? { ...activity, ...patch } : activity));
  }

  function addActivity() {
    setActivities((current) => [...current, emptyActivity(current.length + 1)]);
  }

  function removeActivity(index: number) {
    setActivities((current) => current.filter((_, i) => i !== index).map((a, i) => ({ ...a, sortOrder: i + 1 })));
  }

  function clearForm() {
    setSelectedPlanId(null);
    setStatus('DRAFT');
    setTitle('VNH ED 2026 Business Plan');
    setOrganization('Ministry of Health');
    setYear(2026);
    setFacility('Vila Central Hospital');
    setCostCenter('61RB');
    setCostCenterName('Vila Central Hospital');
    setDepartmentId('');
    setCeilingAmount(283739303);
    setCeilingJustification('');
    setActivities([emptyActivity(1)]);
    setAuditLogs([]);
    setMessage('New draft ready.');
  }

  async function loadPlan(planId: string) {
    const res = await fetch(`/api/plans/${planId}`, { cache: 'no-store' });
    if (!res.ok) {
      setMessage('Could not load that plan.');
      return;
    }
    const plan: Plan = await res.json();
    setSelectedPlanId(plan.id);
    setStatus(plan.status);
    setTitle(plan.title);
    setOrganization(plan.organization || 'Ministry of Health');
    setYear(Number(plan.year));
    setFacility(plan.facility);
    setCostCenter(plan.costCenter);
    setCostCenterName(plan.costCenterName);
    setDepartmentId(plan.departmentId || '');
    setCeilingAmount(Number(plan.ceilingAmount || 0));
    setCeilingJustification(plan.ceilingJustification || '');
    setActivities((plan.activities || []).map(normalizeActivity));
    setMessage(`Loaded ${plan.title}.`);
    await loadAudit(plan.id);
  }

  async function loadAudit(planId: string) {
    const res = await fetch(`/api/plans/${planId}/audit`, { cache: 'no-store' });
    if (res.ok) setAuditLogs(await res.json());
  }

  async function savePlan(event: FormEvent) {
    event.preventDefault();
    if (!canEditPlan) {
      setMessage('Your role does not allow saving or editing business plans.');
      return;
    }

    const cleanActivities = activities.map((activity, index) => ({ ...activity, sortOrder: index + 1 }));
    const departmentIdForSave = departmentId || departments.find((department) => department.costCenter === costCenter)?.id || '';

    if (!departmentId && departmentIdForSave) {
      setDepartmentId(departmentIdForSave);
    }

    setMessage(selectedPlanId ? 'Updating business plan...' : 'Saving business plan...');
    const res = await fetch(selectedPlanId ? `/api/plans/${selectedPlanId}` : '/api/plans', {
      method: selectedPlanId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, organization, year, facility, costCenter, costCenterName, departmentId: departmentIdForSave || null, ceilingAmount, ceilingJustification, activities: cleanActivities })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const issueText = Array.isArray(err.issues) ? ` ${err.issues.slice(0, 3).map((issue: any) => issue.message).join(' ')}` : '';
      setMessage((err.error || 'Could not save plan. Check required activity and expenditure descriptions.') + issueText);
      return;
    }
    const saved = await res.json();
    setSelectedPlanId(saved.id);
    setStatus(saved.status);
    setMessage('Saved. Dashboard, audit history, and Excel/PDF export are ready.');
    setComparisonRefreshKey((value) => value + 1);
    await refresh();
    await loadAudit(saved.id);
  }

  async function changeStatus(nextStatus: Status) {
    if (!canChangeStatus) {
      setMessage('Your role does not allow changing approval status.');
      return;
    }

    if (!selectedPlanId) {
      setMessage('Save the plan first before changing approval status.');
      return;
    }
    if (nextStatus === 'REVIEW' && isOverCeiling && !ceilingJustification.trim()) {
      setMessage('This plan is over the budget ceiling. Add an over-ceiling justification before submitting for review.');
      return;
    }
    const res = await fetch(`/api/plans/${selectedPlanId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus, reason: ['RETURNED', 'REJECTED', 'DRAFT'].includes(nextStatus) ? prompt('Reason for returning/rejecting this plan?') || '' : '' })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const issueText = Array.isArray(err.issues) ? ` ${err.issues.slice(0, 3).map((issue: any) => issue.message).join(' ')}` : '';
      setMessage((err.error || 'Could not update status.') + issueText);
      return;
    }
    setStatus(nextStatus);
    setMessage(`Status changed to ${nextStatus}.`);
    setComparisonRefreshKey((value) => value + 1);
    await refresh();
    await loadAudit(selectedPlanId);
  }

  async function importExcel(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!canImport) {
      setMessage('Your role does not allow importing Excel workbooks.');
      event.target.value = '';
      return;
    }

    setImporting(true);
    setMessage('Importing Excel workbook...');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/import-excel', { method: 'POST', body: formData });
    setImporting(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || 'Import failed. Make sure this is a compatible 61RB workbook.');
      return;
    }
    const imported = await res.json();
    setSelectedPlanId(null);
    setStatus('DRAFT');
    setTitle(imported.title || title);
    setYear(Number(imported.year || year));
    setFacility(imported.facility || facility);
    setCostCenter(imported.costCenter || costCenter);
    setCostCenterName(imported.costCenterName || costCenterName);
    setDepartmentId(imported.departmentId || '');
    setCeilingAmount(Number(imported.ceilingAmount || ceilingAmount));
    setCeilingJustification(imported.ceilingJustification || '');
    setActivities((imported.activities || []).map(normalizeActivity));
    setAuditLogs([]);
    setMessage(`Imported ${imported.activities?.length || 0} activities. Review, then save as a new plan.`);
    event.target.value = '';
  }

  async function deleteSelectedPlan() {
    if (!canDeletePlan) {
      setMessage('Only an ADMIN can delete saved business plans.');
      return;
    }

    if (!selectedPlanId) return;
    if (!confirm('Delete this saved business plan?')) return;
    const res = await fetch(`/api/plans/${selectedPlanId}`, { method: 'DELETE' });
    if (res.ok) {
      clearForm();
      await refresh();
      setMessage('Plan deleted.');
    }
  }

  function toggleSavedPlanSelection(planId: string) {
    setSelectedSavedPlanIds((current) =>
      current.includes(planId) ? current.filter((id) => id !== planId) : [...current, planId]
    );
  }

  function toggleAllSavedPlans() {
    setSelectedSavedPlanIds((current) => current.length === plans.length ? [] : plans.map((plan) => plan.id));
  }

  async function deleteSelectedSavedPlans() {
    if (!canDeletePlan) {
      setMessage('Only an ADMIN can delete saved business plans.');
      return;
    }

    if (selectedSavedPlanIds.length === 0) return;
    if (!confirm(`Delete ${selectedSavedPlanIds.length} selected saved plan(s)?`)) return;

    for (const planId of selectedSavedPlanIds) {
      await fetch(`/api/plans/${planId}`, { method: 'DELETE' });
    }

    if (selectedSavedPlanIds.includes(selectedPlanId || '')) clearForm();
    setSelectedSavedPlanIds([]);
    await refresh();
    setMessage('Selected saved plans deleted.');
  }



  function transitionLabel(nextStatus: Status) {
    if (status === 'DRAFT' && nextStatus === 'REVIEW') return 'Submit for Review';
    if (status === 'RETURNED' && nextStatus === 'REVIEW') return 'Resubmit for Review';
    if (status === 'REVIEW' && nextStatus === 'APPROVED') return 'Approve';
    if (status === 'APPROVED' && nextStatus === 'SUBMITTED') return 'Submit Final';
    if (nextStatus === 'RETURNED') return 'Return to Planner';
    if (nextStatus === 'REJECTED') return 'Reject';
    if (role === 'ADMIN') return `Move to ${nextStatus}`;
    return `Move to ${nextStatus}`;
  }

  async function suggestExpenditureDescription(index: number, operation: 'create' | 'optimize' = 'create') {
    const activity = activities[index];
    if (!activity) return;

    if (operation === 'create' && !activity.activityDescription.trim()) {
      setMessage('Add an activity description first, then I can suggest the expenditure description.');
      return;
    }
    if (operation === 'optimize' && !activity.expenditureDescription.trim()) {
      setMessage('Write or generate an expenditure description first, then I can optimize it.');
      return;
    }

    setSuggestingIndex(index);
    setMessage(`${operation === 'optimize' ? 'Optimizing' : 'Generating'} expenditure description for ${activity.activityNumber || `activity ${index + 1}`}...`);

    try {
      const res = await fetch('/api/expenditure-description-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity, operation })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'The description helper could not generate a suggestion.');
      }

      const data = await res.json();
      const suggestion = Array.isArray(data.suggestions) ? data.suggestions[0] : data;
      const suggestedDescription = suggestion?.suggestedDescription || suggestion?.description || '';

      if (!suggestedDescription) {
        throw new Error('The helper returned no description.');
      }

      updateActivity(index, { expenditureDescription: suggestedDescription });
      const source = suggestion?.source === 'openai' ? 'AI' : 'local rules';
      setMessage(`${operation === 'optimize' ? 'Optimized' : 'Suggested'} expenditure description added for ${activity.activityNumber || `activity ${index + 1}`} using ${source}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not generate expenditure description.');
    } finally {
      setSuggestingIndex(null);
    }
  }

  return (
    <AuthGate>
      <div className="app-shell">
        <aside className="app-sidebar">
          <div className="brand-block">
            <div className="brand-mark">VNH</div>
            <div>
              <strong>Business Plan</strong>
              <span>Budget Control Platform</span>
            </div>
          </div>
          <nav className="side-nav" aria-label="Main navigation">
            <a href="#dashboard">Dashboard</a>
            <a href="#budget-control">Budget Control</a>
            <a href="#accounting-tracker">Accounting</a>
            <a href="#plan-workflow">Workflow</a>
            <a href="#plan-form">Plan Form</a>
            <a href="#activities">Activities</a>
            <a href="#cashflow">Cashflow</a>
            <a href="#saved-plans">Saved Plans</a>
            <a href="#notifications">Notifications</a>
            <a href="#audit">Audit & Snapshots</a>
            <a href="#profile-admin">Profile/Admin</a>
          </nav>
          <div className="sidebar-footer">
            <ThemeToggle />
            <p>VNH ED · 2026 Planning</p>
          </div>
        </aside>
        <main className="app-main">
          <div className="mobile-topbar">
            <div className="brand-block compact"><div className="brand-mark">VNH</div><strong>Business Plan</strong></div>
            <ThemeToggle />
          </div>
          <div className="container">
        <UserSessionBar />
        <div id="dashboard"></div>
        <DashboardSummaryPanel />
        <NotificationsPanel mode="summary" />
        {canViewBudgetControl && <BudgetControlPanel selectedCostCenter={costCenter} year={year} />}
        {canViewAccounting && <AccountingDashboardPanel selectedCostCenter={costCenter} year={year} selectedPlanId={selectedPlanId} />}

        <section className="hero plan-hero">
        <div>
          <h1>Business Plan Tool</h1>
          <p>
            Build VNH-style annual business plans, edit saved plans, import existing Excel workbooks,
            track approval status, audit changes, and export the corrected 61RB workbook or PDF.
          </p>
        </div>
        <div className="hero-badges">
          <span className={`badge status-${status.toLowerCase()}`}>{status}</span>
          <span className={`badge ${summary.isBalanced ? 'good' : 'warn'}`}>{summary.isBalanced ? 'Balanced' : 'Needs review'}</span>
        </div>
      </section>

      <section className="kpis">
        <div className="kpi"><span>Total estimated cost</span><strong>{formatVatu(summary.totalEstimatedCost)}</strong></div>
        <div className="kpi"><span>Recurrent budget</span><strong>{formatVatu(summary.totalRecurrentBudget)}</strong></div>
        <div className="kpi"><span>Unfunded</span><strong>{formatVatu(summary.unfundedCost)}</strong></div>
        <div className="kpi"><span>Cashflow total</span><strong>{formatVatu(summary.cashflowTotal)}</strong></div>
        <div className={`kpi ${isOverCeiling ? 'warn' : 'good'}`}><span>Ceiling variance</span><strong>{isOverCeiling ? `Over by ${formatVatu(ceilingVariance)}` : 'Within ceiling'}</strong></div>
      </section>

      <section id="plan-workflow" className="panel workflow-panel">
        <div>
          <h2>Workflow</h2>
          <p className="muted">Current plan: {selectedPlan ? selectedPlan.title : 'Unsaved draft'}</p>
        </div>
        <div className="actions">
          <button type="button" className="secondary" onClick={clearForm}>New plan</button>
          {canChangeStatus && allowedStatusTransitions.map((s) => (
            <button type="button" key={s} className="secondary" onClick={() => changeStatus(s)}>
              {transitionLabel(s)}
            </button>
          ))}
          {selectedPlanId && <a className="button-link" href={`/api/plans/${selectedPlanId}/export?format=xlsx`}>Download Excel</a>}
          {selectedPlanId && <a className="button-link" href={`/api/plans/${selectedPlanId}/export?format=pdf`}>Download PDF</a>}
          {selectedPlan?.id && (
            <ExecutiveReportButton
              planId={selectedPlan.id}
              planTitle={selectedPlan.title}
            />
          )}
          {canDeletePlan && selectedPlanId && <button type="button" className="danger" onClick={deleteSelectedPlan}>Delete</button>}
        </div>
      </section>

      <form id="plan-form" onSubmit={savePlan} className="grid">
        {planLockedForUser && <section className="panel locked-banner"><strong>Plan locked:</strong> <span>{planLockMessage}</span></section>}
        <fieldset disabled={!canEditPlan} className="form-lock-fieldset">
        <section className="panel">
          <h2>Plan setup</h2>
          <div className="grid cols-4">
            <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
            <label>Organization<input value={organization} onChange={(e) => setOrganization(e.target.value)} /></label>
            <label>Year<input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} /></label>
            <label>Cost center<select value={costCenter} onChange={(e) => { const value = e.target.value; setCostCenter(value); const selected = referenceData.costCenters.find((item) => item.code === value || item.display === value); if (selected?.name || selected?.label) setCostCenterName(String(selected.name || selected.label)); }}><option value="">Select cost center</option>{costCenter && !referenceData.costCenters.some((item) => item.code === costCenter || item.display === costCenter) && <option value={costCenter}>{costCenter}</option>}{referenceData.costCenters.map((item) => (<option key={String(item.code || item.display)} value={String(item.code || item.display)}>{String(item.display || `${item.code} - ${item.name || item.label || ''}`)}</option>))}</select>{canEditPlan && <button type="button" className="secondary mini-button" onClick={() => void createReferenceItem('cost-centers', { code: costCenter, label: costCenterName }, (item) => { setCostCenter(String(item.code || item.display || '')); setCostCenterName(String(item.label || item.name || item.description || '')); })}>Add missing cost center</button>}</label>
            <label>Ceiling amount<input type="number" value={ceilingAmount} disabled={!canEditBudgetCeiling} readOnly={!canEditBudgetCeiling} title={canEditBudgetCeiling ? 'You can set the approved ceiling for this plan.' : 'Ceiling is controlled by ADMIN, FINANCE, or BUDGET_OFFICER. Planners can justify over-ceiling requests but cannot change this value.'} onChange={(e) => { if (canEditBudgetCeiling) setCeilingAmount(Number(e.target.value)); }} />{!canEditBudgetCeiling && <small className="field-hint">Locked: budget ceiling is set by Admin, Finance, or Budget Officer. Use the justification field for over-ceiling requests.</small>}</label>
            <label>Facility<input value={facility} onChange={(e) => setFacility(e.target.value)} /></label>
            <label>Cost center name<input value={costCenterName} onChange={(e) => setCostCenterName(e.target.value)} /></label>
            <label className="wide-field">Over-ceiling justification<textarea value={ceilingJustification} onChange={(e) => setCeilingJustification(e.target.value)} placeholder="Required before submitting for review when estimated cost exceeds the ceiling. Explain why the activity is needed, what funds may cover it, and whether it should be referred for future budget." /></label>
            <label>Department
              <select value={departmentId} onChange={(e) => {
                  const nextDepartmentId = e.target.value;
                  setDepartmentId(nextDepartmentId);
                  if (nextDepartmentId) setMessage('Department selected. You can save this plan.');
                  const selected = departments.find((department) => department.id === nextDepartmentId);
                  if (selected?.costCenter) setCostCenter(selected.costCenter);
                  if (selected?.costCenterName) setCostCenterName(selected.costCenterName);
                }}>
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>{department.code} — {department.name}</option>
                ))}
              </select>
            </label>
            {canImport && <label>Import existing .xlsx<input type="file" accept=".xlsx" onChange={importExcel} disabled={importing} /></label>}
          </div>
        </section>
        {isOverCeiling && <section className="panel locked-banner"><strong>Over budget ceiling:</strong> <span>This plan is over by {formatVatu(ceilingVariance)}. It can still be saved as a planning request, but add a justification so finance/accounting can raise the ceiling, refer it to future budget, or identify available funds.</span></section>}

        <section id="activities" className="panel">
          <div className="actions" style={{ justifyContent: 'space-between' }}>
            <h2>Activities</h2>
            {canEditPlan && <button type="button" className="secondary" onClick={addActivity}>Add activity</button>}
          </div>
          <div className="grid">
            {activities.map((activity, index) => {
              const monthly = allocateMonthly(activity);
              return (
                <div className="panel activity-card" key={index}>
                  <div className="activity-header">
                    <h3>{activity.activityNumber || `Activity ${index + 1}`}</h3>
                    <span className="muted">Allocated: {formatVatu(Object.values(monthly).reduce((a, b) => a + b, 0))}</span>
                  </div>
                  <div className="grid cols-3">
                    <label>Activity #<input value={activity.activityNumber} onChange={(e) => updateActivity(index, { activityNumber: e.target.value })} /></label>
                    <label>Sub-program<input value={activity.subProgram} onChange={(e) => updateActivity(index, { subProgram: e.target.value })} /></label>
                    <label>Job code<select value={activity.jobCode} onChange={(e) => { const value = e.target.value; const selected = referenceData.jobCodes.find((item) => item.jobCode === value || item.display === value); updateActivity(index, { jobCode: value, costCenterCode: String(selected?.costCenterCode || selected?.code || activity.costCenterCode || '') }); }}><option value="">Select job code</option>{activity.jobCode && !referenceData.jobCodes.some((item) => item.jobCode === activity.jobCode || item.display === activity.jobCode) && <option value={activity.jobCode}>{activity.jobCode}</option>}{referenceData.jobCodes.map((item) => (<option key={String(item.jobCode || item.display)} value={String(item.jobCode || item.display)}>{String(item.display || item.jobCode)}</option>))}</select>{canEditPlan && <button type="button" className="secondary mini-button" onClick={() => void createReferenceItem('job-codes', { display: activity.jobCode }, (item) => updateActivity(index, { jobCode: String(item.display || item.label || item.code || '') }))}>Add missing job code</button>}</label>
                    <label>Cost center code<select value={activity.costCenterCode} onChange={(e) => updateActivity(index, { costCenterCode: e.target.value })}><option value="">Select cost center</option>{activity.costCenterCode && !referenceData.costCenters.some((item) => item.code === activity.costCenterCode || item.display === activity.costCenterCode) && <option value={activity.costCenterCode}>{activity.costCenterCode}</option>}{referenceData.costCenters.map((item) => (<option key={String(item.code || item.display)} value={String(item.code || item.display)}>{String(item.display || `${item.code} - ${item.name || item.label || ''}`)}</option>))}</select>{canEditPlan && <button type="button" className="secondary mini-button" onClick={() => void createReferenceItem('cost-centers', { code: activity.costCenterCode }, (item) => updateActivity(index, { costCenterCode: String(item.code || item.display || '') }))}>Add missing cost center</button>}</label>
                    <label>Activity description<textarea value={activity.activityDescription} onChange={(e) => updateActivity(index, { activityDescription: e.target.value })} /></label>
                    <label>
                      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                        Description of expenditure
                        <span className="inline-actions">
                          <button
                            type="button"
                            className="secondary"
                            onClick={(event) => { event.preventDefault(); void suggestExpenditureDescription(index, 'create'); }}
                            disabled={suggestingIndex === index || !activity.activityDescription.trim() || !canSuggestDescriptions}
                            title={!activity.activityDescription.trim() ? 'Add an activity description first' : 'Create a practical expenditure description'}
                            style={{ padding: '6px 10px', fontSize: 12, whiteSpace: 'nowrap' }}
                          >
                            {suggestingIndex === index ? 'Working...' : 'Create with AI'}
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            onClick={(event) => { event.preventDefault(); void suggestExpenditureDescription(index, 'optimize'); }}
                            disabled={suggestingIndex === index || !activity.expenditureDescription.trim() || !canSuggestDescriptions}
                            title={!activity.expenditureDescription.trim() ? 'Write or create a description first' : 'Optimize the existing expenditure description'}
                            style={{ padding: '6px 10px', fontSize: 12, whiteSpace: 'nowrap' }}
                          >
                            Optimize text
                          </button>
                        </span>
                      </span>
                      <textarea
                        value={activity.expenditureDescription}
                        onChange={(e) => updateActivity(index, { expenditureDescription: e.target.value })}
                        placeholder="Use Create with AI, optimize existing text, or type the planned expenditure items manually."
                      />
                    </label>
                    <label>Responsibility<input value={activity.responsibility} onChange={(e) => updateActivity(index, { responsibility: e.target.value })} /></label>
                    <label>Corporate Plan key activity<textarea value={activity.corporatePlanKeyActivity} onChange={(e) => updateActivity(index, { corporatePlanKeyActivity: e.target.value })} /></label>
                    <label>Output/service target<textarea value={activity.outputOrServiceTarget} onChange={(e) => updateActivity(index, { outputOrServiceTarget: e.target.value })} /></label>
                    <label>Target for year<textarea value={activity.targetForYear} onChange={(e) => updateActivity(index, { targetForYear: e.target.value })} /></label>
                    <label>Estimated cost<input type="number" value={activity.estimatedCost} onChange={(e) => updateActivity(index, { estimatedCost: Number(e.target.value), recurrentBudget: Number(e.target.value) })} /></label>
                    <label>Recurrent budget<input type="number" value={activity.recurrentBudget} onChange={(e) => updateActivity(index, { recurrentBudget: Number(e.target.value) })} /></label>
                    <label>Development partners<input type="number" value={activity.developmentPartners} onChange={(e) => updateActivity(index, { developmentPartners: Number(e.target.value) })} /></label>
                    <label>Budget category<select value={activity.budgetCategory} onChange={(e) => updateActivity(index, { budgetCategory: e.target.value })}><option value="">Select budget category</option>{referenceData.budgetCategories.map((item) => (<option key={optionLabel(item)} value={optionLabel(item)}>{optionLabel(item)}</option>))}</select></label>
                    <label>Account code<select value={activity.accountCode} onChange={(e) => updateActivity(index, { accountCode: e.target.value })}><option value="">Select account code</option>{accountOptions.map((item) => (<option key={`${item.category}-${item.code || item.display}-${item.label || item.description}`} value={item.display || `${item.code} - ${item.label || item.description || ''}`}>{item.display || `${item.code} - ${item.label || item.description || ''}`}{item.category ? ` · ${item.category}` : ''}</option>))}</select>{canEditPlan && <button type="button" className="secondary mini-button" onClick={() => void createReferenceItem('account-codes', { category: activity.budgetCategory || 'Other Codes Not Listed' }, (item) => updateActivity(index, { accountCode: String(item.display || `${item.code} - ${item.label || ''}`) }))}>Add missing account code</button>}</label>
                    <label>Funding<select value={activity.funding} onChange={(e) => updateActivity(index, { funding: e.target.value })}><option value="">Select funding</option>{referenceData.fundingSources.map((item) => (<option key={optionLabel(item)} value={optionLabel(item)}>{optionLabel(item)}</option>))}</select></label>
                    <label>Activity categorisation<select value={activity.activityCategory} onChange={(e) => updateActivity(index, { activityCategory: e.target.value })}><option value="">Select category</option>{referenceData.activityCategories.map((item) => (<option key={optionLabel(item)} value={optionLabel(item)}>{optionLabel(item)}</option>))}</select></label>
                    <label>NSDP target<select value={activity.nsdpTarget} onChange={(e) => updateActivity(index, { nsdpTarget: e.target.value })}><option value="">Select NSDP target</option>{referenceData.nsdpTargets.map((item) => (<option key={optionLabel(item)} value={optionLabel(item)}>{optionLabel(item)}</option>))}</select></label>
                    <label>Approved budget<input type="number" value={activity.approvedBudget} onChange={(e) => updateActivity(index, { approvedBudget: Number(e.target.value) })} /></label>
                  </div>
                  <div className="actions" style={{ marginTop: 14, justifyContent: 'space-between' }}>
                    <div className="quarters">
                      {(['q1', 'q2', 'q3', 'q4'] as const).map((q) => (
                        <label key={q}><input type="checkbox" checked={activity[q]} onChange={(e) => updateActivity(index, { [q]: e.target.checked } as Partial<ActivityInput>)} />{q.toUpperCase()}</label>
                      ))}
                    </div>
                    {canEditPlan && activities.length > 1 && <button type="button" className="danger" onClick={() => removeActivity(index)}>Remove</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="cashflow" className="panel">
          <h2>Monthly cashflow preview</h2>
          <div className="table-wrap">
            <table>
              <thead><tr>{MONTHS.map((m) => <th key={m} className="money">{m}</th>)}</tr></thead>
              <tbody><tr>{MONTHS.map((m) => <td key={m} className="money">{formatVatu(summary.monthlyTotals[m])}</td>)}</tr></tbody>
            </table>
          </div>
        </section>

        </fieldset>
        <div className="actions sticky-actions">
          {canEditPlan && <button type="submit">{selectedPlanId ? 'Update business plan' : 'Save business plan'}</button>}
          <span className="muted">{message}</span>
        </div>
      </form>

      <section id="saved-plans" className="panel saved-plans-panel" style={{ marginTop: 18 }}>
        <div className="panel-title-row">
          <div>
            <h2>Saved plans</h2>
            <p className="muted">Open, export, or remove saved business plans.</p>
          </div>
          <div className="actions">
            {selectedSavedPlanIds.length > 0 && <span className="badge">{selectedSavedPlanIds.length} selected</span>}
            {selectedSavedPlanIds.length > 0 && <button type="button" className="secondary" onClick={() => setSelectedSavedPlanIds([])}>Clear</button>}
            {canDeletePlan && selectedSavedPlanIds.length > 0 && <button type="button" className="danger" onClick={() => void deleteSelectedSavedPlans()}>Delete selected</button>}
          </div>
        </div>
        {loading ? <p>Loading...</p> : plans.length === 0 ? <p className="muted">No saved plans yet.</p> : (
          <div className="table-wrap saved-plans-table-wrap">
            <table className="saved-plans-table">
              <thead><tr><th className="select-cell"><input type="checkbox" checked={plans.length > 0 && selectedSavedPlanIds.length === plans.length} onChange={toggleAllSavedPlans} aria-label="Select all saved plans" /></th><th>Plan</th><th>Year</th><th>Facility</th><th>Status</th><th className="money">Estimated</th><th className="money optional-laptop">Cashflow</th><th>Actions</th></tr></thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td className="select-cell"><input type="checkbox" checked={selectedSavedPlanIds.includes(plan.id)} onChange={() => toggleSavedPlanSelection(plan.id)} aria-label={`Select ${plan.title}`} /></td>
                    <td><strong>{plan.title}</strong><br /><span className="muted">{plan.costCenter || 'No cost center'}</span></td>
                    <td>{plan.year}</td>
                    <td>{plan.facility}</td>
                    <td><span className={`badge status-${plan.status.toLowerCase()}`}>{plan.status}</span></td>
                    <td className="money">{formatVatu(plan.summary?.totalEstimatedCost ?? 0)}</td>
                    <td className="money optional-laptop">{formatVatu(plan.summary?.cashflowTotal ?? 0)}</td>
                    <td>
                      <details className="row-actions-menu">
                        <summary>Actions</summary>
                        <div>
                          <button type="button" onClick={() => loadPlan(plan.id)}>{canEditRowPlan(plan) ? 'Open / edit' : 'Open / view'}</button>
                          <a href={`/api/plans/${plan.id}/export?format=xlsx`}>Export Excel</a>
                          <a href={`/api/plans/${plan.id}/export?format=pdf`}>Export PDF</a>
                          {canDeletePlan && <button type="button" className="danger-text" onClick={async () => { if (confirm('Delete this saved business plan?')) { await fetch(`/api/plans/${plan.id}`, { method: 'DELETE' }); if (selectedPlanId === plan.id) clearForm(); await refresh(); } }}>Delete</button>}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedPlanId && (
        <section id="audit" className="panel" style={{ marginTop: 18 }}>
          <h2>Audit history</h2>
          {auditLogs.length === 0 ? <p className="muted">No audit records yet.</p> : (
            <div className="timeline">
              {auditLogs.map((log) => (
                <div className="timeline-item" key={log.id}>
                  <strong>{log.action}</strong>
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                  <p>{log.details}</p>
                  <small>{log.user?.name || 'System'}</small>
                </div>
              ))}
            </div>
          )}
          <p className="footer-note">Audit records are stored against the authenticated user session.</p>
        </section>
      )}


      {selectedPlanId && (
        <>
          <ApprovalCommentsPanel planId={selectedPlanId} planTitle={selectedPlan?.title} onCommentAdded={() => loadAudit(selectedPlanId)} />
          <ApprovalSnapshotsPanel planId={selectedPlanId} planTitle={selectedPlan?.title} />
          <PlanComparisonPanel planId={selectedPlanId} refreshKey={comparisonRefreshKey} />
        </>
      )}

      <NotificationsPanel mode="full" />

      <section id="profile-admin" className="profile-admin-section">
        <div className="panel-title-row">
          <div>
            <h2>Profile & Admin Tools</h2>
            <p className="muted">Personal security tools first; ADMIN-only management tools stay here instead of crowding the operational dashboard.</p>
          </div>
        </div>
        <PasswordChangePanel />
        {role === 'ADMIN' && (
          <>
            <UserManagementPanel />
            <RoleAccessTestPanel />
          </>
        )}
      </section>

      <p className="footer-note">Local/private mode: Docker Compose app + bundled PostgreSQL. Render mode: Docker app + managed PostgreSQL from render.yaml.</p>
          </div>
        </main>
      </div>
    </AuthGate>
  );
}
