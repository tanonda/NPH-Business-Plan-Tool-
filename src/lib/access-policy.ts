export type CoreRole = 'ADMIN' | 'PLANNER' | 'APPROVER' | 'REVIEWER' | 'VIEWER';
export type AppRole = CoreRole | 'ACCOUNTING' | 'FINANCE' | 'BUDGET_OFFICER' | 'DONOR_MANAGER';
export type PlanStatus = 'DRAFT' | 'REVIEW' | 'RETURNED' | 'BUDGET_REVIEW' | 'FINANCE_REVIEW' | 'BUDGET_CLEARED' | 'APPROVED' | 'SUBMITTED' | 'EXECUTION' | 'REJECTED' | 'LOCKED';
export type DepartmentAccessLevel = 'OWNER' | 'EDITOR' | 'REVIEWER' | 'VIEWER';

export const APP_ROLES: AppRole[] = ['ADMIN', 'PLANNER', 'APPROVER', 'REVIEWER', 'ACCOUNTING', 'FINANCE', 'BUDGET_OFFICER', 'DONOR_MANAGER', 'VIEWER'];
export const CORE_ROLES: CoreRole[] = ['ADMIN', 'PLANNER', 'APPROVER', 'REVIEWER', 'VIEWER'];
export const PLAN_STATUSES: PlanStatus[] = ['DRAFT', 'REVIEW', 'RETURNED', 'BUDGET_REVIEW', 'FINANCE_REVIEW', 'BUDGET_CLEARED', 'APPROVED', 'SUBMITTED', 'EXECUTION', 'REJECTED', 'LOCKED'];

export const SIMPLE_WORKFLOW_STATUSES: PlanStatus[] = ['DRAFT', 'REVIEW', 'RETURNED', 'APPROVED', 'SUBMITTED', 'REJECTED'];
export const LOCKED_CONTENT_STATUSES: PlanStatus[] = ['REVIEW', 'BUDGET_REVIEW', 'FINANCE_REVIEW', 'BUDGET_CLEARED', 'APPROVED', 'SUBMITTED', 'EXECUTION', 'REJECTED', 'LOCKED'];

export function normalizeAppRole(value: unknown): AppRole {
  const rawRole = String(value || 'VIEWER').toUpperCase();
  // Legacy compatibility: earlier builds exposed BUDGET_PLANNER. Treat it as BUDGET_OFFICER,
  // but keep the official user-facing role list limited to BUDGET_OFFICER.
  if (rawRole === 'BUDGET_PLANNER') return 'BUDGET_OFFICER';
  const role = rawRole as AppRole;
  return APP_ROLES.includes(role) ? role : 'VIEWER';
}

export function normalizePlanStatus(value: unknown): PlanStatus {
  const status = String(value || 'DRAFT').toUpperCase() as PlanStatus;
  return PLAN_STATUSES.includes(status) ? status : 'DRAFT';
}

export function canComment(roleValue: unknown) {
  const role = normalizeAppRole(roleValue);
  return ['ADMIN', 'PLANNER', 'APPROVER', 'REVIEWER', 'ACCOUNTING', 'FINANCE', 'BUDGET_OFFICER', 'DONOR_MANAGER'].includes(role);
}

export function canEditPlanContent(statusValue: unknown, roleValue: unknown) {
  const status = normalizePlanStatus(statusValue);
  const role = normalizeAppRole(roleValue);
  if (role === 'ADMIN') return true;
  if (role === 'PLANNER' && (status === 'DRAFT' || status === 'RETURNED')) return true;
  return false;
}

export function getPlanLockMessage(statusValue: unknown, roleValue: unknown) {
  const status = normalizePlanStatus(statusValue);
  const role = normalizeAppRole(roleValue);
  if (role === 'ADMIN') return 'ADMIN override: this plan can be edited.';
  if (role === 'PLANNER' && (status === 'DRAFT' || status === 'RETURNED')) return `${status} plan: planner edits are allowed.`;
  if (role !== 'PLANNER') return `Your ${role} role can view this plan but cannot edit plan content.`;
  if (status === 'REVIEW') return 'This plan is under review and locked from normal editing.';
  if (status === 'APPROVED') return 'This plan is approved and locked from normal editing.';
  if (status === 'SUBMITTED') return 'This plan is submitted and fully locked.';
  if (status === 'REJECTED') return 'This plan has been rejected. Create a new draft or use admin override if necessary.';
  return `Role ${role} cannot edit this ${status} plan.`;
}

export function getAllowedNextStatuses(currentStatusValue: unknown, roleValue: unknown): PlanStatus[] {
  const currentStatus = normalizePlanStatus(currentStatusValue);
  const role = normalizeAppRole(roleValue);

  // Keep ADMIN override broad to support repair, rollback, and legacy status cleanup.
  if (role === 'ADMIN') return SIMPLE_WORKFLOW_STATUSES.filter((status) => status !== currentStatus);

  if (role === 'PLANNER') {
    if (currentStatus === 'DRAFT' || currentStatus === 'RETURNED') return ['REVIEW'];
    return [];
  }

  if (role === 'APPROVER') {
    if (currentStatus === 'REVIEW') return ['APPROVED', 'RETURNED', 'REJECTED'];
    if (currentStatus === 'APPROVED') return ['SUBMITTED'];
    return [];
  }

  // REVIEWER and VIEWER are intentionally read/comment-only for status changes.
  return [];
}

export function canTransitionStatus(currentStatus: unknown, nextStatus: unknown, role: unknown) {
  return getAllowedNextStatuses(currentStatus, role).includes(normalizePlanStatus(nextStatus));
}

export function isReturnTransition(currentStatus: unknown, nextStatus: unknown) {
  const current = normalizePlanStatus(currentStatus);
  const next = normalizePlanStatus(nextStatus);
  return next === 'RETURNED' || next === 'REJECTED' || (next === 'DRAFT' && current !== 'DRAFT');
}

export function describeTransitionRule(currentStatusValue: unknown, nextStatusValue: unknown, roleValue: unknown) {
  const currentStatus = normalizePlanStatus(currentStatusValue);
  const nextStatus = normalizePlanStatus(nextStatusValue);
  const role = normalizeAppRole(roleValue);

  if (role === 'ADMIN') return `ADMIN override moved plan from ${currentStatus} to ${nextStatus}.`;
  if (role === 'PLANNER' && (currentStatus === 'DRAFT' || currentStatus === 'RETURNED') && nextStatus === 'REVIEW') return 'PLANNER submitted the plan for approval review.';
  if (role === 'APPROVER' && currentStatus === 'REVIEW' && nextStatus === 'APPROVED') return 'APPROVER approved the reviewed plan.';
  if (role === 'APPROVER' && currentStatus === 'APPROVED' && nextStatus === 'SUBMITTED') return 'APPROVER submitted the approved plan as final.';
  if (role === 'APPROVER' && currentStatus === 'REVIEW' && nextStatus === 'RETURNED') return 'APPROVER returned the plan for planner correction.';
  if (role === 'APPROVER' && currentStatus === 'REVIEW' && nextStatus === 'REJECTED') return 'APPROVER rejected the plan.';
  if (role === 'REVIEWER' || role === 'VIEWER') return `${role} can view${role === 'REVIEWER' ? ' and comment on' : ''} plans but cannot change workflow status.`;
  return `Role ${role} cannot move status from ${currentStatus} to ${nextStatus}.`;
}

export function canManageUsers(roleValue: unknown) {
  return normalizeAppRole(roleValue) === 'ADMIN';
}


export function canManageBudgetCeilings(roleValue: unknown) {
  return ['ADMIN', 'FINANCE', 'BUDGET_OFFICER'].includes(normalizeAppRole(roleValue));
}

export function canViewBudgetCeilings(roleValue: unknown) {
  return ['ADMIN', 'ACCOUNTING', 'FINANCE', 'BUDGET_OFFICER', 'DONOR_MANAGER'].includes(normalizeAppRole(roleValue));
}

export function canUseAccounting(roleValue: unknown) {
  return ['ADMIN', 'ACCOUNTING', 'FINANCE', 'BUDGET_OFFICER'].includes(normalizeAppRole(roleValue));
}

export function canUseBudgetControl(roleValue: unknown) {
  return ['ADMIN', 'FINANCE', 'BUDGET_OFFICER', 'DONOR_MANAGER'].includes(normalizeAppRole(roleValue));
}
