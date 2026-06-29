# Access Policy and Dashboard Guard Fix Notes

## Implemented fixes

1. Centralized access policy
   - Added `src/lib/access-policy.ts` as the single source of truth for roles, workflow transitions, content locking, comments, and dashboard access helpers.
   - Rewired `src/lib/approval-workflow.ts` and `src/lib/plan-locking.ts` to use the centralized policy.

2. Workflow alignment
   - Simplified active workflow to: `DRAFT -> REVIEW -> APPROVED -> SUBMITTED`.
   - PLANNER can submit `DRAFT` or `RETURNED` to `REVIEW`.
   - APPROVER can approve `REVIEW`, return/reject `REVIEW`, and submit `APPROVED` final.
   - REVIEWER and VIEWER can no longer change status.
   - ADMIN retains override ability for repair and administration.

3. Server-side plan locking
   - `PUT /api/plans/[id]` now checks the existing plan status before saving content.
   - PLANNER edits are allowed only for `DRAFT` and `RETURNED` plans.
   - APPROVER, REVIEWER, and VIEWER cannot edit plan content through direct API calls.
   - APPROVED/SUBMITTED and review-stage plans are protected server-side.

4. Department edit and review guards
   - Added explicit department access helpers:
     - `requirePlanDepartmentAccess`
     - `requirePlanDepartmentEditAccess`
     - `requirePlanDepartmentReviewAccess`
     - `requireDepartmentEditAccess`
   - Plan create/update now checks whether a non-admin user has department OWNER/EDITOR access.
   - Status changes require department edit access for PLANNER and department review-level access for APPROVER.

5. Safer user defaults
   - New non-admin users no longer default to all-department access.
   - Changing a user away from ADMIN clears all-department access unless explicitly kept by valid admin logic.
   - Production seeding and runtime default-admin creation now require `DEFAULT_ADMIN_PASSWORD` instead of silently falling back to `admin123`. Login forms no longer pre-fill or display default credentials.

6. Dashboard and API scoping
   - `/api/departments` now returns only departments the current user can access unless the user has global access.
   - `/api/reference?list=departments` now scopes job-code reference values for department-limited users.
   - Budget/accounting summary, ceiling, commitment, and expenditure routes now apply cost-center scoping for department-limited users.
   - Accounting/budget panels are hidden from roles that should not use them.

7. UI lock and saved-plan actions
   - Locked plans now show a clear lock banner.
   - Plan form fields are disabled for users who cannot edit the current plan.
   - Saved plan table now calculates `Open / edit` vs `Open / view` per row, not from the currently selected plan.

8. Comment permissions
   - Comment POST access is limited to ADMIN, PLANNER, APPROVER, and REVIEWER.
   - VIEWER remains read-only.

## Verification performed

- Static syntax transpilation was run across all TypeScript/TSX files.
- Full `prisma generate` / `next build` could not be completed in this sandbox because Prisma engine binary download failed with DNS resolution to `binaries.prisma.sh`.
- The code changes are packaged without `node_modules`; run `npm ci && npx prisma generate && npm run build` in your normal development environment.

## Recommended follow-up tests

- PLANNER cannot PUT an APPROVED or SUBMITTED plan.
- REVIEWER cannot PATCH plan status.
- APPROVER cannot PUT plan content.
- PLANNER cannot create/update a plan for an unassigned department.
- VIEWER cannot POST comments.
- Department-scoped users cannot see other departments in `/api/departments`, `/api/plans`, budget summaries, or accounting rows.

## 2026-06-29 build fix

- Removed accidental `src/app/api/auth/login/page.tsx`, which conflicted with `src/app/api/auth/login/route.ts` and caused Next.js production build failure: two parallel pages resolving to `/api/auth/login`.
- Kept the real login UI at `src/app/login/page.tsx`.

## V3 local build cleanup note

If you extracted this bundle on top of an older project folder, old files are not automatically deleted by unzip/file-manager extraction. The stale file below can remain locally and still break production builds:

- `src/app/api/auth/login/page.tsx`

This bundle does not contain that file. It should contain only:

- `src/app/api/auth/login/route.ts`
- `src/app/login/page.tsx`

Run `./fix-local-build.sh` from the project root to remove stale local artifacts and verify the route layout.
