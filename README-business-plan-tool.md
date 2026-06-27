# VNH Business Plan Tool

A Docker-ready and Render-deployable web application for creating, editing, importing, validating, and exporting annual business plans based on the Vanuatu National Hospital Emergency Department business plan workbook structure.

This tool is designed to replace fragile manual spreadsheet editing with a guided web interface while still allowing Excel import/export when needed.

---

## 1. What This App Does

The Business Plan Tool allows users to:

- Create a business plan for a budget year
- Add and edit activities
- Enter descriptions of expenditure
- Mark activity timing by quarter: Q1, Q2, Q3, Q4
- Calculate monthly cashflow automatically
- Track estimated cost, recurrent budget, and unfunded amounts
- Import activities from a compatible Excel workbook
- Export the completed workbook back to Excel
- Track plan workflow status
- Keep a basic audit history of changes
- Deploy locally, on a private server, or on Render

---

## 2. Main Features

### Business Plan Management

- Create plans
- Edit saved plans
- Load existing plans
- Update activities without creating duplicates
- Track annual budget plan details

### Excel Import

The app can import a compatible `.xlsx` workbook and read from the `61RB-BP` tab.

Imported fields include:

- Activity name
- Description of expenditure
- Estimated cost
- Recurrent budget
- Development partner / external funding values, where available
- Quarter markers: Q1, Q2, Q3, Q4

### Excel Export

The app can generate an Excel workbook using the bundled business plan template.

The export is intended to preserve the spreadsheet-style output while allowing the web app/database to remain the source of truth.

### Workflow Status

Plans can move through these statuses:

```text
DRAFT
REVIEW
APPROVED
SUBMITTED
```

### Audit History

The upgraded version includes audit scaffolding for:

- Plan creation
- Plan updates
- Activity changes
- Status changes
- Import actions
- Export actions

A default admin-style user is used for now. Proper login and role-based access can be added later.

---

## 3. Recommended Deployment Options

There are three main ways to run the app.

### Option A — Docker Compose Local / Private Server Deployment

Recommended for:

- Your laptop
- A hospital LAN server
- A mini PC
- A private data center
- Offline or semi-offline deployment

This runs:

```text
Web app container + PostgreSQL container + persistent database volume
```

### Option B — Windows PC Without Docker

Recommended only when Docker is not available.

This requires installing manually:

```text
Node.js + PostgreSQL + Git
```

### Option C — Render Cloud Deployment

Recommended for cloud hosting.

Best setup:

```text
Dockerized web app + Render managed PostgreSQL
```

For Render, do not bundle PostgreSQL inside the same web container. Use Render PostgreSQL instead.

---

## 4. Project Structure

Typical project layout:

```text
business-plan-tool/
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
    └── lib/
```

---

## 5. Running Locally With Docker

### 5.1 Prerequisites

Install:

- Docker Desktop
- Git, optional but recommended

### 5.2 Unzip the Project

```bash
unzip vnh-business-plan-tool-darkmode.zip
cd business-plan-tool
```

### 5.3 Start the App

```bash
docker compose up -d --build
```

### 5.4 Open the App

Open your browser and go to:

```text
http://localhost:3000
```

### 5.5 Check Containers

```bash
docker compose ps
```

### 5.6 View Logs

```bash
docker compose logs web
```

```bash
docker compose logs db
```

### 5.7 Run Database Migrations Manually, If Needed

```bash
docker compose exec web npx prisma migrate deploy
```

### 5.8 Seed Sample Data, Optional

```bash
docker compose exec web npm run seed
```

### 5.9 Stop the App

```bash
docker compose down
```

### 5.10 Stop the App and Remove Database Volume

Only use this if you intentionally want to delete the local database data.

```bash
docker compose down -v
```

Warning: `-v` removes the PostgreSQL volume. That can delete your saved plans.

---

## 6. Running on a Windows PC Without Docker

Use this when the target Windows computer does not have Docker installed.

### 6.1 Install Required Software

Install these first:

1. Node.js LTS
2. PostgreSQL
3. Git
4. VS Code, optional

During PostgreSQL installation, remember the password you set for the `postgres` user.

### 6.2 Unzip the Project

Open PowerShell and run:

```powershell
cd C:\Users\YourName\Documents
Expand-Archive .\vnh-business-plan-tool-darkmode.zip -DestinationPath .
cd .\business-plan-tool
```

Replace `YourName` with your actual Windows username.

### 6.3 Install Node Dependencies

```powershell
npm install
```

### 6.4 Create the PostgreSQL Database

If `psql` is available in PowerShell, run:

```powershell
psql -U postgres
```

Then inside PostgreSQL, run:

```sql
CREATE DATABASE businessplan;
CREATE USER businessplan WITH PASSWORD 'businessplan_password';
GRANT ALL PRIVILEGES ON DATABASE businessplan TO businessplan;
\q
```

If `psql` is not available, you can create the database using pgAdmin:

1. Open pgAdmin
2. Connect to the local PostgreSQL server
3. Create a database named `businessplan`
4. Create a user named `businessplan`
5. Set the password to `businessplan_password`
6. Grant the user privileges to the `businessplan` database

### 6.5 Create the Environment File

Copy `.env.example` to `.env`:

```powershell
copy .env.example .env
```

Open `.env` and set:

```env
DATABASE_URL="postgresql://businessplan:businessplan_password@localhost:5432/businessplan"
NODE_ENV="development"
```

If your PostgreSQL password is different, update the password in the `DATABASE_URL`.

### 6.6 Generate Prisma Client

```powershell
npx prisma generate
```

### 6.7 Run Database Migrations

```powershell
npx prisma migrate deploy
```

### 6.8 Seed Sample Data, Optional

```powershell
npm run seed
```

### 6.9 Start Development Server

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 7. Windows Quick Command Sequence

After PostgreSQL, Node.js, and Git are installed, the common command sequence is:

```powershell
cd C:\Users\YourName\Documents
Expand-Archive .\vnh-business-plan-tool-darkmode.zip -DestinationPath .
cd .\business-plan-tool

npm install
copy .env.example .env

npx prisma generate
npx prisma migrate deploy
npm run seed

npm run dev
```

Then open:

```text
http://localhost:3000
```

---

## 8. Production-Style Local Run Without Docker

After confirming development mode works, build the app:

```powershell
npm run build
```

Start the production server:

```powershell
npm run start
```

Open:

```text
http://localhost:3000
```

Note: PostgreSQL must still be installed and running separately.

---

## 9. Git Workflow Before Render

Recommended workflow:

1. Test locally first
2. Confirm create/edit/import/export works
3. Commit to Git
4. Push to GitHub
5. Connect Render to the GitHub repository
6. Deploy using the included `render.yaml`

### 9.1 Initialize Git

```bash
git init
git add .
git commit -m "Initial VNH business plan tool"
```

### 9.2 Set Main Branch

```bash
git branch -M main
```

### 9.3 Add Remote Repository

```bash
git remote add origin <your-github-repo-url>
```

### 9.4 Push to GitHub

```bash
git push -u origin main
```

Replace `<your-github-repo-url>` with your actual GitHub repository URL.

---

## 10. Important Git Security Notes

Do not commit real secrets.

Safe to commit:

```text
.env.example
Dockerfile
docker-compose.yml
render.yaml
README.md
```

Do not commit:

```text
.env
real database passwords
API keys
private credentials
production secrets
```

Make sure `.gitignore` contains:

```gitignore
.env
node_modules
.next
.DS_Store
*.log
```

---

## 11. Render Deployment

### 11.1 Recommended Render Setup

For Render production deployment, use:

```text
Docker web service + Render managed PostgreSQL
```

Do not run PostgreSQL inside the same web container on Render.

### 11.2 Files Used by Render

Render will use:

```text
render.yaml
Dockerfile
```

### 11.3 Render Blueprint Shape

The included `render.yaml` should define:

- Web service
- PostgreSQL database
- `DATABASE_URL` environment variable
- `NODE_ENV=production`

Example structure:

```yaml
services:
  - type: web
    name: business-plan-tool
    runtime: docker
    plan: starter
    dockerfilePath: ./Dockerfile
    dockerContext: .
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: business-plan-db
          property: connectionString
      - key: NODE_ENV
        value: production

databases:
  - name: business-plan-db
    plan: starter
```

### 11.4 Render Deployment Steps

1. Push the project to GitHub
2. Log into Render
3. Create a new Blueprint
4. Connect the GitHub repository
5. Let Render read `render.yaml`
6. Confirm service/database creation
7. Deploy

---

## 12. What to Test Before Pushing to Render

Before pushing to GitHub/Render, test the core workflow locally:

```text
Create plan
Edit plan
Import Excel
Export Excel
Change status
Check audit log
Restart app
Confirm saved data still exists
```

For Docker:

```bash
docker compose ps
docker compose logs web
docker compose logs db
```

For non-Docker Windows:

```powershell
npm run dev
```

Then check:

```text
http://localhost:3000
```

---

## 13. Dark Mode Theme Notes

The dark-mode version includes:

- Dark gradient background
- Glass-style panels
- Colorful KPI cards
- Brighter workflow/status badges
- High-contrast form fields
- Neon-style action buttons
- Dark table styling

Theme files are usually located in:

```text
src/app/globals.css
src/app/page.tsx
src/components/
```

Adjust colors in the CSS/Tailwind classes if you want a different look.

Suggested style direction:

```text
Dark navy background
Cyan and purple highlights
Green for approved/positive values
Amber for review/warnings
Red for unfunded/negative warnings
```

---

## 14. Database Notes

The app uses PostgreSQL.

For Docker deployment, PostgreSQL runs as a Docker service and stores data in a named volume.

For Windows without Docker, PostgreSQL must be installed and running directly on Windows.

For Render, PostgreSQL should be provided by Render as a managed database.

---

## 15. Troubleshooting

### App does not open at localhost:3000

Check if the app is running.

Docker:

```bash
docker compose ps
```

Windows without Docker:

```powershell
npm run dev
```

### Database connection error

Check your `DATABASE_URL`.

Docker example:

```env
DATABASE_URL="postgresql://businessplan:businessplan_password@db:5432/businessplan"
```

Windows local PostgreSQL example:

```env
DATABASE_URL="postgresql://businessplan:businessplan_password@localhost:5432/businessplan"
```

### Prisma client error

Run:

```bash
npx prisma generate
```

Then restart the app.

### Migration error

Run:

```bash
npx prisma migrate deploy
```

If developing locally and you intentionally want to reset the database, use with caution:

```bash
npx prisma migrate reset
```

Warning: this can delete database data.

### Port already in use

Another app may already be using port `3000`.

Change the port or stop the other app.

For development, you can try:

```bash
npm run dev -- -p 3001
```

Then open:

```text
http://localhost:3001
```

### Docker database data disappeared

Check if the volume was removed.

Avoid running this unless you want to delete data:

```bash
docker compose down -v
```

---

## 16. Recommended Next Upgrades

Future improvements:

- Real login/authentication
- Role-based access control
- Department-level permissions
- Multi-year business plans
- Approval comments
- Version history
- PDF export
- Dashboard charts
- Stronger Excel import validation
- Better workbook template mapping
- Backups and restore interface
- Windows desktop launcher
- LAN deployment instructions

---

## 17. Deployment Recommendation Summary

Use this pattern:

```text
Local/private deployment:
Docker Compose with web + PostgreSQL containers

Windows without Docker:
Node.js + PostgreSQL installed directly

Render cloud deployment:
Dockerized web app + Render managed PostgreSQL
```

This keeps the project portable, professional, and easier to maintain.

---

## 18. Basic Support Checklist

When something goes wrong, check in this order:

1. Is PostgreSQL running?
2. Is `DATABASE_URL` correct?
3. Did `npm install` complete?
4. Did `npx prisma generate` run?
5. Did `npx prisma migrate deploy` run?
6. Is the app running on port 3000?
7. Are there errors in the logs?
8. Does the browser show `http://localhost:3000`?

For Docker:

```bash
docker compose logs web
```

For Windows without Docker:

```powershell
npm run dev
```

Read the error message carefully. Most startup issues are database URL, missing migration, or port conflicts.

---

## 19. Final Note

The app is designed so the database becomes the source of truth and Excel becomes the import/export format.

That means the workflow should become:

```text
Enter/edit data in the app
Validate totals
Export Excel when needed
Use audit/status workflow for control
```

This avoids broken spreadsheet formulas while still keeping Excel compatibility for reporting and submission.
