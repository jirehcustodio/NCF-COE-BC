import React, { useMemo } from 'react';
import { Notice } from '../Shared';

export default function AdminDashboard({ facultyRecords = [], blocks = [], logs = [] }) {
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
      <Notice type="info" icon="ti-shield-check">
        Admins can create and deactivate faculty accounts. Deactivated accounts cannot sign in to the system.
      </Notice>
    </>
  );
}
