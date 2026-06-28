# VNH Business Plan Improvement Pack

Implemented in this drop-in patch:

1. **Snapshot Excel/PDF export**
   - Snapshot export buttons now produce frozen Excel and PDF files.
   - Routes: `/api/plans/[id]/snapshots/[snapshotId]/export?format=xlsx|pdf`.
   - Current plan export also supports `/api/plans/[id]/export?format=xlsx|pdf`.

2. **Change comparison**
   - Compares the current plan against the latest APPROVED or SUBMITTED snapshot.
   - Route: `/api/plans/[id]/comparison`.
   - UI: `PlanComparisonPanel`.

3. **Better approval comments**
   - Comment types: general comment, requested change, approval note, rejection note.
   - Route: `/api/plans/[id]/comments`.
   - UI: `ApprovalCommentsPanel` now includes a comment-type selector.

4. **Rejection / return-to-planner workflow**
   - APPROVER can return REVIEW/APPROVED plans back to DRAFT/REVIEW with a required reason.
   - REVIEWER can return REVIEW plans to DRAFT.
   - Return reasons are stored in audit history and comments.

5. **Notification system**
   - In-app notifications for status changes and comments.
   - Route: `/api/notifications`.
   - UI: `NotificationsPanel`.

6. **Password change screen**
   - Self-service password change route and UI.
   - Route: `/api/auth/password`.
   - UI: `PasswordChangePanel`.

7. **Stronger validation**
   - Forward status moves to REVIEW / APPROVED / SUBMITTED are blocked when required fields are incomplete, budgets are zero, department is missing, or no quarter is selected.
   - Validation helper: `src/lib/plan-validation.ts`.

8. **Dashboard summary by department/status**
   - Route: `/api/dashboard/summary`.
   - UI: `DashboardSummaryPanel`.

9. **Export history**
   - Tracks who exported what, when, format, and file name.
   - Route: `/api/export-history` for ADMIN review.
   - Prisma model: `ExportHistory`.

10. **Production hardening**
   - API rate limiting in middleware.
   - Security headers.
   - Stronger password policy.
   - Health endpoint checks database and required env vars.
   - Backup/restore scripts added:
     - `npm run db:backup`
     - `npm run db:restore -- ./backups/file.sql.gz`

## After copying files

Run:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
```

For local development using db push instead of migrations:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

## Important note

This pack adds two database tables: `Notification` and `ExportHistory`. Apply the included migration before using the notification/export-history features in production.
