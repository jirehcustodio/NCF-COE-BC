import React, { useMemo, useState } from 'react';
import { EmptyState, Notice } from '../Shared';

export default function FacultyRecords({ facultyRecords = [], teachingLoads = [] }) {
  const [query, setQuery] = useState('');
  const [dept, setDept] = useState('');
  const [status, setStatus] = useState('');

  const departments = useMemo(() => Array.from(new Set(facultyRecords.map(r => r.dept))), [facultyRecords]);

  const filtered = facultyRecords.filter(r =>
    (!query || r.name.toLowerCase().includes(query.toLowerCase()) || r.id.toLowerCase().includes(query.toLowerCase())) &&
    (!dept || r.dept === dept) &&
    (!status || r.status === status)
  );

  return (
    <>
      <div className="ph">
        <h2>Faculty records</h2>
  <p>Basic profile list and teaching loads for all programs</p>
      </div>

      <div className="stats">
        <div className="sc blue">
          <div className="sl">Total faculty</div>
          <div className="sv">{facultyRecords.length}</div>
          <div className="ss">Active and on-leave</div>
        </div>
        <div className="sc green">
          <div className="sl">Active</div>
          <div className="sv">{facultyRecords.filter(r => r.status === 'Active').length}</div>
          <div className="ss">Currently teaching</div>
        </div>
        <div className="sc amber">
          <div className="sl">On leave</div>
          <div className="sv">{facultyRecords.filter(r => r.status !== 'Active').length}</div>
          <div className="ss">For monitoring</div>
        </div>
        <div className="sc purple">
          <div className="sl">Teaching loads</div>
          <div className="sv">{teachingLoads.length}</div>
          <div className="ss">Active assignments</div>
        </div>
      </div>

      <div className="card">
        <div className="ch">
          <span className="ct">Faculty list</span>
        </div>
        <div className="search-row">
          <input
            placeholder="Search by name or faculty ID..."
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
          <select value={dept} onChange={event => setDept(event.target.value)}>
            <option value="">All programs</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={status} onChange={event => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="On Leave">On leave</option>
          </select>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Faculty ID</th>
                <th>Name</th>
                <th>Program</th>
                <th>Rank</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td className="hash">{r.id}</td>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td>{r.dept}</td>
                  <td>{r.rank}</td>
                  <td>
                    <span className={`badge ${r.status === 'Active' ? 'ok' : 'pend'}`}>
                      <i className={`ti ${r.status === 'Active' ? 'ti-check' : 'ti-clock'}`} />
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 20, color: 'var(--text-3)' }}>
                    No faculty records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="ch">
          <span className="ct">Teaching loads</span>
        </div>
        {teachingLoads.length === 0 ? (
          <EmptyState icon="ti-book">
            No teaching loads available.
          </EmptyState>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Faculty</th>
                  <th>Subject</th>
                  <th>Units</th>
                  <th>Schedule</th>
                </tr>
              </thead>
              <tbody>
                {teachingLoads.map((r, i) => (
                  <tr key={`${r.facultyId}-${i}`}>
                    <td style={{ fontWeight: 600 }}>{r.faculty}</td>
                    <td>{r.subject}</td>
                    <td>{r.units}</td>
                    <td>{r.schedule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Notice type="info" icon="ti-info-circle">
        Faculty records are restricted to authorized administrators. Teaching loads update per semester.
      </Notice>
    </>
  );
}
