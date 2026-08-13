'use client';

import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, LogOut } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

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

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateEmail(email) || !validatePassword(password)) {
      return;
    }

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

      setSuccessMessage(mode === 'login' ? 'Welcome back! Redirecting...' : 'Account created! Redirecting...');
      setTimeout(() => {
        setAuth({ authenticated: true, user: { id: data.user.id, email: data.user.email }, customer: data.customer });
      }, 500);
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
    setOrganizationName('');
  };

  if (loading || auth === null) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner">
          <Loader2 size={32} />
        </div>
        <p>Loading SMADY OS...</p>
      </div>
    );
  }

  if (!auth.authenticated) {
    return (
      <div className="auth-page">
        <div className="auth-background"></div>
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <h1>{mode === 'login' ? 'Welcome back' : 'Create your workspace'}</h1>
              <p>{mode === 'login' ? 'Continue your AI-powered workflow' : 'Start building with SMADY agents'}</p>
            </div>

            <form className="auth-form" onSubmit={submit}>
              {error && (
                <div className="auth-alert auth-alert-error">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="auth-alert auth-alert-success">
                  <CheckCircle2 size={18} />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  placeholder="you@example.com"
                  className={`form-input ${emailError ? 'input-error' : ''}`}
                  required
                />
                {emailError && <div className="input-error-text">{emailError}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="password-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder={mode === 'login' ? 'Enter your password' : 'At least 8 characters'}
                    className={`form-input password-input ${passwordError ? 'input-error' : ''}`}
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="toggle-password-btn"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordError && <div className="input-error-text">{passwordError}</div>}
              </div>

              {mode === 'signup' && (
                <div className="form-group">
                  <label htmlFor="organization" className="form-label">
                    Organization
                  </label>
                  <input
                    id="organization"
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Your company name (optional)"
                    className="form-input"
                  />
                </div>
              )}

              <button type="submit" disabled={submitting} className="submit-button">
                {submitting ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    Processing...
                  </>
                ) : mode === 'login' ? (
                  'Sign in'
                ) : (
                  'Create account'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError(null);
                  setSuccessMessage(null);
                  setEmailError('');
                  setPasswordError('');
                }}
                className="toggle-mode"
              >
                {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </form>

            <div className="auth-footer">
              <p>Enterprise Authentication</p>
            </div>
          </div>
        </div>

        <style jsx>{`
          * {
            box-sizing: border-box;
          }

          .auth-page {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #121212 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            overflow: auto;
          }

          .auth-background {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            opacity: 0.2;
            background: 
              radial-gradient(circle at 15% 40%, rgba(80, 80, 80, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 85% 75%, rgba(60, 60, 60, 0.04) 0%, transparent 50%),
              radial-gradient(circle at 50% 20%, rgba(70, 70, 70, 0.03) 0%, transparent 50%);
            pointer-events: none;
          }

          .auth-container {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
          }

          .auth-card {
            width: 100%;
            max-width: 400px;
            padding: 40px 32px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            background: rgba(20, 20, 20, 0.95);
            backdrop-filter: blur(20px);
            box-shadow: 
              0 20px 45px rgba(0, 0, 0, 0.6),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
            animation: slideUp 0.5s ease-out;
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .auth-header {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            margin-bottom: 32px;
            text-align: center;
          }

          .auth-header h1 {
            margin: 0;
            font-size: 26px;
            font-weight: 700;
            color: #e8e8e8;
            letter-spacing: -0.4px;
            line-height: 1.2;
          }

          .auth-header p {
            margin: 0;
            font-size: 13px;
            color: #a8a8a8;
            line-height: 1.6;
            letter-spacing: 0.3px;
          }

          .auth-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .auth-alert {
            padding: 12px 16px;
            border-radius: 8px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            font-size: 13px;
            line-height: 1.5;
            animation: slideDown 0.3s ease-out;
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .auth-alert-error {
            background: rgba(239, 68, 68, 0.08);
            border: 1px solid rgba(239, 68, 68, 0.25);
            color: #fecaca;
          }

          .auth-alert-error svg {
            color: #f87171;
            flex-shrink: 0;
            margin-top: 1px;
          }

          .auth-alert-success {
            background: rgba(34, 197, 94, 0.08);
            border: 1px solid rgba(34, 197, 94, 0.25);
            color: #86efac;
          }

          .auth-alert-success svg {
            color: #4ade80;
            flex-shrink: 0;
            margin-top: 1px;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .form-label {
            display: block;
            font-size: 11px;
            font-weight: 700;
            color: #888888;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            opacity: 1;
          }

          .form-input {
            width: 100%;
            height: 44px;
            padding: 0 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            background: rgba(30, 30, 30, 0.8);
            color: #f0f0f0;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.25s ease;
            outline: none;
          }

          .form-input::placeholder {
            color: #666666;
          }

          .form-input:focus {
            background: rgba(35, 35, 35, 0.95);
            border-color: rgba(255, 255, 255, 0.2);
            box-shadow: 
              0 0 0 3px rgba(255, 255, 255, 0.05),
              inset 0 1px 2px rgba(255, 255, 255, 0.02);
          }

          .form-input.input-error {
            border-color: #ef4444;
            background: rgba(239, 68, 68, 0.04);
          }

          .form-input.input-error:focus {
            border-color: #ef4444;
            box-shadow: 
              0 0 0 3px rgba(239, 68, 68, 0.1),
              inset 0 1px 2px rgba(239, 68, 68, 0.05);
          }

          .input-error-text {
            font-size: 12px;
            color: #fca5a5;
            margin-top: -2px;
            font-weight: 500;
          }

          .password-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }

          .password-input {
            padding-right: 44px;
          }

          .toggle-password-btn {
            position: absolute;
            right: 12px;
            background: none;
            border: none;
            color: #666666;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
            border-radius: 6px;
            transition: all 0.2s ease;
            line-height: 1;
          }

          .toggle-password-btn:hover {
            color: #888888;
            background: rgba(255, 255, 255, 0.05);
          }

          .toggle-password-btn:active {
            background: rgba(255, 255, 255, 0.08);
          }

          .submit-button {
            height: 44px;
            border: none;
            border-radius: 6px;
            background: #2d2d2d;
            color: #ffffff;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.3s ease;
            margin-top: 8px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
            text-transform: uppercase;
            letter-spacing: 0.6px;
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .submit-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.08);
            transition: left 0.3s ease;
          }

          .submit-button:hover:not(:disabled) {
            transform: translateY(-2px);
            background: #353535;
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5);
          }

          .submit-button:hover:not(:disabled)::before {
            left: 100%;
          }

          .submit-button:active:not(:disabled) {
            transform: translateY(0);
          }

          .submit-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .spinner {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          .toggle-mode {
            background: none;
            border: none;
            color: #888888;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s ease;
            padding: 8px 0;
            text-decoration: none;
            font-weight: 500;
          }

          .toggle-mode:hover {
            color: #b0b0b0;
          }

          .auth-footer {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            text-align: center;
          }

          .auth-footer p {
            margin: 0;
            font-size: 11px;
            color: #666666;
            letter-spacing: 0.5px;
            font-weight: 600;
            text-transform: uppercase;
          }

          .auth-loading {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #121212 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          }

          .auth-loading-spinner {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            color: #666666;
          }

          .auth-loading p {
            margin: 0;
            font-size: 14px;
            color: #888888;
            letter-spacing: 0.3px;
          }

          @media (max-width: 480px) {
            .auth-card {
              padding: 32px 20px;
            }

            .auth-header {
              gap: 12px;
              margin-bottom: 24px;
            }

            .auth-header h1 {
              font-size: 22px;
            }

            .auth-header p {
              font-size: 12px;
            }

            .form-input {
              height: 40px;
              font-size: 13px;
            }

            .submit-button {
              height: 40px;
              font-size: 13px;
            }
          }
        `}</style>
      </div>
    );
  }

  // Authenticated - render children with logout button
  return (
    <div className="authenticated-layout">
      <div className="auth-header-bar">
        <div className="header-brand">SMADY</div>
        <div className="header-spacer"></div>
        <div className="profile-panel">
          <div className="user-info">
            <div className="user-avatar">{auth.user?.email.charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <div className="user-email">{auth.user?.email}</div>
              <div className="user-status">Connected</div>
            </div>
          </div>
          <button onClick={logout} className="logout-btn" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
      <div className="main-content">
        {children}
      </div>
      <style jsx>{`
        .authenticated-layout {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #121212 100%);
          display: flex;
          flex-direction: column;
        }

        .auth-header-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: rgba(20, 20, 20, 0.95);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          padding: 0 24px;
          gap: 16px;
          z-index: 50;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }

        .header-brand {
          font-size: 16px;
          font-weight: 800;
          color: #e8e8e8;
          letter-spacing: 1px;
          min-width: fit-content;
        }

        .header-spacer {
          flex: 1;
        }

        .profile-panel {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: rgba(30, 30, 30, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .profile-panel:hover {
          background: rgba(35, 35, 35, 0.8);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          background: #2d2d2d;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #c0c0c0;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .user-email {
          font-size: 12px;
          font-weight: 600;
          color: #d8d8d8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 180px;
        }

        .user-status {
          font-size: 10px;
          color: #777777;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
        }

        .logout-btn {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #d0d0d0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #f87171;
        }

        .logout-btn:active {
          transform: scale(0.95);
        }

        .main-content {
          flex: 1;
          margin-top: 64px;
          padding: 0;
          width: 100%;
        }

        @media (max-width: 768px) {
          .auth-header-bar {
            height: 56px;
            padding: 0 16px;
          }

          .header-brand {
            font-size: 14px;
          }

          .user-email {
            max-width: 120px;
            font-size: 11px;
          }

          .user-details {
            display: none;
          }

          .profile-panel {
            gap: 8px;
            padding: 6px 10px;
          }

          .user-avatar {
            width: 28px;
            height: 28px;
            font-size: 12px;
          }

          .logout-btn {
            width: 28px;
            height: 28px;
          }
        }
      `}</style>
    </div>
  );
}

