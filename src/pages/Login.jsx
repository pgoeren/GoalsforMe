import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DarkModeToggle from '../components/DarkModeToggle';

export default function Login() {
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
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <svg viewBox="0 0 100 100" width="48" height="48">
            <rect width="100" height="100" rx="20" fill="#4F46E5" />
            <path
              d="M25 52 L42 68 L75 35"
              stroke="white"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <h1>GoalsForMe</h1>
          <p className="login-subtitle">
            {isSignup ? 'Create your account' : 'Sign in to your goals'}
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

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={submitting}
          >
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

        <div className="login-dark-toggle">
          <DarkModeToggle />
        </div>
      </div>
    </div>
  );
}
