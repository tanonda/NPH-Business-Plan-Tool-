# Lists, Budget Ceiling, and AI Description Patch Notes

## Spreadsheet Lists tab mapping
Mapped the workbook Lists tab into application reference data:

- `Lists!A:B` → Departments and Job Codes
- `Lists!D:D` → Activity Categorisation
- `Lists!F:F` → Funding Sources
- `Lists!H:H` → Budget Categories
- `Lists!J:J` → Travel account codes
- `Lists!L:L` → Admin account codes
- `Lists!N:N` → Procurement account codes
- `Lists!P:P` → Logistics account codes
- `Lists!R:R` → Finance_HR account codes, including Scholarship codes such as `8CPA - Allowances - Scholarships` and `8CPE - Fees - Scholarships`
- `Lists!T:T` → Assets_Infra account codes
- `Lists!V:V` → Medical_Treatment account codes
- `Lists!X:X` → NSDP Targets

## App changes

- Added `job-codes` and `cost-centers` reference lists.
- Updated `/api/reference` to return workbook fallback values merged with DB-created values.
- Added `POST /api/reference` so authorized users can create missing dropdown items from the UI.
- Changed account code dropdowns so they show the full account-code list, not only the currently selected category.
- Added inline buttons to add missing job codes, cost centers, and account codes.
- Updated plan activity form to separate `Job code` and `Cost center code` instead of treating them as one coupled dropdown.
- Updated Accounting commitment/expenditure entry forms to use account-code and cost-center dropdowns.

## Budget ceiling logic

- Added `BusinessPlan.ceilingJustification`.
- Plans can be saved even when estimated cost exceeds the budget ceiling.
- Over-ceiling plans show a warning and variance.
- Submitting an over-ceiling plan to review now requires an over-ceiling justification.
- This allows accounting/finance to increase the ceiling, identify available funds, or mark the item for future budget referral.

## AI description logic

- The expenditure description field now has two actions:
  - `Create with AI`: creates a new description from the activity details.
  - `Optimize text`: improves the planner's existing manually written description.
- The API supports `operation: "create"` and `operation: "optimize"`.
- If `OPENAI_API_KEY` is missing, the app still uses the local rules fallback.

## Migration

Added migration:

```sql
ALTER TABLE "BusinessPlan" ADD COLUMN IF NOT EXISTS "ceilingJustification" TEXT NOT NULL DEFAULT '';
```

Run:

```bash
npx prisma migrate dev
# or for a quick local sync
npx prisma db push
```

## V4.1 TypeScript Build Fix

- Fixed `src/app/api/plans/[id]/status/route.ts` so validated workflow status values are cast to Prisma's generated `PlanStatus` enum before writing to `BusinessPlan.status`.
- This addresses the production build error:
  `Type 'string' is not assignable to type 'PlanStatus | EnumPlanStatusFieldUpdateOperationsInput | undefined'.`
- Build verification in this sandbox was blocked by Prisma engine DNS download failure to `binaries.prisma.sh`; the patch is a direct type fix for the exact reported line.


## V4.2 Login Hydration Fix

- Fixed login hydration mismatch caused by wrapping input controls inside `<label>` elements.
- Login fields now use explicit `htmlFor` / `id` pairs and a sibling `.login-field` wrapper.
- This avoids browser/password-manager injected `<div>` elements appearing inside labels and causing React hydration mismatch.
