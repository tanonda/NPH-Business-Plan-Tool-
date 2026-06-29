export type {
  AppRole as LockRole,
  PlanStatus as LockStatus
} from '@/lib/access-policy';

export {
  canEditPlanContent,
  getPlanLockMessage,
  normalizeAppRole as normalizeLockRole,
  normalizePlanStatus as normalizeLockStatus
} from '@/lib/access-policy';
