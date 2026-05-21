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

  // Filter activity logs for current user
  const myLogs = useMemo(() => {
    return logs.filter(l => l.prof === activeProf);
  }, [logs, activeProf]);

  // Filter and enrich audit logs with device detection
  const myAuditLogs = useMemo(() => {
    return (auditLogs || [])
      .filter(l => l.prof === activeProf || l.user === activeProf)
      .map(log => {
        // Detect device from user agent or system info
        const ua = log.userAgent || navigator.userAgent || '';
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

        return { ...log, device, deviceIcon, os };
      });
  }, [auditLogs, activeProf]);

  // Get unique devices
  const deviceOptions = useMemo(() => {
    const devices = new Set(myAuditLogs.map(l => l.device).filter(Boolean));
    return Array.from(devices);
  }, [myAuditLogs]);

  // Filter audit logs by device
  const filteredAuditLogs = useMemo(() => {
    if (deviceFilter === 'all') return myAuditLogs;
    return myAuditLogs.filter(l => l.device === deviceFilter);
  }, [myAuditLogs, deviceFilter]);

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
            <span className="ct"><i className="ti ti-shield-alert" /> Account Security Audit</span>
          </div>

          {/* Device Filter */}
          {deviceOptions.length > 0 && (
            <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(128, 0, 32, 0.12)' }}>
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
                  maxWidth: '200px',
                }}
              >
                <option value="all">All devices ({myAuditLogs.length})</option>
                {deviceOptions.map(device => {
                  const count = myAuditLogs.filter(l => l.device === device).length;
                  return (
                    <option key={device} value={device}>
                      {device} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

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
                    background: '#f9f9f9',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ fontSize: '20px', color: 'var(--primary)' }}>
                      <i className={`ti ${log.deviceIcon}`} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                        {log.device}
                      </p>
                      <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: 'var(--text-2)' }}>
                        <i className="ti ti-device-laptop" /> {log.os || 'Unknown OS'}
                      </p>
                      <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: 'var(--text-2)' }}>
                        {log.action || 'Login'} • {formatTime(log.time)}
                      </p>
                      {log.ipAddress && (
                        <p style={{ margin: '0', fontSize: '11px', color: 'var(--text-3)' }}>
                          IP: {log.ipAddress}
                        </p>
                      )}
                    </div>
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
