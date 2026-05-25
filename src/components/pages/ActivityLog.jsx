/* ============================================================
   ActivityLog.jsx — Account Security & Audit Log with Device Tracking
   ============================================================ */
import React, { useState, useMemo, useEffect } from 'react';
import { Notice, EmptyState } from '../Shared';
import { ROLES } from '../../data/appData';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { fetchAuditLogs, fetchAuditPresence } from '../../lib/queries';

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
  const [selectedTab, setSelectedTab] = useState('submissions');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [persistentAuditLogs, setPersistentAuditLogs] = useState(() => loadAuditLogsFromStorage());
  const [presenceMap, setPresenceMap] = useState({});
  const [remoteAuditLogs, setRemoteAuditLogs] = useState([]);
  const [remotePresence, setRemotePresence] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 40;

  // Sync persistent audit logs with localStorage whenever they change
  useEffect(() => {
    saveAuditLogsToStorage(persistentAuditLogs);
  }, [persistentAuditLogs]);

  useEffect(() => {
    const loadPresence = () => {
      try {
        const stored = localStorage.getItem('presenceStatus');
        setPresenceMap(stored ? JSON.parse(stored) : {});
      } catch (e) {
        console.error('Failed to load presence state:', e);
        setPresenceMap({});
      }
    };
    loadPresence();
    const timer = setInterval(loadPresence, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    let active = true;
    const loadRemoteAudit = async () => {
      setAuditLoading(true);
      const [auditRes, presenceRes] = await Promise.all([
        fetchAuditLogs(),
        fetchAuditPresence(),
      ]);
      if (!active) return;
      setRemoteAuditLogs(auditRes.data || []);
      setRemotePresence(presenceRes.data || []);
      setAuditLoading(false);
    };
    loadRemoteAudit();
    const timer = setInterval(loadRemoteAudit, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

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

    (remoteAuditLogs || []).forEach(log => {
      const logId = `${log.prof || log.user}-${log.time}-${log.action}`;
      if (!persistedIds.has(logId)) {
        combined.push({
          ...log,
          prof: log.prof || log.user,
          user: log.user || log.prof,
          userAgent: log.user_agent || log.userAgent,
          ipAddress: log.ip_address || log.ipAddress,
          device: log.device || log.device,
          os: log.os || log.os,
        });
      }
    });

    return combined.sort((a, b) => new Date(b.time) - new Date(a.time));
  }, [auditLogs, persistentAuditLogs, remoteAuditLogs]);

  // Filter activity logs for current user
  const myLogs = useMemo(() => {
    return logs.filter(l => l.prof === activeProf);
  }, [logs, activeProf]);

  // ALL audit logs enriched with device detection (visible to all accounts)
  const allAuditLogsEnriched = useMemo(() => {
    const remotePresenceMap = (remotePresence || []).reduce((acc, entry) => {
      if (!entry?.user) return acc;
      acc[entry.user] = {
        user: entry.user,
        lastSeen: entry.last_seen,
        ipAddress: entry.ip_address,
        userAgent: entry.user_agent,
        device: entry.device,
        os: entry.os,
        status: entry.status,
      };
      return acc;
    }, {});
    const mergedPresence = { ...presenceMap, ...remotePresenceMap };
    const logsWithPresence = [...(combinedAuditLogs || [])];
    Object.values(mergedPresence).forEach(entry => {
      if (!entry?.user || !entry?.lastSeen) return;
      const exists = logsWithPresence.some(log => log.prof === entry.user && log.time === entry.lastSeen);
      if (!exists) {
        logsWithPresence.push({
          prof: entry.user,
          user: entry.user,
          action: 'Online',
          time: entry.lastSeen,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        });
      }
    });

    return logsWithPresence.map(log => {
      const ua = log.userAgent || mergedPresence[log.prof || log.user]?.userAgent || '';
      const presence = mergedPresence[log.prof || log.user];
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

  const logTime = new Date(presence?.lastSeen || log.time).getTime();
      const now = new Date().getTime();
      const isOnline = (now - logTime) < 5 * 60 * 1000;
      const account = log.prof || log.user;

      return {
        ...log,
        device,
        deviceIcon,
        os,
        isOnline,
        account,
        ipAddress: log.ipAddress || presence?.ipAddress,
      };
    }).sort((a, b) => new Date(b.time) - new Date(a.time));
  }, [combinedAuditLogs, presenceMap, remotePresence]);

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
          <i className="ti ti-shield-alert" /> Account Security ({allAuditLogsEnriched.length})
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

          {auditLoading && (
            <Notice type="info" icon="ti-loader">
              Loading latest audit logs and device presence...
            </Notice>
          )}

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
