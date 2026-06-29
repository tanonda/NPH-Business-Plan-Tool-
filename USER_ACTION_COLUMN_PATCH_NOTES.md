# User Actions Column Alignment Patch

Drop these files into the same paths in your app:

- `src/components/UserManagementPanel.tsx`
- `src/app/globals.css`

## What changed

- Keeps the `Actions` cell as a real table-cell so it stays under the `Actions` header.
- Moves the two action buttons into an inner `.user-actions-stack` wrapper.
- Makes the Actions column fixed/compact.
- Prevents `Reset password` and `Activate/Deactivate` from drifting into the Last Login column.
- Preserves the mobile card layout where both buttons sit side-by-side.

Restart the dev server and hard refresh after copying.
