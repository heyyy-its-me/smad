'use client';

import { FormEvent, ReactNode, useEffect, useState } from 'react';

type AuthUser = {
  id: string;
  email: string;
};

type AuthCustomer = {
  id: string;
};

type AuthState = {
  authenticated: boolean;
  user?: AuthUser;
  customer?: AuthCustomer;
};

export default function AuthGate({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch('/api/auth/me')
      .then(async (response) => {
        if (!mounted) return;
        if (!response.ok) {
          setAuth({ authenticated: false });
          return;
        }
        setAuth(await response.json());
      })
      .catch(() => mounted && setAuth({ authenticated: false }))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          ...(mode === 'signup' ? { organization_name: organizationName } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Authentication failed');
      setAuth({ authenticated: true, user: { id: data.user.id, email: data.user.email }, customer: data.customer });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuth({ authenticated: false });
    setEmail('');
    setPassword('');
  };

  if (loading || auth === null) {
    return <div className="auth-loading">Loading SMADY OS...</div>;
  }

  if (!auth.authenticated) {
    return (
      <div className="auth-page">
        <form className="auth-card" onSubmit={submit}>
          <span className="auth-kicker">SMADY OS</span>
          <h1>{mode === 'login' ? 'Welcome back' : 'Create your workspace'}</h1>
          <p>{mode === 'login' ? 'Sign in to continue your agent workflow.' : 'Start a private customer workspace for this account.'}</p>

          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>

          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={8} required />
          </label>

          {mode === 'signup' && (
            <label>
              Organization name
              <input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} type="text" />
            </label>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-submit" disabled={submitting} type="submit">
            {submitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign up'}
          </button>

          <button className="auth-switch" type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Login'}
          </button>
        </form>

        <style jsx>{`
          .auth-page {
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 24px;
            background: #0f0f23;
          }
          .auth-card {
            width: min(420px, 100%);
            padding: 28px;
            border: 1px solid rgba(139, 92, 246, 0.2);
            border-radius: 8px;
            background: #1a1a2e;
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
          .auth-kicker {
            color: #a78bfa;
            font-family: monospace;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
          }
          h1 {
            margin: 0;
            color: #f3f4f6;
            font-size: 24px;
            font-weight: 700;
          }
          p {
            margin: 0 0 8px;
            color: #9ca3af;
            font-size: 13px;
            line-height: 1.5;
          }
          label {
            display: flex;
            flex-direction: column;
            gap: 6px;
            color: #d1d5db;
            font-size: 12px;
            font-weight: 600;
          }
          input {
            height: 40px;
            border-radius: 6px;
            border: 1px solid rgba(139, 92, 246, 0.4);
            background: rgba(6, 11, 30, 0.4);
            color: #f3f4f6;
            padding: 0 12px;
            outline: none;
            font-size: 14px;
            transition: all 0.2s;
          }
          input:focus {
            border-color: rgba(139, 92, 246, 0.8);
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
          }
          .auth-submit {
            height: 42px;
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 6px;
            background: #0f0f23;
            color: #c0c0c0;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
          }
          .auth-submit:hover:not(:disabled) {
            background: #1a1a2e;
            border-color: rgba(139, 92, 246, 0.6);
            color: #e5e7eb;
          }
          .auth-submit:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          .auth-switch {
            background: transparent;
            border: none;
            color: #9ca3af;
            cursor: pointer;
            font-size: 12px;
            transition: color 0.2s;
          }
          .auth-switch:hover {
            color: #d1d5db;
          }
          .auth-error {
            padding: 10px 12px;
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 6px;
            background: rgba(239, 68, 68, 0.08);
            color: #fca5a5;
            font-size: 12px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <div className="session-chip">
        <span>{auth.user?.email}</span>
        <button onClick={logout}>Logout</button>
      </div>
      {children}
      <style jsx>{`
        .session-chip {
          position: fixed;
          right: 20px;
          top: 14px;
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 8px 6px 12px;
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 6px;
          background: rgba(6, 11, 30, 0.78);
          color: #9ca3af;
          font-size: 11px;
          backdrop-filter: blur(10px);
        }
        .session-chip button {
          border: none;
          border-radius: 4px;
          padding: 5px 8px;
          background: rgba(139, 92, 246, 0.2);
          color: #f3f4f6;
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
          transition: background 0.2s;
        }
        .session-chip button:hover {
          background: rgba(139, 92, 246, 0.4);
        }
      `}</style>
    </>
  );
}
