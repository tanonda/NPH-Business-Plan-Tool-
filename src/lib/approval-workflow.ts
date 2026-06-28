export type PlanStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'SUBMITTED';
export type WorkflowRole = 'ADMIN' | 'PLANNER' | 'APPROVER' | 'REVIEWER' | 'VIEWER';

export const STATUS_ORDER: PlanStatus[] = ['DRAFT', 'REVIEW', 'APPROVED', 'SUBMITTED'];

export function isPlanStatus(value: unknown): value is PlanStatus {
  return value === 'DRAFT' || value === 'REVIEW' || value === 'APPROVED' || value === 'SUBMITTED';
}

export function normalizeWorkflowStatus(value: unknown): PlanStatus {
  const status = String(value || 'DRAFT').toUpperCase();
  return isPlanStatus(status) ? status : 'DRAFT';
}

export function normalizeWorkflowRole(value: unknown): WorkflowRole {
  const role = String(value || 'VIEWER').toUpperCase();

  if (role === 'ADMIN' || role === 'PLANNER' || role === 'APPROVER' || role === 'REVIEWER' || role === 'VIEWER') {
    return role;
  }

  return 'VIEWER';
}

export function getAllowedNextStatuses(currentStatusValue: unknown, roleValue: unknown): PlanStatus[] {
  const currentStatus = normalizeWorkflowStatus(currentStatusValue);
  const role = normalizeWorkflowRole(roleValue);

  if (role === 'ADMIN') {
    return STATUS_ORDER.filter((status) => status !== currentStatus);
  }

  if (role === 'PLANNER') {
    if (currentStatus === 'DRAFT') return ['REVIEW'];
    return [];
  }

  if (role === 'APPROVER') {
    if (currentStatus === 'REVIEW') return ['APPROVED', 'DRAFT'];
    if (currentStatus === 'APPROVED') return ['SUBMITTED', 'REVIEW', 'DRAFT'];
    return [];
  }

  if (role === 'REVIEWER') {
    if (currentStatus === 'REVIEW') return ['DRAFT'];
    return [];
  }

  return [];
}

export function isReturnTransition(currentStatus: unknown, nextStatus: unknown) {
  const current = normalizeWorkflowStatus(currentStatus);
  const next = normalizeWorkflowStatus(nextStatus);
  return (current === 'REVIEW' || current === 'APPROVED') && (next === 'DRAFT' || next === 'REVIEW') && current !== next;
}

export function canTransitionStatus(currentStatus: unknown, nextStatus: unknown, role: unknown) {
  const normalizedNext = normalizeWorkflowStatus(nextStatus);
  return getAllowedNextStatuses(currentStatus, role).includes(normalizedNext);
}

export function describeTransitionRule(currentStatusValue: unknown, nextStatusValue: unknown, roleValue: unknown) {
  const currentStatus = normalizeWorkflowStatus(currentStatusValue);
  const nextStatus = normalizeWorkflowStatus(nextStatusValue);
  const role = normalizeWorkflowRole(roleValue);

  if (role === 'ADMIN') return `ADMIN override moved plan from ${currentStatus} to ${nextStatus}.`;
  if (role === 'PLANNER' && currentStatus === 'DRAFT' && nextStatus === 'REVIEW') return 'PLANNER submitted the plan for review.';
  if (role === 'APPROVER' && currentStatus === 'REVIEW' && nextStatus === 'APPROVED') return 'APPROVER approved the reviewed plan.';
  if (role === 'APPROVER' && currentStatus === 'APPROVED' && nextStatus === 'SUBMITTED') return 'APPROVER submitted the approved plan.';
  if ((role === 'APPROVER' || role === 'REVIEWER') && isReturnTransition(currentStatus, nextStatus)) return `${role} returned the plan from ${currentStatus} to ${nextStatus} for planner corrections.`;

  return `Role ${role} cannot move status from ${currentStatus} to ${nextStatus}.`;
}
