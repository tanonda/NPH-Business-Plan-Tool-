# V4.10 - Update Existing Plan Save Access Fix

## Issue
After V4.9, planners could create a new plan, but updating an already-saved draft could still fail with `PUT /api/plans/[id] 403`.

## Root cause
Older department assignment records could exist with access level `VIEWER` even when the user's app role is `PLANNER`. The create route already had a role-based assigned-department fallback, but the existing-plan edit guard still required strict `OWNER` or `EDITOR` on the saved plan's department before it reached the save resolver.

## Fix
Updated `src/lib/department-access.ts` so edit guards allow a role-based fallback for assigned departments when the user role is one of:

- `PLANNER`
- `ACCOUNTING`
- `FINANCE`
- `BUDGET_OFFICER`

This only fixes department assignment compatibility. It does **not** bypass plan locking. Plans in `REVIEW`, `APPROVED`, `SUBMITTED`, etc. remain protected by the separate plan content lock.

## Changed file
- `src/lib/department-access.ts`
