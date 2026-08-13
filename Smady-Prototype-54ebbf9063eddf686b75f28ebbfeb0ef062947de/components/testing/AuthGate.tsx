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

          <button 
            className="auth-submit" 
            disabled={submitting} 
            type="submit"
            style={{
              height: '42px',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '6px',
              background: '#0f0f23',
              color: '#c0c0c0',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              opacity: submitting ? 0.6 : 1,
            }}
          >
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
            background: #0a0a0a;
          }
          .auth-card {
            width: min(420px, 100%);
            padding: 28px;
            border: 1px solid #404040;
            border-radius: 8px;
            background: #111111;
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
          .auth-kicker {
            color: #c0c0c0;
            font-family: monospace;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
          }
          h1 {
            margin: 0;
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
          }
          p {
            margin: 0 0 8px;
            color: #a0a0a0;
            font-size: 13px;
            line-height: 1.5;
          }
          label {
            display: flex;
            flex-direction: column;
            gap: 6px;
            color: #c0c0c0;
            font-size: 12px;
            font-weight: 600;
          }
          input {
            height: 40px;
            border-radius: 6px;
            border: 1px solid #404040;
            background: #1a1a1a;
            color: #e0e0e0;
            padding: 0 12px;
            outline: none;
            font-size: 14px;
            transition: all 0.2s;
          }
          input:focus {
            border-color: #606060;
            background: #222222;
          }
          button.auth-submit {
            height: 42px !important;
            border: 1px solid #404040 !important;
            border-radius: 6px !important;
            background: #0a0a0a !important;
            color: #c0c0c0 !important;
            font-weight: 700 !important;
            font-size: 14px !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          button.auth-submit:hover:not(:disabled) {
            background: #1a1a1a !important;
            border-color: #606060 !important;
            color: #e0e0e0 !important;
          }
          button.auth-submit:disabled {
            opacity: 0.6 !important;
            cursor: not-allowed !important;
          }
          .auth-switch {
            background: transparent;
            border: none;
            color: #a0a0a0;
            cursor: pointer;
            font-size: 12px;
            transition: color 0.2s;
          }
          .auth-switch:hover {
            color: #c0c0c0;
          }
          .auth-error {
            padding: 10px 12px;
            border: 1px solid #663333;
            border-radius: 6px;
            background: #331111;
            color: #ff8080;
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
