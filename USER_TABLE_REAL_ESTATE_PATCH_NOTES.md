# User Table Real-Estate Patch

Drop these files into the same paths in your app:

- `src/components/UserManagementPanel.tsx`
- `src/components/UserDepartmentAccessEditor.tsx`
- `src/app/globals.css`

## What changed

- Reduced the User Management table from 8 columns to 6 columns.
- Combined user name + email into one identity column.
- Removed the separate `All departments` column.
- Combined `All departments` and assigned departments into one compact Department Access control.
- Added a dropdown for `All departments` vs `Selected departments`.
- Moved the department checklist into a collapsible `Manage departments` area.
- Added `Select all` and `Clear` shortcuts inside the collapsible picker.
- Made action buttons compact and stacked cleanly.
- Added mobile card layout for small screens.

Restart the dev server after replacing the files:

```bash
npm run dev
```

Then hard refresh the browser.
