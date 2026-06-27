# VNH Business Plan Tool

A Docker-ready web app for building VNH-style annual business plans, allocating activities by quarter, generating monthly cashflow, importing existing Excel workbooks, tracking workflow status, keeping an audit trail, and exporting a corrected Excel workbook based on the fixed 61RB template.

## What is included

- Next.js web app
- PostgreSQL database via Prisma
- Dockerfile
- Docker Compose with bundled PostgreSQL
- Render Blueprint (`render.yaml`)
- Excel export using the fixed workbook template
- Excel import from compatible `61RB-BP` workbooks
- Editable saved business plans
- Approval/status workflow: `DRAFT`, `REVIEW`, `APPROVED`, `SUBMITTED`
- Audit history foundation
- Simple admin/user foundation through environment variables
- Business-plan calculation engine

## Local Docker deployment

```bash
docker compose up -d --build
```

Open:

```text
http://localhost:3000
```

The database is stored in the Docker named volume:

```text
business_plan_pgdata
```

## Seed sample data

After the containers are running:

```bash
docker compose exec web npm run seed
```

Refresh the browser and export the sample workbook.

## Development mode

Install dependencies:

```bash
npm install
```

Create `.env` from `.env.example`, then run PostgreSQL or use the Compose database:

```bash
docker compose up -d db
npm run prisma:push
npm run dev
```

## Environment variables

```text
DATABASE_URL="postgresql://businessplan:businessplan_password@localhost:5432/businessplan"
NEXT_PUBLIC_APP_NAME="VNH Business Plan Tool"
DEFAULT_ADMIN_EMAIL="admin@vnh.local"
DEFAULT_ADMIN_NAME="Business Plan Admin"
```

The MVP does not yet include a full login screen. Audit records are attributed to the default admin user above. This keeps the first private/hospital deployment simple while preserving the database structure needed for full roles later.

## Render deployment

This repository includes a `render.yaml` Blueprint. On Render, use the Docker web service and Render-managed PostgreSQL database.

Recommended Render mode:

```text
Docker app container + Render PostgreSQL
```

Recommended local/private mode:

```text
Docker Compose app container + PostgreSQL container + persistent volume
```

## Core budget rule

The allocation engine follows the fixed spreadsheet rule:

- Q1 = January, February, March
- Q2 = April, May, June
- Q3 = July, August, September
- Q4 = October, November, December

The selected quarter count determines how many months share the activity's recurrent budget.

Example:

```text
Activity cost = 1,200,000
Selected quarters = Q1 and Q3
Selected months = 6
Monthly amount = 200,000 for Jan, Feb, Mar, Jul, Aug, Sep
```

## Excel import

Use the file input in **Plan setup** to import a compatible workbook.

The importer reads the `61RB-BP` sheet from row 5 onward and maps:

```text
A  Sub Program
B  Corporate Plan Key Activity
C  Output / Service Target
D  Target For Year
E  Responsibility
F  Activity Number
G  Activity Description
H  Job Code
I  Description of Expenditure
J  Q1 marker
K  Q2 marker
L  Q3 marker
M  Q4 marker
N  Estimated Cost
O  Recurrent Budget
P  Development Partners
```

Imported data is loaded as a new unsaved draft. Review it, then save it.

## Template

The fixed spreadsheet template is stored at:

```text
templates/vnh-business-plan-template.xlsx
```

The export process writes activities into:

- `61RB-BP`
- `BP COSTING`
- `Cashflow 2026`

## Current MVP workflow

1. Create or import a business plan.
2. Add/edit activities.
3. Mark active quarters.
4. Review cashflow preview.
5. Save/update the plan.
6. Move through `DRAFT`, `REVIEW`, `APPROVED`, `SUBMITTED`.
7. Download the corrected Excel workbook.
8. Review audit history.

## Next recommended upgrades

- Real login and role-based access control
- Department-level user permissions
- PDF executive report export
- Import mapping screen for non-standard workbooks
- Version snapshots per submission
- Approval comments
- Multi-department planning dashboard
- AI expenditure-description helper


## Theme

This package uses a colorful dark-mode dashboard theme by default. The styling lives in `src/app/globals.css` and includes:

- dark gradient background
- glass-style panels
- bright workflow/status badges
- high-contrast form controls
- colorful KPI cards

To adjust the colors later, edit the CSS variables at the top of `src/app/globals.css`.
