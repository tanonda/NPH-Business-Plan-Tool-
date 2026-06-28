'use client';

import { FormEvent, useState } from 'react';

export function PasswordChangePanel() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage('Changing password...');
    const res = await fetch('/api/auth/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error || 'Could not change password.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage('Password changed. Use the new password next login.');
  }

  return (
    <section className="panel" style={{ marginTop: 18 }}>
      <div className="actions" style={{ justifyContent: 'space-between' }}>
        <div>
          <h2>Password</h2>
          <p className="muted">Change your own password without an admin reset.</p>
        </div>
        <button type="button" className="secondary" onClick={() => setOpen((value) => !value)}>{open ? 'Hide' : 'Change password'}</button>
      </div>
      {open && (
        <form onSubmit={submit} className="grid cols-3" style={{ marginTop: 12 }}>
          <label>Current password<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
          <label>New password<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
          <label>Confirm new password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
          <div className="actions">
            <button type="submit" disabled={saving || !currentPassword || !newPassword || !confirmPassword}>{saving ? 'Saving...' : 'Update password'}</button>
            <span className="muted">Use 10+ chars with uppercase, lowercase, number, and symbol.</span>
          </div>
        </form>
      )}
      {message && <p className="muted">{message}</p>}
    </section>
  );
}
