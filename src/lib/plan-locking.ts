export type LockRole = 'ADMIN' | 'PLANNER' | 'APPROVER' | 'REVIEWER' | 'VIEWER';
export type LockStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'SUBMITTED';

export function normalizeLockRole(value: unknown): LockRole {
  const role = String(value || 'VIEWER').toUpperCase();

  if (
    role === 'ADMIN' ||
    role === 'PLANNER' ||
    role === 'APPROVER' ||
    role === 'REVIEWER' ||
    role === 'VIEWER'
  ) {
    return role;
  }

  return 'VIEWER';
}

export function normalizeLockStatus(value: unknown): LockStatus {
  const status = String(value || 'DRAFT').toUpperCase();

  if (
    status === 'DRAFT' ||
    status === 'REVIEW' ||
    status === 'APPROVED' ||
    status === 'SUBMITTED'
  ) {
    return status;
  }

  return 'DRAFT';
}

export function canEditPlanContent(statusValue: unknown, roleValue: unknown) {
  const status = normalizeLockStatus(statusValue);
  const role = normalizeLockRole(roleValue);

  if (role === 'ADMIN') {
    return true;
  }

  if (role === 'PLANNER' && status === 'DRAFT') {
    return true;
  }

  return false;
}

export function getPlanLockMessage(statusValue: unknown, roleValue: unknown) {
  const status = normalizeLockStatus(statusValue);
  const role = normalizeLockRole(roleValue);

  if (role === 'ADMIN') {
    return 'ADMIN override: this plan can be edited.';
  }

  if (role === 'PLANNER' && status === 'DRAFT') {
    return 'DRAFT plan: planner edits are allowed.';
  }

  if (status === 'REVIEW') {
    return 'This plan is under review and is locked from normal editing.';
  }

  if (status === 'APPROVED') {
    return 'This plan is approved and locked from normal editing.';
  }

  if (status === 'SUBMITTED') {
    return 'This plan is submitted and fully locked.';
  }

  return `Role ${role} cannot edit this plan.`;
}
