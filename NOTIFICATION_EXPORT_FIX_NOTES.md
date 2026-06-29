# Notification Export Fix

## Files included

- `src/components/NotificationsPanel.tsx`

## What this fixes

This restores compatibility between patch versions by exporting both:

- `NotificationsPanel`
- `DashboardNotificationSummary`

Some previous `page.tsx` versions import `DashboardNotificationSummary`, while the latest dashboard reorg changed the notification summary into `NotificationsPanel mode="summary"`. This file supports both names so the app does not crash.

## Install

Copy the file into the matching path, then fully restart Next.js and clear its dev cache:

```bash
# stop dev server first: Ctrl + C
rm -rf .next
npm run dev
```

Then hard refresh the browser:

```text
Ctrl + Shift + R
```

## Notes

If browser console errors mention `ShowOneChild`, `ActionableCoachmark`, or `ch-content-script`, those come from a Chrome extension/content script, not the Next.js app. Test once in Incognito with extensions disabled if needed.
