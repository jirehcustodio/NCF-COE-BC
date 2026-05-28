/* ============================================================
   Sidebar.jsx — Navigation sidebar with role switching
   ============================================================ */
import React from 'react';
import { ROLES, ADMIN_NAV, DEAN_NAV, PROF_NAV } from '../data/appData';

export default function Sidebar({
  curRole,
  program = '',
  userName,
  avatarUrl,
  onOpenProfile,
  activePage,
  onRoleChange,
  onNavigate,
  onLogout,
  showRoleSwitcher = true,
}) {
  const rd   = ROLES[curRole];
  const nav  = rd.type === 'admin' ? ADMIN_NAV : rd.type === 'dean' ? DEAN_NAV : PROF_NAV;
  const displayName = userName || rd.name;
  const initials = displayName.split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase();

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
      <div className="sb-user" onClick={onOpenProfile} role="button" tabIndex={0} onKeyDown={(event) => {
        if (event.key === 'Enter') onOpenProfile && onOpenProfile();
      }}>
        <div
          className={`av ${rd.color}`}
          style={avatarUrl ? { backgroundImage: `url(${avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : undefined}
        >
          {!avatarUrl && (initials || rd.av)}
        </div>
        <div>
          <div className="sb-name">{displayName}</div>
          <div className="sb-role">{rd.role}</div>
          {rd.type === 'instructor' && program && (
            <div className="sb-program">
              <span className="badge info">Program: {program}</span>
            </div>
          )}
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
        {showRoleSwitcher && (
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
        )}

        <button className="sb-logout" onClick={onLogout}>
          <i className="ti ti-logout" />
          Log out
        </button>
      </div>
    </div>
  );
}
