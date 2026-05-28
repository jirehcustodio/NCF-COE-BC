/* ============================================================
   ActivityLog.jsx — Account Security & Audit Log with Device Tracking
   ============================================================ */
import React, { useState, useMemo, useEffect } from 'react';
import { Notice, EmptyState } from '../Shared';
import { ROLES } from '../../data/appData';

// Helper: Load audit logs from localStorage
const loadAuditLogsFromStorage = () => {
  try {
    const stored = localStorage.getItem('auditLogs');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to load audit logs from storage:', e);
    return [];
  }
};

// Helper: Save audit logs to localStorage
const saveAuditLogsToStorage = (logs) => {
  try {
    localStorage.setItem('auditLogs', JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save audit logs to storage:', e);
  }
};

export default function ActivityLog({ logs = [], auditLogs = [], curRole, profKey, onEnrollmentLogged }) {
  const activeProf = profKey || curRole;
  const rd = ROLES[curRole];
  const canViewAll = rd?.type === 'dean' || rd?.type === 'admin';
  const [selectedTab, setSelectedTab] = useState('submissions');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [persistentAuditLogs, setPersistentAuditLogs] = useState(() => loadAuditLogsFromStorage());
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 40;

  // Sync persistent audit logs with localStorage whenever they change
  useEffect(() => {
    saveAuditLogsToStorage(persistentAuditLogs);
  }, [persistentAuditLogs]);

  // Merge in-memory logs with persistent logs (avoid duplicates)
  const combinedAuditLogs = useMemo(() => {
    const combined = [...persistentAuditLogs];
    const persistedIds = new Set(persistentAuditLogs.map(l => `${l.prof}-${l.time}-${l.action}`));
    
    (auditLogs || []).forEach(log => {
      const logId = `${log.prof}-${log.time}-${log.action}`;
      if (!persistedIds.has(logId)) {
        combined.push(log);
      }
    });

    return combined.sort((a, b) => new Date(b.time) - new Date(a.time));
  }, [auditLogs, persistentAuditLogs]);

  // Filter activity logs for current user
  const myLogs = useMemo(() => {
    return logs.filter(l => l.prof === activeProf);
  }, [logs, activeProf]);

  // ALL audit logs enriched with device detection (visible to all accounts)
  const allAuditLogsEnriched = useMemo(() => {
    return (combinedAuditLogs || [])
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
  }, [combinedAuditLogs]);

  const submissionLogs = useMemo(() => {
    return canViewAll ? logs : myLogs;
  }, [canViewAll, logs, myLogs]);

  const enrollmentLogs = useMemo(() => {
    return allAuditLogsEnriched.filter(log => log.action === 'Enrollment');
  }, [allAuditLogsEnriched]);

  const commitLogs = useMemo(() => {
    return logs.filter(log => String(log.desc || '').toLowerCase().includes('committed'));
  }, [logs]);

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

  // Pagination for large datasets
  const totalPages = Math.ceil(filteredAuditLogs.length / rowsPerPage);
  const paginatedAuditLogs = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredAuditLogs.slice(start, end);
  }, [filteredAuditLogs, currentPage, rowsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [accountFilter, deviceFilter]);

  const formatTime = (time) => {
    if (!time) return '—';
    try {
      const d = new Date(time);
      return d.toLocaleString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
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
        All activity is logged for security purposes. {canViewAll ? 'You can review enrollments, grade submissions, and commits.' : 'You can see where and when your account was accessed.'}
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
          <i className="ti ti-upload" /> {canViewAll ? 'Grade submissions' : 'My submissions'} ({submissionLogs.length})
        </button>
        {canViewAll && (
          <button
            onClick={() => setSelectedTab('enrollments')}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: 'none',
              background: selectedTab === 'enrollments' ? 'var(--primary-light)' : 'transparent',
              color: selectedTab === 'enrollments' ? '#fff' : 'var(--text)',
              cursor: 'pointer',
              fontWeight: selectedTab === 'enrollments' ? '600' : '500',
              fontSize: '13px',
              transition: 'all 0.2s',
            }}
          >
            <i className="ti ti-user-plus" /> Enrollments ({enrollmentLogs.length})
          </button>
        )}
        {canViewAll && (
          <button
            onClick={() => setSelectedTab('commits')}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: 'none',
              background: selectedTab === 'commits' ? 'var(--primary-light)' : 'transparent',
              color: selectedTab === 'commits' ? '#fff' : 'var(--text)',
              cursor: 'pointer',
              fontWeight: selectedTab === 'commits' ? '600' : '500',
              fontSize: '13px',
              transition: 'all 0.2s',
            }}
          >
            <i className="ti ti-link" /> Blockchain commits ({commitLogs.length})
          </button>
        )}
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
          <i className="ti ti-shield-alert" /> Account Security ({allAuditLogsEnriched.length})
        </button>
      </div>

      {/* Submissions Tab */}
      {selectedTab === 'submissions' && (
        <div className="card">
          <div className="ch">
            <span className="ct"><i className="ti ti-upload" /> {canViewAll ? 'Grade submissions' : 'My submissions'}</span>
          </div>
          {submissionLogs.length === 0 ? (
            <EmptyState icon="ti-clipboard-x">No submissions yet. Upload your first grade sheet to get started.</EmptyState>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {submissionLogs.map((log, i) => (
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
                      {canViewAll && log.prof && (
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-3)' }}>
                          By: {log.prof}
                        </p>
                      )}
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

      {canViewAll && selectedTab === 'enrollments' && (
        <div className="card">
          <div className="ch">
            <span className="ct"><i className="ti ti-user-plus" /> Enrollment activity</span>
          </div>
          {enrollmentLogs.length === 0 ? (
            <EmptyState icon="ti-user-plus">No enrollment activity recorded yet.</EmptyState>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {enrollmentLogs.map((log, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(128, 0, 32, 0.12)',
                    background: '#f9f9f9',
                  }}
                >
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                    {log.desc || 'Enrollment activity'}
                  </p>
                  <p style={{ margin: '0', fontSize: '12px', color: 'var(--text-2)' }}>
                    {formatTime(log.time)}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-3)' }}>
                    By: {log.account || log.prof || log.user || '—'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {canViewAll && selectedTab === 'commits' && (
        <div className="card">
          <div className="ch">
            <span className="ct"><i className="ti ti-link" /> Blockchain commits</span>
          </div>
          {commitLogs.length === 0 ? (
            <EmptyState icon="ti-link">No blockchain commits recorded yet.</EmptyState>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {commitLogs.map((log, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(128, 0, 32, 0.12)',
                    background: '#f9f9f9',
                  }}
                >
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                    {log.desc || 'Blockchain commit'}
                  </p>
                  <p style={{ margin: '0', fontSize: '12px', color: 'var(--text-2)' }}>
                    {formatTime(log.time)}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-3)' }}>
                    By: {log.prof || '—'}
                  </p>
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
            <>
              {/* Table-like Layout for Better Readability */}
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr 1fr auto', gap: '0', minWidth: '800px', fontSize: '12px' }}>
                  {/* Header Row */}
                  <div style={{ padding: '10px 12px', background: 'rgba(128, 0, 32, 0.08)', fontWeight: '600', color: 'var(--text)', borderBottom: '2px solid rgba(128, 0, 32, 0.2)', textAlign: 'center' }}>#</div>
                  <div style={{ padding: '10px 12px', background: 'rgba(128, 0, 32, 0.08)', fontWeight: '600', color: 'var(--text)', borderBottom: '2px solid rgba(128, 0, 32, 0.2)' }}>Timestamp</div>
                  <div style={{ padding: '10px 12px', background: 'rgba(128, 0, 32, 0.08)', fontWeight: '600', color: 'var(--text)', borderBottom: '2px solid rgba(128, 0, 32, 0.2)' }}>Account</div>
                  <div style={{ padding: '10px 12px', background: 'rgba(128, 0, 32, 0.08)', fontWeight: '600', color: 'var(--text)', borderBottom: '2px solid rgba(128, 0, 32, 0.2)' }}>Action</div>
                  <div style={{ padding: '10px 12px', background: 'rgba(128, 0, 32, 0.08)', fontWeight: '600', color: 'var(--text)', borderBottom: '2px solid rgba(128, 0, 32, 0.2)' }}>Device & OS</div>
                  <div style={{ padding: '10px 12px', background: 'rgba(128, 0, 32, 0.08)', fontWeight: '600', color: 'var(--text)', borderBottom: '2px solid rgba(128, 0, 32, 0.2)' }}>IP Address</div>
                  <div style={{ padding: '10px 12px', background: 'rgba(128, 0, 32, 0.08)', fontWeight: '600', color: 'var(--text)', borderBottom: '2px solid rgba(128, 0, 32, 0.2)', textAlign: 'center' }}>Status</div>

                  {/* Data Rows */}
                  {paginatedAuditLogs.map((log, i) => {
                    const rowIndex = (currentPage - 1) * rowsPerPage + i + 1;
                    return (
                      <React.Fragment key={`${log.prof}-${log.time}-${i}`}>
                        <div style={{ padding: '10px 12px', background: log.isOnline ? 'rgba(34, 197, 94, 0.02)' : '#fff', borderBottom: '1px solid rgba(128, 0, 32, 0.08)', textAlign: 'center', color: 'var(--text-2)', fontSize: '11px' }}>
                          {rowIndex}
                        </div>
                        <div style={{ padding: '10px 12px', background: log.isOnline ? 'rgba(34, 197, 94, 0.02)' : '#fff', borderBottom: '1px solid rgba(128, 0, 32, 0.08)', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text)' }}>
                          {formatTime(log.time)}
                        </div>
                        <div style={{ padding: '10px 12px', background: log.isOnline ? 'rgba(34, 197, 94, 0.02)' : '#fff', borderBottom: '1px solid rgba(128, 0, 32, 0.08)', color: 'var(--text)' }}>
                          {log.account || log.prof || '—'}
                        </div>
                        <div style={{ padding: '10px 12px', background: log.isOnline ? 'rgba(34, 197, 94, 0.02)' : '#fff', borderBottom: '1px solid rgba(128, 0, 32, 0.08)' }}>
                          <span style={{ padding: '3px 6px', borderRadius: '3px', background: log.action === 'Login' ? 'rgba(34, 197, 94, 0.15)' : log.action === 'Enrollment' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(59, 130, 246, 0.15)', color: log.action === 'Login' ? '#22c55e' : log.action === 'Enrollment' ? '#f97316' : '#3b82f6', fontSize: '11px', fontWeight: '600' }}>
                            {log.action || 'Activity'}
                          </span>
                        </div>
                        <div style={{ padding: '10px 12px', background: log.isOnline ? 'rgba(34, 197, 94, 0.02)' : '#fff', borderBottom: '1px solid rgba(128, 0, 32, 0.08)', color: 'var(--text)', fontSize: '11px' }}>
                          <i className={`ti ${log.deviceIcon}`} style={{ marginRight: '4px' }} />
                          {log.device} ({log.os})
                        </div>
                        <div style={{ padding: '10px 12px', background: log.isOnline ? 'rgba(34, 197, 94, 0.02)' : '#fff', borderBottom: '1px solid rgba(128, 0, 32, 0.08)', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-2)' }}>
                          {log.ipAddress && !log.ipAddress.includes('server-side') ? log.ipAddress : '—'}
                        </div>
                        <div style={{ padding: '10px 12px', background: log.isOnline ? 'rgba(34, 197, 94, 0.02)' : '#fff', borderBottom: '1px solid rgba(128, 0, 32, 0.08)', textAlign: 'center' }}>
                          {log.isOnline ? (
                            <span style={{ color: '#22c55e', fontSize: '11px', fontWeight: '600' }}>🟢 Online</span>
                          ) : (
                            <span style={{ color: 'var(--text-3)', fontSize: '11px' }}>—</span>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', paddingTop: '12px', borderTop: '1px solid rgba(128, 0, 32, 0.12)' }}>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: '1px solid rgba(128, 0, 32, 0.2)',
                      background: currentPage === 1 ? '#f0f0f0' : '#fff',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: currentPage === 1 ? 'var(--text-3)' : 'var(--text)',
                    }}
                  >
                    ← Previous
                  </button>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = totalPages <= 5 ? i + 1 : currentPage - 2 + i;
                      if (pageNum > 0 && pageNum <= totalPages) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '4px',
                              border: pageNum === currentPage ? '2px solid var(--primary)' : '1px solid rgba(128, 0, 32, 0.2)',
                              background: pageNum === currentPage ? 'var(--primary-light)' : '#fff',
                              color: pageNum === currentPage ? '#fff' : 'var(--text)',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: pageNum === currentPage ? '600' : '500',
                              minWidth: '32px',
                              textAlign: 'center',
                            }}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: '1px solid rgba(128, 0, 32, 0.2)',
                      background: currentPage === totalPages ? '#f0f0f0' : '#fff',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: currentPage === totalPages ? 'var(--text-3)' : 'var(--text)',
                    }}
                  >
                    Next →
                  </button>

                  <span style={{ marginLeft: '12px', fontSize: '12px', color: 'var(--text-2)', fontWeight: '500' }}>
                    Page {currentPage} of {totalPages} • Showing {paginatedAuditLogs.length} of {filteredAuditLogs.length} records
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
