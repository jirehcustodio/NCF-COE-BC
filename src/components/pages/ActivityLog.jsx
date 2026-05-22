/* ============================================================
   ActivityLog.jsx — Account Security & Audit Log with Device Tracking
   ============================================================ */
import React, { useState, useMemo } from 'react';
import { Notice, EmptyState } from '../Shared';
import { ROLES } from '../../data/appData';

export default function ActivityLog({ logs = [], auditLogs = [], curRole, profKey }) {
  const activeProf = profKey || curRole;
  const rd = ROLES[curRole];
  const [selectedTab, setSelectedTab] = useState('submissions');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');

  // Filter activity logs for current user
  const myLogs = useMemo(() => {
    return logs.filter(l => l.prof === activeProf);
  }, [logs, activeProf]);

  // ALL audit logs enriched with device detection (visible to all accounts)
  const allAuditLogsEnriched = useMemo(() => {
    return (auditLogs || [])
      .map(log => {
        // Detect device from user agent or system info
        const ua = log.userAgent || '';
        let device = 'Unknown Device';
        let deviceIcon = 'ti-device-laptop';
        let os = 'Unknown OS';

        if (ua.includes('iPhone') || ua.includes('iPad')) {
          device = 'iOS Device';
          deviceIcon = 'ti-device-mobile';
          os = 'iOS';
        } else if (ua.includes('Android')) {
          device = 'Android Device';
          deviceIcon = 'ti-device-mobile';
          os = 'Android';
        } else if (ua.includes('Windows')) {
          device = 'Windows PC';
          deviceIcon = 'ti-device-laptop';
          os = 'Windows';
        } else if (ua.includes('Mac')) {
          device = 'Mac';
          deviceIcon = 'ti-device-laptop';
          os = 'macOS';
        } else if (ua.includes('Linux')) {
          device = 'Linux PC';
          deviceIcon = 'ti-device-laptop';
          os = 'Linux';
        }

        // Check if account is online (last login within last 5 minutes)
        const logTime = new Date(log.time).getTime();
        const now = new Date().getTime();
        const isOnline = (now - logTime) < 5 * 60 * 1000; // 5 minutes

        return { ...log, device, deviceIcon, os, isOnline, account: log.prof || log.user };
      });
  }, [auditLogs]);

  // Get unique accounts
  const accountOptions = useMemo(() => {
    const accounts = new Set(allAuditLogsEnriched.map(l => l.account).filter(Boolean));
    return Array.from(accounts).sort();
  }, [allAuditLogsEnriched]);

  // Filter by account first
  const filteredByAccount = useMemo(() => {
    if (accountFilter === 'all') return allAuditLogsEnriched;
    return allAuditLogsEnriched.filter(l => l.account === accountFilter);
  }, [allAuditLogsEnriched, accountFilter]);

  // Get unique devices from filtered accounts
  const deviceOptions = useMemo(() => {
    const devices = new Set(filteredByAccount.map(l => l.device).filter(Boolean));
    return Array.from(devices);
  }, [filteredByAccount]);

  // Filter audit logs by device
  const filteredAuditLogs = useMemo(() => {
    if (deviceFilter === 'all') return filteredByAccount;
    return filteredByAccount.filter(l => l.device === deviceFilter);
  }, [filteredByAccount, deviceFilter]);

  const formatTime = (time) => {
    if (!time) return '—';
    try {
      return new Date(time).toLocaleString();
    } catch (e) {
      return time;
    }
  };

  return (
    <>
      <div className="ph">
        <h2>Activity log & Account Security</h2>
        <p>{rd.name} · Monitor your submissions and login activity from all devices</p>
      </div>

      <Notice type="info" icon="ti-lock">
        All activity is logged for security purposes. You can see where and when your account was accessed.
      </Notice>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid rgba(128, 0, 32, 0.12)', paddingBottom: '12px' }}>
        <button
          onClick={() => setSelectedTab('submissions')}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            border: 'none',
            background: selectedTab === 'submissions' ? 'var(--primary-light)' : 'transparent',
            color: selectedTab === 'submissions' ? '#fff' : 'var(--text)',
            cursor: 'pointer',
            fontWeight: selectedTab === 'submissions' ? '600' : '500',
            fontSize: '13px',
            transition: 'all 0.2s',
          }}
        >
          <i className="ti ti-upload" /> Submissions ({myLogs.length})
        </button>
        <button
          onClick={() => setSelectedTab('audit')}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            border: 'none',
            background: selectedTab === 'audit' ? 'var(--primary-light)' : 'transparent',
            color: selectedTab === 'audit' ? '#fff' : 'var(--text)',
            cursor: 'pointer',
            fontWeight: selectedTab === 'audit' ? '600' : '500',
            fontSize: '13px',
            transition: 'all 0.2s',
          }}
        >
          <i className="ti ti-shield-alert" /> Account Security ({myAuditLogs.length})
        </button>
      </div>

      {/* Submissions Tab */}
      {selectedTab === 'submissions' && (
        <div className="card">
          <div className="ch">
            <span className="ct"><i className="ti ti-upload" /> My submissions</span>
          </div>
          {myLogs.length === 0 ? (
            <EmptyState icon="ti-clipboard-x">No submissions yet. Upload your first grade sheet to get started.</EmptyState>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myLogs.map((log, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(128, 0, 32, 0.12)',
                    background: '#f9f9f9',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                        {log.desc || 'Activity'}
                      </p>
                      <p style={{ margin: '0', fontSize: '12px', color: 'var(--text-2)' }}>
                        {formatTime(log.time)}
                      </p>
                    </div>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: 'rgba(34, 197, 94, 0.1)',
                        color: '#22c55e',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}
                    >
                      ✓ Recorded
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Account Security / Audit Log Tab */}
      {selectedTab === 'audit' && (
        <div className="card">
          <div className="ch">
            <span className="ct"><i className="ti ti-shield-alert" /> Account Security Audit (All Accounts)</span>
          </div>

          {/* Account & Device Filters */}
          <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(128, 0, 32, 0.12)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {accountOptions.length > 0 && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px', display: 'block' }}>
                  Filter by account
                </label>
                <select
                  value={accountFilter}
                  onChange={e => setAccountFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(128, 0, 32, 0.2)',
                    fontSize: '13px',
                    width: '100%',
                  }}
                >
                  <option value="all">All accounts ({allAuditLogsEnriched.length})</option>
                  {accountOptions.map(account => {
                    const count = allAuditLogsEnriched.filter(l => l.account === account).length;
                    const isOnline = allAuditLogsEnriched.some(l => l.account === account && l.isOnline);
                    return (
                      <option key={account} value={account}>
                        {account} ({count}) {isOnline ? '🟢 Online' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {deviceOptions.length > 0 && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px', display: 'block' }}>
                  Filter by device
                </label>
                <select
                  value={deviceFilter}
                  onChange={e => setDeviceFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(128, 0, 32, 0.2)',
                    fontSize: '13px',
                    width: '100%',
                  }}
                >
                  <option value="all">All devices ({filteredByAccount.length})</option>
                  {deviceOptions.map(device => {
                    const count = filteredByAccount.filter(l => l.device === device).length;
                    return (
                      <option key={device} value={device}>
                        {device} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          {filteredAuditLogs.length === 0 ? (
            <EmptyState icon="ti-info-circle">
              {deviceFilter !== 'all'
                ? 'No activity recorded on this device.'
                : 'No login activity recorded yet.'}
            </EmptyState>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredAuditLogs.map((log, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(128, 0, 32, 0.12)',
                    background: log.isOnline ? 'rgba(34, 197, 94, 0.05)' : '#f9f9f9',
                    borderLeft: log.isOnline ? '3px solid #22c55e' : '3px solid rgba(128, 0, 32, 0.12)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ fontSize: '20px', color: 'var(--primary)' }}>
                      <i className={`ti ${log.deviceIcon}`} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                        {log.device}
                        {log.account && <span style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: '400', marginLeft: '8px' }}>({log.account})</span>}
                      </p>
                      <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: 'var(--text-2)' }}>
                        <i className="ti ti-device-laptop" /> {log.os || 'Unknown OS'}
                      </p>
                      <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: 'var(--text-2)' }}>
                        {log.action || 'Login'} • {formatTime(log.time)}
                      </p>
                      {log.ipAddress && !log.ipAddress.includes('server-side') && (
                        <p style={{ margin: '0', fontSize: '11px', color: 'var(--text-3)' }}>
                          🌐 IP: {log.ipAddress}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: log.action === 'Login' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                          color: log.action === 'Login' ? '#22c55e' : '#3b82f6',
                          fontSize: '11px',
                          fontWeight: '600',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {log.action === 'Login' ? '✓ Login' : log.action || 'Activity'}
                      </span>
                      {log.isOnline && (
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: 'rgba(34, 197, 94, 0.1)',
                            color: '#22c55e',
                            fontSize: '11px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          🟢 Online
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
