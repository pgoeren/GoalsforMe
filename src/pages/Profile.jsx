import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGoals } from '../context/GoalContext';
import DarkModeToggle from '../components/DarkModeToggle';

function SignedInProfile() {
  const { user, logout, updateDisplayName } = useAuth();
  const { yearlyGoals } = useGoals();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);

  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await updateDisplayName(newName.trim());
      setEditingName(false);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // auth state listener handles redirect
    }
  };

  return (
    <div className="profile-page">
      <h1>Profile</h1>

      <div className="profile-card">
        <div className="profile-avatar-lg">
          {initials}
        </div>
        <div className="profile-info">
          {editingName ? (
            <div className="profile-name-edit">
              <input
                type="text"
                className="form-input form-input-sm"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                autoFocus
              />
              <button className="btn btn-primary btn-sm" onClick={handleSaveName} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => { setEditingName(false); setNewName(user?.displayName || ''); }}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="profile-name-row">
              <h2>{user?.displayName || 'No name set'}</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setEditingName(true)}>
                Edit
              </button>
            </div>
          )}
          <p className="profile-email">{user?.email}</p>
        </div>
      </div>

      <div className="profile-section">
        <h3 className="profile-section-title">Stats</h3>
        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-value">{yearlyGoals.length}</span>
            <span className="profile-stat-label">Goals</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">
              {new Set(yearlyGoals.map(g => g.theme).filter(Boolean)).size}
            </span>
            <span className="profile-stat-label">Themes</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">
              {new Set(yearlyGoals.map(g => g.year)).size}
            </span>
            <span className="profile-stat-label">Years</span>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <h3 className="profile-section-title">Appearance</h3>
        <div className="profile-row">
          <span>Dark Mode</span>
          <DarkModeToggle />
        </div>
      </div>

      <div className="profile-section">
        <h3 className="profile-section-title">Account</h3>
        <button className="btn btn-danger profile-logout-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

function SignedOutProfile() {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const friendlyError = (code) => {
    const map = {
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-credential': 'Incorrect email or password.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
    };
    return map[code] || 'Something went wrong. Please try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isSignup) {
        if (!form.name.trim()) {
          setError('Please enter your name.');
          setSubmitting(false);
          return;
        }
        await signup(form.email, form.password, form.name.trim());
      } else {
        await login(form.email, form.password);
      }
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="profile-page">
      <h1>Profile</h1>

      <div className="profile-auth-card">
        <div className="profile-auth-header">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <h2>{isSignup ? 'Create Account' : 'Sign In'}</h2>
          <p className="profile-auth-subtitle">
            {isSignup
              ? 'Create an account to sync your goals across devices'
              : 'Sign in to access your goals on any device'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isSignup && (
            <div className="form-field">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Your name"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                autoComplete="name"
              />
            </div>
          )}
          <div className="form-field">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
              value={form.password}
              onChange={e => update('password', e.target.value)}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
              minLength={6}
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn btn-primary login-btn" disabled={submitting}>
            {submitting
              ? (isSignup ? 'Creating account...' : 'Signing in...')
              : (isSignup ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <p className="login-switch">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            className="login-switch-btn"
            onClick={() => { setIsSignup(s => !s); setError(''); }}
          >
            {isSignup ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>

      <div className="profile-section">
        <h3 className="profile-section-title">Appearance</h3>
        <div className="profile-row">
          <span>Dark Mode</span>
          <DarkModeToggle />
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, isAuthEnabled } = useAuth();

  if (isAuthEnabled && user) {
    return <SignedInProfile />;
  }

  if (isAuthEnabled && !user) {
    return <SignedOutProfile />;
  }

  // Local-only mode (no Firebase)
  return (
    <div className="profile-page">
      <h1>Profile</h1>
      <div className="profile-section">
        <p className="profile-local-notice">
          Running in local-only mode. Add Firebase configuration to enable account sync across devices.
        </p>
      </div>
      <div className="profile-section">
        <h3 className="profile-section-title">Appearance</h3>
        <div className="profile-row">
          <span>Dark Mode</span>
          <DarkModeToggle />
        </div>
      </div>
    </div>
  );
}
