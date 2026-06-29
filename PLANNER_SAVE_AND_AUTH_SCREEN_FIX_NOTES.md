# Planner Save + Auth Screen Fix Notes (V4.8)

## Planner department save fix

Fixed a department-access edge case where a PLANNER could see/select an assigned department in the dropdown but still fail save because older department assignment rows were stored with VIEWER access.

The save guard now accepts an assigned department for roles that are allowed to edit assigned departments, even if older data did not yet carry OWNER/EDITOR access. This preserves the hardened department guard while keeping existing planner accounts usable.

Affected file:
- `src/lib/department-access.ts`

## UI feedback fix

Selecting a department now clears the stale save-warning message and confirms the department is selected.

Affected file:
- `src/app/page.tsx`

## Session-check screen redesign

Replaced the plain authentication check screen with a branded VNH loading card, animated progress bar, and role-access language.

Affected files:
- `src/components/AuthGate.tsx`
- `src/app/globals.css`
