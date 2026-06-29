# UI Spacing Fix Notes (V4.7)

## Fix
Added a dedicated `plan-hero` class to the Business Plan Tool hero section so it has clear top spacing after the Budget Control / Accounting dashboard blocks.

## Files changed
- `src/app/page.tsx`
- `src/app/globals.css`

## Reason
The Business Plan Tool block was visually touching the Accounting & Spending Tracker block when dashboard tables were long or scrolled, making the page feel cramped.
