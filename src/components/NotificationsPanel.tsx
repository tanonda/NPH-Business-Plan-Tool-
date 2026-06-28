'use client';

import { useEffect, useState } from 'react';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt?: string | null;
  createdAt: string;
};

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [message, setMessage] = useState('');

  async function loadNotifications() {
    const res = await fetch('/api/notifications', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    setUnreadCount(Number(data.unreadCount || 0));
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  async function markAllRead() {
    const res = await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    if (res.ok) {
      setMessage('Notifications marked as read.');
      await loadNotifications();
    }
  }

  return (
    <section className="panel" style={{ marginTop: 18 }}>
      <div className="actions" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Notifications</h2>
          <p className="muted">Planner alerts for review, approval, rejection, returns, and comments.</p>
        </div>
        <div className="actions">
          <span className={`badge ${unreadCount ? 'warn' : 'good'}`}>{unreadCount} unread</span>
          <button type="button" className="secondary" onClick={() => void loadNotifications()}>Refresh</button>
          {unreadCount > 0 && <button type="button" className="secondary" onClick={() => void markAllRead()}>Mark all read</button>}
        </div>
      </div>
      {message && <p className="muted">{message}</p>}
      <div className="stack" style={{ marginTop: 12 }}>
        {notifications.length === 0 ? <p className="muted">No notifications yet.</p> : notifications.slice(0, 8).map((item) => (
          <article key={item.id} className="card">
            <div className="actions" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <strong>{item.title}</strong>
                <span className="badge" style={{ marginLeft: 8 }}>{item.type}</span>
              </div>
              <span className="muted">{new Date(item.createdAt).toLocaleString()}</span>
            </div>
            <p style={{ marginBottom: 0 }}>{item.message}</p>
            {!item.readAt && <small className="muted">Unread</small>}
          </article>
        ))}
      </div>
    </section>
  );
}
