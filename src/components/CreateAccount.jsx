/* ============================================================
   CreateAccount.jsx — Dedicated account creation page
   ============================================================ */
import React, { useState } from 'react';

export default function CreateAccount({ onCreateAccount, onBack, authError, authLoading }) {
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState('instructor');

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
          <div className="landing-title">Create an account</div>
        </div>

        <div className="landing-form">
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

          <div className="landing-actions">
            <button className="btn" type="button" onClick={onBack}>
              Back to sign in
            </button>
            <button
              className="btn pri"
              onClick={() => onCreateAccount({ email: createEmail, password: createPassword, role: createRole })}
              disabled={authLoading}
            >
              Create account
            </button>
          </div>

          {authError && <div className="landing-error">{authError}</div>}
        </div>
      </div>
    </div>
  );
}
