# Ceiling Permission Fix Notes (V4.9)

## Problem
Planner users could edit the `Ceiling amount` field in the Plan setup form. The ceiling should be controlled only by roles responsible for approved budget ceilings, while planners should be able to save over-ceiling plans with justification.

## Fixed
- Added `canManageBudgetCeilings()` and `canViewBudgetCeilings()` to `src/lib/access-policy.ts`.
- Locked the Plan setup `Ceiling amount` input for roles that cannot manage ceilings.
- Added clear helper text explaining that planners should use the over-ceiling justification field instead.
- Hardened `POST /api/plans` and `PUT /api/plans/[id]` so non-ceiling roles cannot change an existing plan's ceiling through the API.
- For new plans, official DepartmentBudgetCeiling records are used when available; imported workbook ceiling is kept only as a provisional baseline when no official ceiling record exists yet.
- Locked the Budget Control ceiling editor for non-ceiling roles.

## Ceiling-edit roles
- ADMIN
- FINANCE
- BUDGET_OFFICER

## View-only budget roles
- ACCOUNTING can view accounting/budget data but does not update ceilings.
- DONOR_MANAGER can view budget control/donor-related budget position but does not update ceilings.
- PLANNER can view the plan ceiling and justify over-ceiling requests, but cannot change ceiling values.

## Files changed
- `src/lib/access-policy.ts`
- `src/lib/budget-ceiling.ts`
- `src/app/page.tsx`
- `src/app/api/plans/route.ts`
- `src/app/api/plans/[id]/route.ts`
- `src/components/BudgetControlPanel.tsx`
- `src/app/globals.css`
