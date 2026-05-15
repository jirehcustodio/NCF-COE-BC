import React from 'react';
import { ROLES, INSTRUCTORS_TABLE } from '../../data/appData';
import { LogEntry, Notice } from '../Shared';

export default function Dashboard({ students, logs, blocks }) {
  const onChain = students.filter(s => s.status === 'chain').length;
  const pend    = students.filter(s => s.status === 'pend').length;

  return (
    <>
      <div className="ph">
        <h2>Dashboard</h2>
        <p>Full overview — Dean access only · 1st Semester A.Y. 2025–2026</p>
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
          <div className="sv">{pend}</div>
          <div className="ss">Awaiting submission</div>
        </div>
        <div className="sc purple">
          <div className="sl">Block Height</div>
          <div className="sv">#{blocks[blocks.length - 1]?.num || 0}</div>
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
          {logs.slice(0, 5).map((l, i) => (
            <LogEntry key={i} entry={l} />
          ))}
        </div>

        {/* Instructor status */}
        <div className="card">
          <div className="ch"><span className="ct">Instructor submission status</span></div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Instructor</th><th>Department</th>
                  <th>Uploads</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {INSTRUCTORS_TABLE.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                    <td style={{ fontSize: 11 }}>{r.dept}</td>
                    <td>{r.uploads}</td>
                    <td>
                      {r.status === 'ok'
                        ? <span className="badge ok"><i className="ti ti-check" /> Active</span>
                        : <span className="badge pend"><i className="ti ti-clock" /> Pending</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
