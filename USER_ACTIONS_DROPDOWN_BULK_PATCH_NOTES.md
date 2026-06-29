# VNH User Table Actions Dropdown + Bulk Actions Patch

## Files included

- `src/components/UserManagementPanel.tsx`
- `src/components/UserDepartmentAccessEditor.tsx`
- `src/app/globals.css`

## What changed

- Added a compact row-selection checkbox column.
- Replaced the old stacked action buttons with a single compact `Actions` dropdown per user.
- Kept `Last seen` immediately before `Actions`, which is the recommended table pattern because operational metadata comes before the far-right action column.
- Added bulk admin operations:
  - Select all eligible users
  - Activate selected users
  - Deactivate selected users
  - Set role for selected users
  - Clear selection
- Prevented the signed-in admin from being bulk-edited or deactivated by accident.
- Tightened row height, cell padding, action width, role select width, and login date formatting for laptop screens.
- Preserved the compact department access editor with `All departments` / `Selected departments` and collapsible department management.

## Install

Drop the files into the matching directories, then restart the dev server:

```bash
npm run dev
```

Hard refresh the browser:

```text
Ctrl + Shift + R
```
