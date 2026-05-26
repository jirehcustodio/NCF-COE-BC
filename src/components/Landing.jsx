/* ============================================================
   Landing.jsx — Splash landing/login for roles
   ============================================================ */
import React, { useState } from 'react';

export default function Landing({ onLogin, authError, authLoading }) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

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
          {authError && <div className="landing-error">{authError}</div>}
        </div>
      </div>
    </div>
  );
}
