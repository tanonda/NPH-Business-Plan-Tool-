# Role Department Assignment Fix Notes — V4.4

## Problem
Finance/accounting/budget-style users were present in the role model, but department assignments were not strong enough for those roles. The department assignment editor saved only department IDs, so new `UserDepartmentAccess` rows fell back to Prisma's default `VIEWER` access level. That meant users could appear assigned to a department but still be blocked from workflows that require `OWNER` or `EDITOR` department access.

The app also used `BUDGET_OFFICER`, while the expected operational label was `BUDGET_PLANNER`.

## Fixes

### Roles
- Added `BUDGET_PLANNER` to the Prisma `Role` enum.
- Added migration: `202606291030_add_budget_planner_role`.
- Added `BUDGET_PLANNER` to frontend and backend role lists.
- Treated `BUDGET_PLANNER` like `BUDGET_OFFICER` for budget/accounting permissions.

### Department assignment access levels
- Updated `UserDepartmentAccessEditor` to include a Department access level selector:
  - `OWNER`
  - `EDITOR`
  - `REVIEWER`
  - `VIEWER`
- Default access level now follows the selected user's role:
  - `PLANNER`, `ACCOUNTING`, `FINANCE`, `BUDGET_OFFICER`, `BUDGET_PLANNER` → `EDITOR`
  - `APPROVER`, `REVIEWER` → `REVIEWER`
  - `VIEWER` → `VIEWER`

### API
- Updated `PATCH /api/users/[id]/departments` to save `accessLevel` with each department assignment.
- Updated `PATCH /api/users/[id]` so ADMIN can explicitly grant `canAccessAllDepartments` to non-admin finance/accounting/budget users when required.
- New users still default to `canAccessAllDepartments = false`; all-department access must be explicitly granted.

## Result
Finance, Accounting, Budget Officer, and Budget Planner users can now be assigned departments correctly and receive department dropdown values based on those assignments. Planners and budget users with `EDITOR` department access can save plans and work with their scoped cost centers.
