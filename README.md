# VNH Business Plan Tool

Updated README for the VNH Business Plan Tool through the V4.10 patch series.

This application is a Next.js + Prisma + PostgreSQL web app for creating, importing, editing, reviewing, approving, auditing, and exporting VNH-style annual business plans based on the Vanuatu National Hospital / 61RB business plan workbook structure.

The app is designed to replace fragile manual spreadsheet editing with a guided role-based web interface while still supporting Excel import/export for the official workbook format.

---

## 1. Current Version

```text
Current package: vnh-business-plan-tool-lists-budget-ai-fixed-v4-10.zip
Current patch level: V4.10
Status: Builds successfully locally with Next.js 14.2.35
```

The latest verified local build flow is:

```bash
rm -rf .next node_modules
npm ci
npx prisma generate
npx prisma db push
npm run build
npm run dev
```

---

## 2. Main Capabilities

The app currently supports:

- Secure login/logout
- Session-cookie authentication
- Role-based access control
- Department-scoped plan access
- Excel workbook import
- Business plan creation and update
- Activity editing
- Cashflow generation
- Reference dropdown lists from workbook-style list data
- Add-missing-code controls for dropdowns
- Budget ceiling monitoring
- Over-ceiling justification
- Approval workflow
- Comments
- Audit logs
- Approval snapshots
- Snapshot dashboard
- Snapshot JSON export
- Excel/PDF export support foundations
- Admin user management
- Role & Access Test Panel
- Budget Control dashboard
- Accounting / Spending Tracker dashboard
- AI description helper with create and optimize modes

---

## 3. Technology Stack

```text
Frontend: Next.js App Router, React, TypeScript
Backend: Next.js API routes
Database: PostgreSQL
ORM: Prisma
Import/export: Excel workbook parser/writer
Styling: Dark dashboard theme in src/app/globals.css
Deployment: Local Node, Docker Compose, or Render-style deployment
```

---

## 4. Project Structure

Typical structure:

```text
vnh-business-plan-tool/
├── Dockerfile
├── docker-compose.yml
├── render.yaml
├── README.md
├── package.json
├── .env.example
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── templates/
│   └── vnh-business-plan-template.xlsx
└── src/
    ├── app/
    │   ├── api/
    │   ├── login/
    │   ├── page.tsx
    │   └── globals.css
    ├── components/
    └── lib/
```

Important access-control files:

```text
src/lib/access-policy.ts
src/lib/department-access.ts
src/lib/budget-ceiling.ts
src/lib/plan-locking.ts
src/lib/approval-workflow.ts
```

---

## 5. Environment Variables

Create `.env` from `.env.example` and configure:

```text
DATABASE_URL="postgresql://businessplan:businessplan_password@localhost:5432/businessplan"
NEXT_PUBLIC_APP_NAME="VNH Business Plan Tool"
DEFAULT_ADMIN_EMAIL="admin@vnh.local"
DEFAULT_ADMIN_NAME="Business Plan Admin"
DEFAULT_ADMIN_PASSWORD="change-this-before-production"
SESSION_SECRET="replace-with-a-long-random-secret"
```

For production, `DEFAULT_ADMIN_PASSWORD` must be explicitly set. Do not rely on a fallback password.

---

## 6. Local Development

Install dependencies and prepare Prisma:

```bash
npm ci
npx prisma generate
npx prisma db push
npm run dev
```

Open:

```text
http://localhost:3000
```

Production build test:

```bash
npm run build
```

Clean rebuild:

```bash
rm -rf .next node_modules
npm ci
npx prisma generate
npx prisma db push
npm run build
npm run dev
```

---

## 7. Docker Deployment

Start locally with Docker Compose:

```bash
docker compose up -d --build
```

Open:

```text
http://localhost:3000
```

View logs:

```bash
docker compose logs web
docker compose logs db
```

Stop containers:

```bash
docker compose down
```

Delete the database volume only if you intentionally want to wipe local data:

```bash
docker compose down -v
```

---

## 8. Official User Roles

The official user-facing roles are:

```text
ADMIN
PLANNER
APPROVER
REVIEWER
VIEWER
ACCOUNTING
FINANCE
BUDGET_OFFICER
DONOR_MANAGER
```

`BUDGET_PLANNER` was removed from user-facing controls. If older data contains `BUDGET_PLANNER`, it should be treated as a hidden legacy alias for `BUDGET_OFFICER` where applicable.

---

## 9. Role Capability Summary

| Capability | ADMIN | PLANNER | APPROVER | REVIEWER | VIEWER | ACCOUNTING | FINANCE | BUDGET_OFFICER | DONOR_MANAGER |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Login | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| View assigned plans | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| View all departments | Yes | Optional | Optional | Optional | No | Optional | Optional | Optional | Optional |
| Create/import plan | Yes | Yes | No | No | No | Limited | Limited | Limited | No |
| Edit draft plan content | Yes | Yes | No | No | No | Limited | Limited | Limited | No |
| Comment | Yes | Yes | Yes | Yes | No | Yes | Yes | Yes | Yes |
| Submit draft to review | Yes | Yes | No | No | No | No | No | No | No |
| Approve review plan | Yes | No | Yes | No | No | No | No | No | No |
| Submit approved final | Yes | No | Yes | No | No | No | No | No | No |
| Edit budget ceiling | Yes | No | No | No | No | No | Yes | Yes | No |
| View budget dashboard | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Accounting/spending access | Yes | No | View | View | View | Yes | Yes | Yes | View |
| Manage users | Yes | No | No | No | No | No | No | No | No |
| Manage reference lists | Yes | Yes | No | No | No | Yes | Yes | Yes | Yes |
| Export snapshots/reports | Yes | Scoped | Scoped | Scoped | Scoped | Scoped | Scoped | Scoped | Scoped |

Notes:

- `Limited` means subject to department assignment and workflow state.
- `Optional` all-department access must be explicitly granted by ADMIN.
- Route/API protections are enforced server-side, not only in the UI.

---

## 10. Department Access Model

Department access supports:

```text
OWNER
EDITOR
REVIEWER
VIEWER
```

Default assignment by role:

```text
PLANNER         -> EDITOR
ACCOUNTING      -> EDITOR
FINANCE         -> EDITOR
BUDGET_OFFICER  -> EDITOR
APPROVER        -> REVIEWER
REVIEWER        -> REVIEWER
DONOR_MANAGER   -> REVIEWER
VIEWER          -> VIEWER
```

ADMIN can override department access and grant all-department access where appropriate.

Important V4.10 update:

- Plan creation and plan update now use the same assigned-department fallback.
- A planner who is assigned to a department can create and update DRAFT/RETURNED plans for that assigned department, even if older database records still have a weaker access level.
- This fallback does not bypass plan locking.
- Plans in `REVIEW`, `APPROVED`, `SUBMITTED`, and other locked states remain protected.

---

## 11. Workflow

Current approved workflow:

```text
DRAFT -> REVIEW -> APPROVED -> SUBMITTED
```

Allowed transitions:

```text
ADMIN:
  override where appropriate

PLANNER:
  DRAFT -> REVIEW
  RETURNED -> REVIEW

APPROVER:
  REVIEW -> APPROVED
  REVIEW -> RETURNED
  REVIEW -> REJECTED
  APPROVED -> SUBMITTED

REVIEWER:
  no status changes

VIEWER:
  no status changes
```

Expanded finance/budget states may exist in older code/data, but the official current business-plan workflow is the four-step flow above.

---

## 12. Plan Locking Rules

Plan content editing is allowed only when role, department access, and status all permit it.

PLANNER can edit:

```text
DRAFT
RETURNED
```

PLANNER cannot edit:

```text
REVIEW
APPROVED
SUBMITTED
REJECTED
LOCKED
```

APPROVER, REVIEWER, VIEWER, and DONOR_MANAGER cannot edit plan content unless explicitly expanded later.

ADMIN can override.

Server-side update routes enforce plan locking. UI disabling is not treated as the only protection.

---

## 13. Excel Import

Use the file input in Plan setup to import a compatible `.xlsx` workbook.

The importer reads the `61RB-BP` sheet and maps workbook fields into the draft plan form.

Typical imported fields:

```text
Sub Program
Corporate Plan Key Activity
Output / Service Target
Target For Year
Responsibility
Activity Number
Activity Description
Job Code
Description of Expenditure
Quarter markers Q1-Q4
Estimated Cost
Recurrent Budget
Development Partners
```

After import:

1. Review the loaded draft.
2. Confirm the Department dropdown.
3. Confirm cost center and job code values.
4. Add over-ceiling justification if required.
5. Save the business plan.

---

## 14. Reference Lists and Dropdowns

The app now separates and supports the spreadsheet-style list data that drives form dropdowns.

Supported reference lists:

```text
job-codes
cost-centers
activity-categories
funding-sources
budget-categories
account-codes
nsdp-targets
departments
```

Dropdown behavior:

- Job code dropdown uses job-code references.
- Cost center dropdown uses cost-center references.
- Activity category dropdown uses activity categorisation references.
- Funding source dropdown uses funding-source references.
- Budget category dropdown uses budget-category references.
- Account code dropdown shows the available account-code list and is no longer overly restricted by the selected category.
- Department dropdown uses app department assignments, not only spreadsheet labels.

Added missing-code controls:

```text
Add missing job code
Add missing cost center
Add missing account code
```

Authorized roles can create missing reference values through `POST /api/reference`.

Authorized reference-list roles:

```text
ADMIN
PLANNER
ACCOUNTING
FINANCE
BUDGET_OFFICER
DONOR_MANAGER
```

Scholarship-related account codes added from workbook/list review include:

```text
8CPA - Allowances - Scholarships
8CPE - Fees - Scholarships
```

---

## 15. Budget Ceiling Rules

Budget ceiling control was corrected in V4.9.

Roles that can edit/set budget ceilings:

```text
ADMIN
FINANCE
BUDGET_OFFICER
```

PLANNER cannot edit the ceiling amount.

PLANNER can:

```text
View the ceiling
Create a plan
Save a plan
Plan above the ceiling
Write an over-ceiling justification
Submit for review after justification is provided
```

PLANNER cannot:

```text
Change the approved ceiling amount
Use API calls to update ceiling amount
Use Budget Control ceiling update controls
```

Backend enforcement protects ceiling fields even if the UI is bypassed.

---

## 16. Over-Ceiling Planning Logic

A plan may exceed the current ceiling.

This is intentional because planning often identifies budget needs before funding is formally available.

When plan budget exceeds ceiling:

- The plan can still be saved.
- The UI shows an over-ceiling warning.
- The planner must provide an over-ceiling justification before submitting for review.
- Finance/accounting/budget roles can later raise the ceiling, plan a future referral, or identify available funds.

The over-ceiling justification field is stored on the business plan.

---

## 17. Budget Control Dashboard

Budget Control supports:

```text
Ceiling
Donor amount
Available amount
Plan amount
Committed amount
Actual amount
Remaining amount
Risk/warning indicators
```

V4.6 fixed the empty-state issue:

- Empty/reference-only cost centers no longer show fake issues.
- A cost center with `0` ceiling is not automatically an issue unless it has active budget activity.
- Budget recommendations now show a clean empty-state message when no plan, commitment, expenditure, or ceiling activity exists.

Empty state message:

```text
No active budget activity yet. Import/save a plan or enter ceilings to begin budget monitoring.
```

---

## 18. Accounting and Spending Tracker

The accounting/spending dashboard is available for appropriate finance/accounting/budget users and visible according to role policy.

Reference dropdown improvements include:

- Cost center dropdowns
- Account code dropdowns
- Separated cost-center and job-code values

Budget/accounting dashboard APIs are department/cost-center scoped.

---

## 19. AI Description Helper

The expenditure description helper now supports two distinct actions:

```text
Create with AI
Optimize text
```

Use `Create with AI` when the field is blank or when the planner wants a generated starting point.

Use `Optimize text` when the planner has already manually written a description and wants it cleaned up, clarified, or strengthened.

API route:

```text
/api/expenditure-description-helper
```

---

## 20. Comments

Allowed comment roles:

```text
ADMIN
PLANNER
APPROVER
REVIEWER
ACCOUNTING
FINANCE
BUDGET_OFFICER
DONOR_MANAGER
```

VIEWER is read-only.

---

## 21. Audit Logs and Snapshots

The app supports:

- Audit history
- Status-change audit records
- Plan update audit records
- Approval snapshots
- Snapshot dashboard
- Snapshot JSON export
- Plan comparison view

Relevant routes include:

```text
/api/plans/[id]/audit
/api/plans/[id]/snapshots
/api/plans/[id]/snapshots/[snapshotId]
/api/plans/[id]/snapshots/[snapshotId]/export
/api/plans/[id]/comparison
```

---

## 22. Authentication and Session Handling

The app includes:

- Login page
- Logout action
- Auth session check
- Session cookie handling
- No silent default-admin access
- Branded session-check screen

V4.2 fixed a hydration issue on the login page by changing label/input structure to safe `htmlFor` and `id` pairs.

V4.8 improved the session authentication screen with a branded loading card, progress animation, and cleaner text.

---

## 23. Admin/User Management

ADMIN can:

- Create users
- Assign roles
- Activate/deactivate users
- Reset temporary passwords
- Assign departments
- Set department access levels
- Grant all-department access where appropriate
- Use the Role & Access Test Panel

Important: after role/deployment changes, re-open affected users in ADMIN -> User Management and confirm department assignments/access levels.

---

## 24. Important API Routes

Authentication:

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/password
```

Plans:

```text
GET    /api/plans
POST   /api/plans
GET    /api/plans/[id]
PUT    /api/plans/[id]
DELETE /api/plans/[id]
POST   /api/plans/[id]/status
```

Plan supporting routes:

```text
/api/plans/[id]/comments
/api/plans/[id]/audit
/api/plans/[id]/snapshots
/api/plans/[id]/comparison
/api/plans/[id]/export
/api/plans/[id]/executive-report
```

Reference data:

```text
GET  /api/reference?list=job-codes
GET  /api/reference?list=cost-centers
GET  /api/reference?list=account-codes
GET  /api/reference?list=budget-categories
GET  /api/reference?list=funding-sources
GET  /api/reference?list=activity-categories
GET  /api/reference?list=nsdp-targets
POST /api/reference
POST /api/admin/reference/import
```

Budget/accounting:

```text
/api/budget/summary
/api/budget/ceilings
/api/accounting/summary
/api/accounting/commitments
/api/accounting/expenditures
```

Admin:

```text
/api/users
/api/users/[id]
/api/users/[id]/departments
/api/admin/access-test
```

Import/AI:

```text
/api/import-excel
/api/import-excel-mapped
/api/expenditure-description-helper
```

---

## 25. Key Patch History

### Access Policy Fixes

- Added centralized access policy.
- Rewired workflow and locking rules.
- Fixed server-side plan locking.
- Blocked REVIEWER and VIEWER from status changes.
- Aligned workflow to DRAFT -> REVIEW -> APPROVED -> SUBMITTED.

### Department Access Fixes

- Added department edit/review guards.
- Prevented users from working outside assigned departments.
- Added assigned-department fallback for legacy records.
- Fixed planner create/save/update flow.

### Reference List Fixes

- Mapped spreadsheet Lists tab into app reference data.
- Added job-code and cost-center lists.
- Added add-missing-code controls.
- Separated job code from cost center code.
- Improved account-code dropdown behavior.

### Budget and Ceiling Fixes

- Added over-ceiling justification.
- Allowed planners to plan above ceiling.
- Restricted ceiling edits to ADMIN, FINANCE, and BUDGET_OFFICER.
- Fixed empty budget dashboard warnings.

### Role Fixes

- Finalized official role list.
- Removed BUDGET_PLANNER from user-facing controls.
- Added DONOR_MANAGER coverage.
- Fixed department assignment defaults for accounting/finance/budget/donor roles.

### UI Fixes

- Fixed login hydration bug.
- Improved session-check screen.
- Added spacing between Accounting/Spending Tracker and Business Plan Tool sections.
- Improved dashboard empty-state behavior.

### Update Save Fix

- Fixed `PUT /api/plans/[id] 403` after successful plan creation.
- Existing DRAFT/RETURNED plan updates now use the same assigned-department fallback as plan creation.

---

## 26. Testing Checklist

After installing a new bundle, test the following:

### ADMIN

```text
1. Login as ADMIN.
2. Confirm dashboard loads.
3. Open User Management.
4. Confirm all official roles appear.
5. Assign a planner to a department.
6. Assign accounting/finance/budget users to departments.
7. Confirm budget ceiling controls are available to ADMIN.
8. Confirm fake budget issues do not show when no plans exist.
```

### PLANNER

```text
1. Login as PLANNER.
2. Import the Excel workbook.
3. Confirm Department is selected or selectable.
4. Confirm Job code dropdown loads.
5. Confirm Cost center dropdown loads.
6. Confirm ceiling amount is read-only.
7. Enter over-ceiling justification if plan is over ceiling.
8. Save business plan.
9. Make a small edit.
10. Update business plan.
11. Submit for review.
```

### APPROVER

```text
1. Login as APPROVER.
2. Open plan in REVIEW.
3. Confirm plan content is read-only.
4. Add comment if needed.
5. Approve, return, or reject.
6. Submit final when approved.
```

### FINANCE / BUDGET_OFFICER

```text
1. Login as FINANCE or BUDGET_OFFICER.
2. Confirm budget dashboard access.
3. Confirm ceiling controls are available.
4. Update ceiling if allowed.
5. Confirm accounting/budget views are department-scoped.
```

### ACCOUNTING

```text
1. Login as ACCOUNTING.
2. Confirm accounting dashboard access.
3. Confirm account-code and cost-center dropdowns load.
4. Confirm department scoping.
```

### DONOR_MANAGER

```text
1. Login as DONOR_MANAGER.
2. Confirm plan view access.
3. Confirm comment access.
4. Confirm donor/funding reference creation where appropriate.
5. Confirm no unauthorized plan content editing.
```

### VIEWER

```text
1. Login as VIEWER.
2. Confirm read-only behavior.
3. Confirm no edit/status/comment controls are available.
```

---

## 27. Troubleshooting

### Build succeeds but browser shows extension console errors

Console messages like these are usually browser extension noise, not app errors:

```text
ShowOneChild.js
ActionableCoachmark is not defined
showOneChild is not defined
Grammarly extra attributes
Chrome devtools app-specific JSON 404
```

Test in an incognito window with extensions disabled if needed.

### Duplicate login API/page error

If you see:

```text
You cannot have two parallel pages that resolve to the same path.
src/app/api/auth/login/page.tsx
src/app/api/auth/login/route.ts
```

Delete the stale file:

```bash
rm -f src/app/api/auth/login/page.tsx
rm -rf .next
npm run build
```

The valid files are:

```text
src/app/api/auth/login/route.ts
src/app/login/page.tsx
```

### Planner can see department but cannot save

Confirm the user has a department assignment in ADMIN -> User Management.

For older records, V4.10 includes an assigned-department fallback for PLANNER, ACCOUNTING, FINANCE, and BUDGET_OFFICER, but the clean fix is still to set correct department access levels:

```text
PLANNER -> EDITOR
ACCOUNTING -> EDITOR
FINANCE -> EDITOR
BUDGET_OFFICER -> EDITOR
```

### Planner can save but cannot update

Use V4.10 or later. V4.10 fixed the existing-plan update guard.

Expected successful log flow:

```text
POST /api/import-excel 200
POST /api/plans 201
PUT /api/plans/[id] 200
```

### Budget dashboard shows issues with no plans

Use V4.6 or later. V4.6 fixed empty/reference-only cost centers showing fake issues.

### Hydration error on login page

Use V4.2 or later. V4.2 fixed the unsafe label/input nesting.

### Prisma client or build errors after extracting new bundle

Run a clean rebuild:

```bash
rm -rf .next node_modules
npm ci
npx prisma generate
npx prisma db push
npm run build
npm run dev
```

Avoid extracting a new bundle over an old folder if deleted files may remain. Prefer deleting the old project folder or using a fresh folder.

---

## 28. Security Notes

- Authorization is enforced server-side.
- UI locking is not the only security boundary.
- Session cookies should be HttpOnly and Secure in production.
- Default admin credentials must be changed before production.
- Do not expose local `.env` files.
- Do not run `npm audit fix --force` casually; it may introduce breaking dependency changes.

---

## 29. Recommended Next Improvements

Suggested next improvements after V4.10:

```text
1. Add automated role/access tests.
2. Add Playwright smoke tests for each role.
3. Add a full role-permission matrix page for ADMIN.
4. Add first-login temporary password change enforcement.
5. Add session invalidation after password reset.
6. Add formal budget referral workflow for over-ceiling plans.
7. Add donor/funding-specific review dashboard for DONOR_MANAGER.
8. Add import preview/mapping screen for non-standard workbooks.
9. Add better audit diff display for activity changes.
10. Add production deployment guide for hospital LAN/private cloud.
```

---

## 30. Current Known Good Commands

For local development:

```bash
rm -rf .next node_modules
npm ci
npx prisma generate
npx prisma db push
npm run build
npm run dev
```

For Docker:

```bash
docker compose up -d --build
```

For database reset during testing only:

```bash
docker compose down -v
```

---

## 31. Current Known Good Role Set

Use exactly these roles in user-facing controls:

```text
ADMIN
PLANNER
APPROVER
REVIEWER
VIEWER
ACCOUNTING
FINANCE
BUDGET_OFFICER
DONOR_MANAGER
```

Do not add `BUDGET_PLANNER` back to the UI unless the role model is formally changed again.

---

## 32. Current Known Good Workflow

Use this workflow:

```text
DRAFT -> REVIEW -> APPROVED -> SUBMITTED
```

Keep plan editing restricted to DRAFT/RETURNED unless ADMIN override is required.

---

## 33. Current Known Good Ceiling Policy

Use this ceiling policy:

```text
Can edit ceiling:
- ADMIN
- FINANCE
- BUDGET_OFFICER

Cannot edit ceiling:
- PLANNER
- APPROVER
- REVIEWER
- VIEWER
- ACCOUNTING
- DONOR_MANAGER
```

PLANNER can exceed the ceiling only as a planning request with justification.

---

## 34. Final Notes

The app has evolved from a spreadsheet-inspired MVP into a role-based planning, budget-control, and approval workflow tool. The most important principle going forward is to keep policy centralized:

```text
One role list
One access policy
One workflow map
One department access model
One budget ceiling rule
```

When adding new features, update the central policy first, then the API guards, then the UI.
