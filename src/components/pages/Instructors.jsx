import React from 'react';

export default function Instructors({ instructors = [] }) {
  const rows = instructors.length ? instructors : [];

  return (
    <>
      <div className="ph">
        <h2>Instructors</h2>
        <p>Registered faculty with system access — Dean only</p>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Department</th><th>Subjects</th>
                <th>Uploads</th><th>Last active</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '18px', color: 'var(--text-3)' }}>
                    No instructors yet.
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{r.name}</td>
                  <td style={{ fontSize: 11 }}>{r.dept}</td>
                  <td>{r.subjects}</td>
                  <td>{r.uploads}</td>
                  <td style={{ fontSize: 11 }}>{r.last}</td>
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
    </>
  );
}
