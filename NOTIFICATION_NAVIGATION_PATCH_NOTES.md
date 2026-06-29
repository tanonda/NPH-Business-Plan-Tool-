# VNH Notification Navigation Patch

## Purpose
Moves notifications out of the admin/diagnostic page flow and turns them into a proper global feature.

## Files included
- `src/components/NotificationBell.tsx`
- `src/components/NotificationsPanel.tsx`
- `src/components/UserSessionBar.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`

## What changed
- Added a global notification bell in the session/top bar.
- Added recent notification dropdown with unread count.
- Added mark-all-read action from the bell dropdown.
- Added a small dashboard notification summary card.
- Added a dedicated `#notifications` inbox section.
- Added sidebar navigation link to Notifications.
- Removed the old full notifications block from the admin area.
- Added inbox filters: All, Unread, and notification type filters.
- Added responsive styling for desktop, laptop, tablet, and mobile.

## Install
Drop the included files into the matching project paths, then restart:

```bash
npm run dev
```

Hard refresh the browser after restart:

```txt
Ctrl + Shift + R
```
