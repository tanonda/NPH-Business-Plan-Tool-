# Department Access Single Dropdown Patch

This patch simplifies the User Management table's Department Access column.

## Changed files

- `src/components/UserDepartmentAccessEditor.tsx`
- `src/app/globals.css`

## What changed

- Removed the separate access-mode box + manage-departments box pattern.
- The Department Access cell now displays only one dropdown.
- The dropdown itself contains:
  - All departments
  - Search departments
  - Select visible
  - Clear selected
  - Department checklist
  - Apply button
- Choosing any individual department automatically switches the user to selected-department access.
- Choosing All departments applies full access.

## Install

Copy the two files into the matching locations, restart the dev server, then hard refresh the browser.
