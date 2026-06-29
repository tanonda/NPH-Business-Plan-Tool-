# VNH Dashboard Reorganization + Analytics Patch

## Drop-in files

Copy these files into the same paths in your app:

- `src/app/page.tsx`
- `src/app/globals.css`
- `src/components/NotificationsPanel.tsx`
- `src/components/BudgetControlPanel.tsx`
- `src/components/AccountingDashboardPanel.tsx`
- `src/components/UserManagementPanel.tsx`
- `src/components/UserDepartmentAccessEditor.tsx`

## Layout changes

- Removed User Management, Role & Access Test, and Password blocks from the top of the operational dashboard.
- Added a bottom `Profile & Admin Tools` section.
- Password change is placed under Profile/Admin.
- User Management and Role & Access Test are shown there for ADMIN only.
- Sidebar now includes direct navigation for Budget Control, Accounting, Notifications, and Profile/Admin.

## Notifications

- Dashboard now shows only a compact `Recent alerts` summary.
- Full notifications inbox is placed in the dedicated `#notifications` section.
- Notifications inbox includes filters for All, Unread, and notification types.

## Budget Control

- Added analytics cards.
- Added budget utilization percentage bar.
- Added funding composition visual bar.
- Added recommendations block.
- Moved budget ceiling input form into a collapsible tool panel.
- Kept budget tracking table underneath the analytics block.

## Accounting & Spending Tracker

- Added execution rate visual.
- Added committed / actual / remaining analytics cards.
- Added spending mix visual bar.
- Added accounting recommendations block.
- Moved commitment and expenditure forms into a collapsible tool panel.
- Kept accounting tracking table underneath the analytics block.

## Saved Plans

- Added row selection.
- Added bulk delete for ADMIN.
- Added per-row actions dropdown.

## Department Access

- Uses a single dropdown only.
- `All departments` is inside the same dropdown as the department checklist.

## After copying

Run:

```bash
npm run dev
```

Then hard refresh the browser:

```txt
Ctrl + Shift + R
```

## Validation note

A sandbox TypeScript check was attempted, but this environment does not have the app dependencies/Prisma client generated, so it reports missing `next`, `react`, `@prisma/client`, and Node type packages. Run `npm install`, `npx prisma generate`, and `npm run build` on your local app after copying.
