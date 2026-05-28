import React, { useMemo, useState } from 'react';
import { ROLES } from '../../data/appData';
import { EmptyState, LogEntry, Notice } from '../Shared';

export default function Dashboard({ students, logs, blocks, auditLogs = [], gradeSheets = [], facultyRecords = [], onClearStudents }) {
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const onChain = blocks.reduce((sum, block) => sum + (block.count || 0), 0);
  const pendingUploads = gradeSheets.filter(sheet => sheet.status !== 'Submitted').length;
  const latestBlock = blocks.reduce((max, block) => Math.max(max, block.num || 0), 0);
  const periodicalSaves = logs.filter(entry => String(entry.desc || '').toLowerCase().includes('saved')).length;
  const blockchainCommits = blocks.length;

  const formatTime = (time) => {
    if (!time) return '—';
    const date = new Date(time);
    if (Number.isNaN(date.getTime())) return time;
    return date.toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const instructorOptions = useMemo(() => {
    const fromLogs = logs.map(entry => entry.prof).filter(Boolean);
    const fromBlocks = blocks.map(block => block.prof).filter(Boolean);
    const fromFaculty = facultyRecords.map(record => record.id).filter(Boolean);
    const fromAudit = auditLogs.map(entry => entry.prof || entry.user).filter(Boolean);
    return Array.from(new Set([...fromLogs, ...fromBlocks, ...fromFaculty, ...fromAudit]));
  }, [logs, blocks, facultyRecords, auditLogs]);

  const activityLogs = useMemo(() => {
    const baseLogs = logs.map(entry => ({
      ...entry,
      actor: entry.prof,
      displayTime: entry.time,
    }));
    const auditEntries = auditLogs.map(entry => ({
      ...entry,
      dot: entry.dot || 'b',
      desc: entry.desc || `${entry.action || 'Activity'} recorded`,
      actor: entry.prof || entry.user,
      displayTime: formatTime(entry.time),
    }));
    const combined = [...baseLogs, ...auditEntries];
    const parseDate = (value) => {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };
    const sorted = combined.sort((a, b) => {
      const aDate = parseDate(a.time || a.displayTime);
      const bDate = parseDate(b.time || b.displayTime);
      if (aDate && bDate) return bDate - aDate;
      if (aDate) return -1;
      if (bDate) return 1;
      return 0;
    });
    const filtered = selectedInstructor
      ? sorted.filter(entry => entry.actor === selectedInstructor)
      : sorted;
    return filtered;
  }, [logs, auditLogs, selectedInstructor]);

  const submissionRows = useMemo(() => {
    const map = new Map();
    instructorOptions.forEach(id => {
      const profile = facultyRecords.find(record => record.id === id);
      map.set(id, {
        id,
        name: profile?.name || ROLES[id]?.name || id,
        dept: profile?.dept || ROLES[id]?.dept || '—',
        uploads: 0,
        lastActivity: null,
      });
    });
    blocks.forEach(block => {
      const row = map.get(block.prof) || {
        id: block.prof,
        name: ROLES[block.prof]?.name || block.prof,
        dept: ROLES[block.prof]?.dept || '—',
        uploads: 0,
        lastActivity: null,
      };
      row.uploads += 1;
      row.lastActivity = block.time || row.lastActivity;
      map.set(block.prof, row);
    });
    logs.forEach(entry => {
      const row = map.get(entry.prof);
      if (row && entry.time) {
        row.lastActivity = row.lastActivity || entry.time;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.uploads - a.uploads);
  }, [blocks, logs, facultyRecords, instructorOptions]);

  const submissionTrend = useMemo(() => {
    const parseDate = (value) => {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };
    const weekKey = (date) => {
      const copy = new Date(date);
      const day = (copy.getDay() + 6) % 7;
      copy.setDate(copy.getDate() - day);
      copy.setHours(0, 0, 0, 0);
      return copy;
    };
    const formatLabel = (date) => date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

    const counts = new Map();
    blocks.forEach(block => {
      const date = parseDate(block.time);
      if (!date) return;
      const key = weekKey(date).toISOString();
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    logs.forEach(entry => {
      if (!String(entry.desc || '').toLowerCase().includes('saved')) return;
      const date = parseDate(entry.time);
      if (!date) return;
      const key = weekKey(date).toISOString();
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    const rows = Array.from(counts.entries())
      .map(([key, value]) => ({ date: new Date(key), value }))
      .sort((a, b) => a.date - b.date)
      .slice(-8)
      .map(item => ({ label: formatLabel(item.date), value: item.value }));
    return rows;
  }, [blocks, logs]);

  return (
    <>
      <div className="ph">
        <h2>Dashboard</h2>
        <p>Full overview — Dean access only · 1st Semester A.Y. 2025–2026</p>
        {onClearStudents && (
          <button
            className="btn sm"
            type="button"
            onClick={() => {
              if (window.confirm('This will permanently delete all students. Continue?')) {
                onClearStudents();
              }
            }}
            style={{ marginTop: 12 }}
          >
            <i className="ti ti-trash" /> Clear all students
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="stats">
        <div className="sc blue">
          <div className="sl">Total Students</div>
          <div className="sv">{students.length}</div>
          <div className="ss">Enrolled this semester</div>
        </div>
        <div className="sc green">
          <div className="sl">On Blockchain</div>
          <div className="sv">{onChain}</div>
          <div className="ss">Immutable records</div>
        </div>
        <div className="sc amber">
          <div className="sl">Pending Upload</div>
          <div className="sv">{pendingUploads}</div>
          <div className="ss">Awaiting submission</div>
        </div>
        <div className="sc purple">
          <div className="sl">Block Height</div>
          <div className="sv">#{latestBlock}</div>
          <div className="ss">Latest committed block</div>
        </div>
      </div>

      <div className="two-col">
        {/* Recent activity */}
        <div className="card">
          <div className="ch">
            <span className="ct">Recent activity</span>
            <span className="badge live"><i className="ti ti-activity" /> Live</span>
          </div>
          <div className="search-row">
            <select value={selectedInstructor} onChange={event => setSelectedInstructor(event.target.value)}>
              <option value="">All instructors</option>
              {instructorOptions.map(ins => (
                <option key={ins} value={ins}>{ROLES[ins]?.name || ins}</option>
              ))}
            </select>
          </div>
          {activityLogs.length > 0 ? (
            activityLogs.slice(0, 6).map((l, i) => (
              <LogEntry
                key={`${l.time || l.displayTime}-${i}`}
                entry={{ ...l, time: l.displayTime || l.time }}
                showActor
                actorName={ROLES[l.actor]?.name || l.actor || '—'}
              />
            ))
          ) : (
            <EmptyState icon="ti-activity">No activity logs yet.</EmptyState>
          )}
        </div>

        {/* Instructor status */}
        <div className="card">
          <div className="ch"><span className="ct">Instructor submission status</span></div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Instructor</th><th>Program</th>
                  <th>Uploads</th><th>Last activity</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {submissionRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 16, color: 'var(--text-3)' }}>
                      No instructor submissions yet.
                    </td>
                  </tr>
                ) : (
                  submissionRows.map((r, i) => (
                    <tr key={`${r.id}-${i}`}>
                      <td style={{ fontWeight: 500 }}>{r.name}</td>
                      <td style={{ fontSize: 11 }}>{r.dept}</td>
                      <td>{r.uploads}</td>
                      <td style={{ fontSize: 11 }}>{r.lastActivity || '—'}</td>
                      <td>
                        {r.uploads > 0
                          ? <span className="badge ok"><i className="ti ti-check" /> Active</span>
                          : <span className="badge pend"><i className="ti ti-clock" /> Pending</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="ch"><span className="ct">Periodical saves vs blockchain commits</span></div>
          <div className="summary-grid">
            <div className="summary-card">
              <span>Periodical saves</span>
              <strong>{periodicalSaves}</strong>
            </div>
            <div className="summary-card">
              <span>Blockchain commits</span>
              <strong>{blockchainCommits}</strong>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="ch"><span className="ct">Submissions per week</span></div>
          {submissionTrend.length === 0 ? (
            <EmptyState icon="ti-chart-bar">No submission trend data yet.</EmptyState>
          ) : (
            <div className="trend-chart">
              {submissionTrend.map(row => (
                <div className="trend-row" key={row.label}>
                  <div className="trend-label">{row.label}</div>
                  <div className="trend-bar">
                    <span style={{ width: `${Math.min(100, row.value * 15)}%` }} />
                  </div>
                  <div className="trend-value">{row.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Notice type="lock" icon="ti-lock">
        All on-chain grade records are <strong>immutable and irreversible</strong>.
        Instructors can only view and manage their own students.
        The Dean has full read access across all departments.
      </Notice>
    </>
  );
}
