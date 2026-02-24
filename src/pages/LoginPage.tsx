import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';

type AuthMode = 'login' | 'signup';

const formatAuthError = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = String(error.message);
    return message.replace(/^Firebase:\s*/i, '').trim();
  }
  return 'Authentication failed. Please try again.';
};

export const LoginPage = () => {
  const { user, loading, signInWithEmail, signUpWithEmail } = useAuth();
  const location = useLocation();
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password);
      }
    } catch (submitError) {
      setError(formatAuthError(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <p className="status-text">Checking session...</p>
        </section>
      </main>
    );
  }

  if (user) {
    return <Navigate to={fromPath} replace />;
  }

  return (
    <main className="auth-shell">
      <section className="auth-card page">
        <p className="kicker">Stockholm feeding journal</p>
        <h1 className="auth-title">Milo Meal Log</h1>
        <p className="muted-text">{mode === 'login' ? 'Log in to continue' : 'Create account to continue'}</p>

        <form onSubmit={onSubmit} className="form-grid">
          <label className="field">
            <span className="field-label">Email</span>
            <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>

          <label className="field">
            <span className="field-label">Password</span>
            <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" disabled={submitting} className="btn btn-primary btn-block">
            {submitting ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
            setError(null);
          }}
          className="btn btn-ghost toggle-auth-btn"
        >
          {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}
        </button>
      </section>
    </main>
  );
};
