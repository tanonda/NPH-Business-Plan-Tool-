# VNH Business Plan UI Polish Pack

This patch addresses the incomplete visual implementation that still looked like a bare admin form after the budget-control sweep.

## Main files changed

- `src/app/page.tsx`
- `src/app/globals.css`
- `src/components/UserSessionBar.tsx`
- `src/components/ThemeToggle.tsx`

## What changed

- Added a permanent desktop side navigation panel.
- Added a sticky mobile top bar for tablet/mobile layouts.
- Added a working light/dark mode toggle with localStorage persistence.
- Added dark theme design tokens and dark-mode styles for panels, forms, tables, badges, cards, and inputs.
- Reworked the session/logout bar so it no longer depends on Tailwind utility classes.
- Added anchor navigation for Dashboard, Workflow, Plan Form, Activities, Cashflow, Saved Plans, and Audit/Snapshots.
- Added responsive behavior for desktop, tablet, and mobile widths.
- Added compatibility utility styles for older generated components that still had Tailwind-like class names.

## After replacing files

Run:

```bash
npm run dev
```

Then hard-refresh the browser:

```text
Ctrl + Shift + R
```

If the old layout still appears, stop and restart the dev server.

## Verification note

I installed npm dependencies in the sandbox and ran TypeScript checking. Prisma Client generation could not complete because the sandbox could not reach `binaries.prisma.sh`, so Prisma-related type checks remain blocked until you run `npx prisma generate` on your machine/server.
