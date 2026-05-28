/* ============================================================
   Landing.jsx — Splash landing/login for roles
   ============================================================ */
import React, { useState } from 'react';

export default function Landing({ onLogin, authError, authLoading }) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('instructor');

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
          <div className="landing-role-block">
            <div className="landing-role-label">Sign in as</div>
            <div className="landing-role-row">
              {[
                { id: 'admin', label: 'Admin' },
                { id: 'dean', label: 'Dean' },
                { id: 'instructor', label: 'Instructor' },
              ].map(role => (
                <button
                  key={role.id}
                  type="button"
                  className={`landing-role-btn ${selectedRole === role.id ? 'active' : ''}`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  {role.label}
                </button>
              ))}
            </div>
            <div className="landing-role-note">
              {selectedRole === 'admin' && 'Admins manage faculty accounts and security.'}
              {selectedRole === 'dean' && 'Deans oversee academics, blockchain, and admin tools.'}
              {selectedRole === 'instructor' && 'Instructors enroll students and submit grades.'}
            </div>
          </div>
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
              onClick={() => onLogin({ email: loginEmail, password: loginPassword, role: selectedRole })}
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
