# VNH Business Plan Tool — Real Estate + Theme Pack

This patch focuses on laptop usability and visual density after reviewing the admin/user-management and saved-plan screens.

## What changed

- Reduced desktop sidebar width from 292px to a laptop-friendly 236px, and 204px on smaller laptops.
- Reduced global page padding, card padding, KPI spacing, table cell padding, and button padding.
- Made tables denser while keeping readable text and sticky headers.
- Improved action cells so Edit/Excel/PDF buttons do not feel as squashed.
- Optimized user-management department selectors with a compact scroll area.
- Added a multi-theme picker instead of a two-state toggle.
- Added theme choices:
  - System
  - Light
  - Dark
  - Black
  - Midnight
  - Slate
- Theme preference is saved to localStorage.
- System mode follows the operating system color preference.

## Files changed

- `src/components/ThemeToggle.tsx`
- `src/components/UserDepartmentAccessEditor.tsx`
- `src/app/globals.css`

## After applying

Restart the dev server:

```bash
npm run dev
```

Then hard refresh the browser:

```txt
Ctrl + Shift + R
```

If the old theme still appears, clear the saved browser theme value from DevTools Application > Local Storage > `vnh-theme`, or select a new option from the theme picker.
