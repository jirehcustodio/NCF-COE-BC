/* ============================================================
   Sidebar.jsx — Navigation sidebar with role switching
   ============================================================ */
import React from 'react';
import { ROLES, DEAN_NAV, PROF_NAV } from '../data/appData';

export default function Sidebar({ curRole, activePage, onRoleChange, onNavigate, onLogout }) {
  const rd   = ROLES[curRole];
  const nav  = rd.type === 'dean' ? DEAN_NAV : PROF_NAV;

  return (
    <div className="sidebar">

      {/* Logo */}
      <div className="sb-logo">
        <div className="sb-logo-top">
          <div
            className="sb-logo-mark"
            aria-label="NCF College of Engineering logo"
            style={{ backgroundImage: 'url(/logo.png)' }}
          />
          <div className="org">Blockchain Grade<br />Recording System</div>
        </div>
        <div className="sys">NCF · College of Engineering</div>
        <div className="ver">v1.0 Prototype</div>
      </div>

      {/* Current user */}
      <div className="sb-user">
        <div className={`av ${rd.color}`}>{rd.av}</div>
        <div>
          <div className="sb-name">{rd.name}</div>
          <div className="sb-role">{rd.role}</div>
        </div>
      </div>

      {/* Navigation */}
      {nav.map(sec => (
        <div className="nav-section" key={sec.sec}>
          <div className="nav-lbl">{sec.sec}</div>
          {sec.items.map(item => (
            <div
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <i className={`ti ${item.icon}`} />
              {item.label}
            </div>
          ))}
        </div>
      ))}

      <div className="sb-footer">
        {/* Role switcher — prototype only */}
        <div className="role-sw">
          <div className="lbl">Switch account (prototype demo)</div>
          <div className="role-btns">
            {[
              { key: 'dean',       label: 'Dean' },
              { key: 'instructor', label: 'Instructor' },
            ].map(r => (
              <button
                key={r.key}
                className={`rb ${curRole === r.key ? 'active' : ''}`}
                onClick={() => onRoleChange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <button className="sb-logout" onClick={onLogout}>
          <i className="ti ti-logout" />
          Log out
        </button>
      </div>
    </div>
  );
}
