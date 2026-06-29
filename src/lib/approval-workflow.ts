export type {
  PlanStatus,
  AppRole as WorkflowRole
} from '@/lib/access-policy';

export {
  PLAN_STATUSES as STATUS_ORDER,
  SIMPLE_WORKFLOW_STATUSES as FORWARD_STATUSES,
  canTransitionStatus,
  describeTransitionRule,
  getAllowedNextStatuses,
  isReturnTransition,
  normalizeAppRole as normalizeWorkflowRole,
  normalizePlanStatus as normalizeWorkflowStatus
} from '@/lib/access-policy';

import { PLAN_STATUSES } from '@/lib/access-policy';

export function isPlanStatus(value: unknown) {
  return PLAN_STATUSES.includes(String(value || '').toUpperCase() as any);
}
