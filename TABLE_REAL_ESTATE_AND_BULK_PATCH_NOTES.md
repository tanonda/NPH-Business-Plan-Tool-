# VNH Table Real-Estate + Bulk Actions Patch

## Files included

- `src/components/UserManagementPanel.tsx`
- `src/components/UserDepartmentAccessEditor.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`

## What changed

### User Management table

- Removed the standalone checkbox column.
- Moved row selection into the User cell to recover horizontal space.
- Replaced the two department-access controls with one compact dropdown control.
- The department dropdown now includes:
  - All departments
  - Selected departments
  - Department search
  - Department checklist
  - Apply access button
- Replaced cramped native action select with a compact row Actions menu.
- Hid Last Seen on tighter laptop widths, but keeps it visible on full desktop and mobile cards.
- Optimized column widths for laptop screens.

### Saved Plans table

- Added row selection.
- Added bulk toolbar.
- Added bulk Open selected for single selected plan.
- Added bulk Delete selected for admins.
- Added per-row Actions menu with:
  - Open / edit or View
  - Export Excel
  - Export PDF
  - Delete, admin only

## Install

Copy these files into the matching project paths, then restart:

```bash
npm run dev
```

Hard refresh the browser:

```text
Ctrl + Shift + R
```
