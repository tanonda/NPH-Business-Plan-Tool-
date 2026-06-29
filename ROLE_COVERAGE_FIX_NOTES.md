# Role Coverage Fix Notes - V4.5

Official user-facing roles are now:

- ADMIN
- PLANNER
- APPROVER
- REVIEWER
- VIEWER
- ACCOUNTING
- FINANCE
- BUDGET_OFFICER
- DONOR_MANAGER

## Changes

- Removed BUDGET_PLANNER from user-facing role dropdowns and create/update role validation.
- Kept BUDGET_PLANNER as a hidden legacy compatibility alias where needed, mapping it to BUDGET_OFFICER in access checks.
- Added DONOR_MANAGER to department assignment defaults.
- Added DONOR_MANAGER to comment permissions.
- Added DONOR_MANAGER to reference-list creation so donor/funding-related missing codes can be added.
- Added DONOR_MANAGER to budget-control dashboard visibility for donor funding/restriction review.
- Confirmed ACCOUNTING, FINANCE, and BUDGET_OFFICER keep department assignment support and proper default access levels.

## Department defaults

- PLANNER: EDITOR
- ACCOUNTING: EDITOR
- FINANCE: EDITOR
- BUDGET_OFFICER: EDITOR
- APPROVER: REVIEWER
- REVIEWER: REVIEWER
- DONOR_MANAGER: REVIEWER
- VIEWER: VIEWER

ADMIN can still override and explicitly select OWNER, EDITOR, REVIEWER, or VIEWER per department.
