import React, { useMemo } from 'react';
import { Notice } from '../Shared';

export default function AdminDashboard({ facultyRecords = [], blocks = [], logs = [], onNavigate }) {
  const totals = useMemo(() => {
    const active = facultyRecords.filter(record => record.status !== 'Inactive').length;
    const inactive = facultyRecords.filter(record => record.status === 'Inactive').length;
    return {
      total: facultyRecords.length,
      active,
      inactive,
      commits: blocks.length,
      logs: logs.length,
    };
  }, [facultyRecords, blocks, logs]);

  return (
    <>
      <div className="ph">
        <h2>Admin dashboard</h2>
        <p>System overview — manage accounts and security</p>
      </div>
      <div className="stats">
        <div className="sc blue">
          <div className="sl">Total Accounts</div>
          <div className="sv">{totals.total}</div>
          <div className="ss">Faculty + deans</div>
        </div>
        <div className="sc green">
          <div className="sl">Active Accounts</div>
          <div className="sv">{totals.active}</div>
          <div className="ss">Enabled users</div>
        </div>
        <div className="sc amber">
          <div className="sl">Inactive Accounts</div>
          <div className="sv">{totals.inactive}</div>
          <div className="ss">Restricted access</div>
        </div>
        <div className="sc purple">
          <div className="sl">Blockchain Commits</div>
          <div className="sv">{totals.commits}</div>
          <div className="ss">Total blocks</div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <div className="ch"><span className="ct">Create accounts</span></div>
        <p style={{ margin: '0 0 12px', color: 'var(--text-2)', fontSize: 13 }}>
          Go to Faculty Accounts to create instructor or dean logins.
        </p>
        <div className="inline-actions">
          <button className="btn pri" onClick={() => onNavigate && onNavigate('instructors')}>
            <i className="ti ti-user-plus" /> Create faculty account
          </button>
        </div>
      </div>
      <Notice type="info" icon="ti-shield-check">
        Admins can create and deactivate faculty accounts. Deactivated accounts cannot sign in to the system.
      </Notice>
    </>
  );
}
