'use client';

import { useEffect, useRef, useState } from 'react';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt?: string | null;
  createdAt: string;
};

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  async function loadNotifications() {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(Number(data.unreadCount || 0));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
    const interval = window.setInterval(() => void loadNotifications(), 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handlePointerDown);
    }

    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  async function markAllRead() {
    const res = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    if (res.ok) {
      await loadNotifications();
    }
  }

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="notification-bell" ref={panelRef}>
      <button
        type="button"
        className="notification-bell__button"
        onClick={() => setOpen((value) => !value)}
        aria-label={unreadCount ? `Open notifications, ${unreadCount} unread` : 'Open notifications'}
        aria-expanded={open}
      >
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 && <span className="notification-bell__count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-bell__menu" role="dialog" aria-label="Recent notifications">
          <div className="notification-bell__head">
            <div>
              <strong>Notifications</strong>
              <span>{unreadCount} unread</span>
            </div>
            {unreadCount > 0 && (
              <button type="button" className="notification-bell__text-button" onClick={() => void markAllRead()}>
                Mark read
              </button>
            )}
          </div>

          <div className="notification-bell__list">
            {loading && recentNotifications.length === 0 ? (
              <p className="muted">Loading notifications...</p>
            ) : recentNotifications.length === 0 ? (
              <p className="muted">No notifications yet.</p>
            ) : (
              recentNotifications.map((item) => (
                <a
                  key={item.id}
                  className={`notification-bell__item ${item.readAt ? '' : 'is-unread'}`}
                  href="#notifications"
                  onClick={() => setOpen(false)}
                >
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.type}</span>
                  </div>
                  <p>{item.message}</p>
                  <small>{formatNotificationTime(item.createdAt)}</small>
                </a>
              ))
            )}
          </div>

          <a className="notification-bell__view-all" href="#notifications" onClick={() => setOpen(false)}>
            View all notifications
          </a>
        </div>
      )}
    </div>
  );
}
