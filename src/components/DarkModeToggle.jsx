import { useState, useEffect } from 'react';

function getInitialTheme() {
  const saved = localStorage.getItem('gfm_theme');
  if (saved) return saved;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export default function DarkModeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gfm_theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return (
    <button
      className="dark-toggle"
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle dark mode"
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M12 3a1 1 0 011 1v1a1 1 0 11-2 0V4a1 1 0 011-1zm0 15a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm9-8a1 1 0 010 2h-1a1 1 0 110-2h1zM5 11a1 1 0 010 2H4a1 1 0 110-2h1zm14.07-6.07a1 1 0 010 1.41l-.71.71a1 1 0 11-1.41-1.41l.71-.71a1 1 0 011.41 0zM7.05 16.95a1 1 0 010 1.41l-.71.71a1 1 0 11-1.41-1.41l.71-.71a1 1 0 011.41 0zm11.9 0a1 1 0 01-1.41 1.41l-.71-.71a1 1 0 011.41-1.41l.71.71zM7.05 7.05a1 1 0 01-1.41 0l-.71-.71A1 1 0 016.34 4.93l.71.71a1 1 0 010 1.41zM12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M21.75 15.5a.75.75 0 01-.07 1.05 10 10 0 11-14.23-14.23.75.75 0 011.12.98A8.5 8.5 0 1020.7 15.43a.75.75 0 011.05.07z" />
        </svg>
      )}
    </button>
  );
}
