# Planner Save Department Fix (V4.3)

## Problem
A PLANNER could import a workbook successfully, but saving the imported plan returned `POST /api/plans 403`.

## Root cause
The V4 access hardening required non-admin plan creation to include an app `departmentId` with OWNER/EDITOR access. Imported spreadsheets usually provide workbook cost center values, not the app's internal department id, so the API rejected the save even when the planner had a valid assigned department.

## Fix
- Added `resolveEditableDepartmentForPlan()` and `requireResolvedDepartmentEditAccess()` in `src/lib/department-access.ts`.
- On save, the API now resolves the department from:
  1. Submitted department id, if valid and editable.
  2. Matching assigned department cost center.
  3. The user's single editable department, when only one exists.
- Updated `POST /api/plans` and `PUT /api/plans/[id]` to save the resolved department id.
- Updated the UI save handler to auto-select a matching department from the selected cost center before saving.
- Improved save error messages to surface validation details.

## Result
A PLANNER can now import a spreadsheet and save it as long as the workbook cost center matches one of their assigned editable departments, or they only have one editable department.
