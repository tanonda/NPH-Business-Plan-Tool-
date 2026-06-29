# VNH Business Plan Budget Control Pack

This pack combines the cosmetic/responsive review and the budget/accounting review into one implementation sweep.

## What was added

### UI / responsiveness
- New light government/hospital color scheme in `src/app/globals.css`.
- Stronger status badge styling for expanded workflow statuses.
- Mobile/tablet improvements for cards, forms, tables, and sticky actions.
- Budget Control and Accounting panels on the main dashboard.

### Spreadsheet reference-data integration
- Generated `src/lib/reference-data.ts` from the workbook `Lists` tab.
- Added reference-data fallback API: `GET /api/reference?list=...`.
- Added admin import endpoint: `POST /api/admin/reference/import`.
- Added `scripts/seed-reference-data.ts`.
- Added scripts:
  - `npm run seed:reference`
  - `npm run seed:all`
- Replaced risky free-text fields with reference dropdowns for:
  - Job code / cost center reference
  - Funding source
  - Budget category
  - Cascading account code
  - Activity categorisation
  - NSDP target

### Budget ceiling engine
- Added budget control models for ministry/department ceilings, allocations, virements, donor funds, and budget calculations.
- Added endpoint: `GET /api/budget/summary?year=2026`.
- Added endpoint: `POST /api/budget/ceilings` for Finance/Budget Officer/Admin.
- Available budget formula:

```txt
Available Budget = Government Approved Ceiling
+ Supplementary Allocation
+ Approved Virements In
+ Confirmed Donor Funds
- Approved Virements Out
- Restricted Funds
- Withdrawn/Reduced Funds
```

### Accounting execution tracking
- Added commitments/LPO tracking.
- Added actual expenditure tracking.
- Added endpoint: `GET/POST /api/accounting/commitments`.
- Added endpoint: `GET/POST /api/accounting/expenditures`.
- Added endpoint: `GET /api/accounting/summary?year=2026`.
- Remaining funds calculation now considers plan budget, commitments, and actual expenditure.

### Workflow expansion
- Added roles:
  - `ACCOUNTING`
  - `FINANCE`
  - `BUDGET_OFFICER`
  - `DONOR_MANAGER`
- Added statuses:
  - `RETURNED`
  - `BUDGET_REVIEW`
  - `FINANCE_REVIEW`
  - `BUDGET_CLEARED`
  - `EXECUTION`
  - `REJECTED`
  - `LOCKED`
- New workflow:

```txt
DRAFT → REVIEW → BUDGET_REVIEW → FINANCE_REVIEW → BUDGET_CLEARED → APPROVED → SUBMITTED → EXECUTION
```

with return/rejection support.

### Validation
- Submission/status-forward validation now checks:
  - required plan fields
  - required activity fields
  - budget greater than zero
  - job code from workbook reference data
  - funding source from reference data
  - budget category from reference data
  - account code from reference data
  - account code belongs to selected budget category
  - activity categorisation and NSDP target when selected

## Install / migration steps

After dropping these files into the app:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed:reference
npm run build
npm run start
```

For local development:

```bash
npm install
npx prisma generate
npx prisma db push
npm run seed:reference
npm run dev
```

## Important note

I could not fully run Prisma validation/build in the sandbox because `node_modules` and Prisma engine binaries were not installed locally, and the sandbox could not complete the Prisma package download. The code was checked structurally and the TypeScript command only produced dependency-related errors plus a few local type issues that were corrected.

## Files most likely to matter

- `prisma/schema.prisma`
- `prisma/migrations/202606290900_budget_control_pack/migration.sql`
- `src/lib/reference-data.ts`
- `src/lib/budget-control.ts`
- `src/lib/plan-validation.ts`
- `src/lib/approval-workflow.ts`
- `src/lib/plan-locking.ts`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/components/BudgetControlPanel.tsx`
- `src/components/AccountingDashboardPanel.tsx`
- `src/app/api/reference/route.ts`
- `src/app/api/budget/summary/route.ts`
- `src/app/api/budget/ceilings/route.ts`
- `src/app/api/accounting/summary/route.ts`
- `src/app/api/accounting/commitments/route.ts`
- `src/app/api/accounting/expenditures/route.ts`
- `scripts/seed-reference-data.ts`
