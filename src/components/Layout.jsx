import { NavLink, Outlet } from 'react-router-dom';
import { isFirebaseConfigured } from '../firebase/config';

export default function Layout() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <NavLink to="/" className="app-logo">
          <svg viewBox="0 0 100 100" width="28" height="28">
            <rect width="100" height="100" rx="24" fill="#4F46E5" />
            <circle cx="35" cy="55" r="10" fill="#818CF8" />
            <circle cx="65" cy="55" r="10" fill="#A5B4FC" />
            <circle cx="50" cy="35" r="10" fill="white" />
          </svg>
          <span>GoalsForMe</span>
        </NavLink>
        {!isFirebaseConfigured && (
          <span className="storage-badge" title="Using browser storage. Add Firebase config for cloud sync.">
            Local
          </span>
        )}
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="app-nav">
        <NavLink to="/" className="nav-item" end>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Home</span>
        </NavLink>
        <NavLink to="/add" className="nav-item">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <span>New Goal</span>
        </NavLink>
        <NavLink to="/history" className="nav-item">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>History</span>
        </NavLink>
        <NavLink to="/profile" className="nav-item">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
}
