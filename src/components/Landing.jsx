/* ============================================================
   Landing.jsx — Splash landing/login for roles
   ============================================================ */
import React, { useState } from 'react';

export default function Landing({ onLogin, onCreateAccount, authError, authLoading }) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState('instructor');
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="landing">
      <div className="landing-card">
        <div className="landing-brand">
          <div
            className="landing-logo"
            aria-label="NCF College of Engineering logo"
            style={{ backgroundImage: 'url(/logo.png)' }}
          />
          <div className="landing-org">NCF · College of Engineering</div>
          <div className="landing-title">Blockchain Grade Recording System</div>
        </div>

        <div className="landing-form">
          <label className="landing-label">Email</label>
          <input
            className="landing-input"
            placeholder="you@school.edu"
            value={loginEmail}
            onChange={event => setLoginEmail(event.target.value)}
          />
          <label className="landing-label">Password</label>
          <input
            className="landing-input"
            type="password"
            placeholder="••••••••"
            value={loginPassword}
            onChange={event => setLoginPassword(event.target.value)}
          />

          <div className="landing-actions">
            <button
              className="btn pri"
              onClick={() => onLogin({ email: loginEmail, password: loginPassword })}
              disabled={authLoading}
            >
              Sign in
            </button>
          </div>
          <div className="landing-link-row">
            <span>Don’t have an account?</span>
            <button
              className="landing-link-btn"
              type="button"
              onClick={() => setShowCreate(prev => !prev)}
            >
              Create account
            </button>
          </div>

          {authError && <div className="landing-error">{authError}</div>}

          {showCreate && (
            <>
              <div className="landing-divider" />
              <div className="landing-create">
                <div className="landing-create-title">Create account</div>
                <label className="landing-label">Email</label>
                <input
                  className="landing-input"
                  placeholder="you@school.edu"
                  value={createEmail}
                  onChange={event => setCreateEmail(event.target.value)}
                />
                <label className="landing-label">Password</label>
                <input
                  className="landing-input"
                  type="password"
                  placeholder="Create a password"
                  value={createPassword}
                  onChange={event => setCreatePassword(event.target.value)}
                />
                <label className="landing-label">Choose role</label>
                <select
                  className="landing-input"
                  value={createRole}
                  onChange={event => setCreateRole(event.target.value)}
                >
                  <option value="dean">Dean</option>
                  <option value="instructor">Instructor</option>
                </select>
                <button
                  className="btn pri"
                  onClick={() => onCreateAccount({ email: createEmail, password: createPassword, role: createRole })}
                  disabled={authLoading}
                >
                  Create account
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
