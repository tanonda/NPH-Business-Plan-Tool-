'use client';

import { useEffect, useState } from 'react';

type ThemeChoice = 'system' | 'light' | 'dark' | 'black' | 'midnight' | 'slate';

const THEMES: { value: ThemeChoice; label: string; icon: string }[] = [
  { value: 'system', label: 'System', icon: '🖥️' },
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'black', label: 'Black', icon: '⚫' },
  { value: 'midnight', label: 'Midnight', icon: '🌌' },
  { value: 'slate', label: 'Slate', icon: '◼️' }
];

function resolveTheme(choice: ThemeChoice): Exclude<ThemeChoice, 'system'> {
  if (choice !== 'system') return choice;

  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

function applyTheme(choice: ThemeChoice) {
  const resolved = resolveTheme(choice);
  document.documentElement.dataset.themeChoice = choice;
  document.documentElement.dataset.theme = resolved;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeChoice>('system');

  useEffect(() => {
    const saved = window.localStorage.getItem('vnh-theme') as ThemeChoice | null;
    const nextTheme: ThemeChoice = saved && THEMES.some((item) => item.value === saved) ? saved : 'system';

    setTheme(nextTheme);
    applyTheme(nextTheme);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => {
      const current = (window.localStorage.getItem('vnh-theme') as ThemeChoice | null) || 'system';
      if (current === 'system') applyTheme('system');
    };

    media.addEventListener?.('change', onSystemChange);
    return () => media.removeEventListener?.('change', onSystemChange);
  }, []);

  function changeTheme(nextTheme: ThemeChoice) {
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem('vnh-theme', nextTheme);
  }

  const activeTheme = THEMES.find((item) => item.value === theme) || THEMES[0];

  return (
    <label className="theme-picker" aria-label="Theme choice">
      <span className="theme-picker__summary">
        <span aria-hidden="true">{activeTheme.icon}</span>
        <span className="theme-picker__text">{activeTheme.label}</span>
      </span>
      <select value={theme} onChange={(event) => changeTheme(event.target.value as ThemeChoice)}>
        {THEMES.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
