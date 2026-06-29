'use client';

import { useEffect, useMemo, useState } from 'react';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt?: string | null;
  createdAt: string;
};

type Props = {
  mode?: 'summary' | 'full';
};

function niceType(type: string) {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function NotificationsPanel({ mode = 'full' }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

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
  }, []);

  async function markAllRead() {
    const res = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    if (res.ok) {
      setMessage('Notifications marked as read.');
      await loadNotifications();
    }
  }

  const types = useMemo(
    () => Array.from(new Set(notifications.map((item) => item.type))).sort(),
    [notifications]
  );

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'ALL') return true;
    if (filter === 'UNREAD') return !item.readAt;
    return item.type === filter;
  });

  if (mode === 'summary') {
    const latest = notifications[0];

    return (
      <section className="notification-summary-card" aria-label="Notification summary">
        <div>
          <span className={`badge ${unreadCount ? 'warn' : 'good'}`}>{unreadCount} unread</span>
          <h3>Recent alerts</h3>
          <p className="muted">
            {loading
              ? 'Checking notifications…'
              : latest
                ? latest.title
                : 'No current alerts. You are all caught up.'}
          </p>
        </div>
        <div className="notification-summary-card__actions">
          <a className="button-link secondary" href="#notifications">View inbox</a>
          <button type="button" className="secondary" onClick={() => void loadNotifications()}>
            Refresh
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="notifications" className="panel notifications-inbox-panel" style={{ marginTop: 18 }}>
      <div className="panel-title-row">
        <div>
          <h2>Notifications Inbox</h2>
          <p className="muted">Planner alerts for review, approval, rejection, returns, comments, and workflow activity.</p>
        </div>
        <div className="actions">
          <span className={`badge ${unreadCount ? 'warn' : 'good'}`}>{unreadCount} unread</span>
          <button type="button" className="secondary" onClick={() => void loadNotifications()}>
            Refresh
          </button>
          {unreadCount > 0 && (
            <button type="button" className="secondary" onClick={() => void markAllRead()}>
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="filter-pills" aria-label="Notification filters">
        <button type="button" className={filter === 'ALL' ? 'is-active' : ''} onClick={() => setFilter('ALL')}>All</button>
        <button type="button" className={filter === 'UNREAD' ? 'is-active' : ''} onClick={() => setFilter('UNREAD')}>Unread</button>
        {types.map((type) => (
          <button key={type} type="button" className={filter === type ? 'is-active' : ''} onClick={() => setFilter(type)}>
            {niceType(type)}
          </button>
        ))}
      </div>

      {message && <p className="muted">{message}</p>}
      <div className="notification-list">
        {filteredNotifications.length === 0 ? (
          <p className="muted">{loading ? 'Loading notifications…' : 'No notifications match this filter.'}</p>
        ) : (
          filteredNotifications.map((item) => (
            <article key={item.id} className={`notification-row ${item.readAt ? '' : 'is-unread'}`}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
              </div>
              <div className="notification-row__meta">
                <span className="badge">{niceType(item.type)}</span>
                <span className="muted">{new Date(item.createdAt).toLocaleString()}</span>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

// Compatibility export for earlier page.tsx patches that import this component by name.
// Newer patches may use <NotificationsPanel mode="summary" /> directly, but older merged
// files use <DashboardNotificationSummary />. Exporting both avoids the runtime crash.
export function DashboardNotificationSummary() {
  return <NotificationsPanel mode="summary" />;
}
