# V4.6 Budget Empty-State / False Warning Fix

## Problem
When all saved plans were deleted, the Admin budget dashboard still showed cost-center rows as `1 issue(s)` because zero-ceiling reference cost centers were treated as active budget problems.

## Root cause
The budget summary includes department/cost-center reference rows even before any plan, ceiling, commitment, donor allocation, or expenditure exists. The warning engine flagged every untouched row with `No approved government ceiling...`, which created false budget warnings.

## Fix
- Added `hasBudgetActivity()` in `src/lib/budget-control.ts`.
- Empty reference-only cost centers no longer generate warnings.
- Missing-ceiling warnings now appear only when the cost center has plan/commitment/expenditure activity.
- Budget recommendations now show a clean empty-state message when no active budget data exists.

## Note
The console errors mentioning `ShowOneChild`, `showOneChild`, Grammarly attributes, and Chrome coachmarks are browser-extension injections, not app code. The favicon 404 is cosmetic only.
