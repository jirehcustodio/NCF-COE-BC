import React, { useState } from 'react';
import { ROLES } from '../../data/appData';
import { StatusBadge, UploadMethodBadge } from '../Shared';

export default function AllStudents({ students }) {
  const [query, setQuery] = useState('');
  const [prof,  setProf]  = useState('');

  const filtered = students.filter(s =>
    (!query || s.name.toLowerCase().includes(query.toLowerCase()) || s.id.toLowerCase().includes(query.toLowerCase())) &&
    (!prof  || s.prof === prof)
  );

  return (
    <>
      <div className="ph">
        <h2>All student lists</h2>
        <p>All enrolled students across all instructors — Dean only</p>
      </div>
      <div className="card">
        <div className="ch">
          <span className="ct">Complete student roster ({students.length} total)</span>
        </div>
        <div className="search-row">
          <input placeholder="Search name or ID..." value={query} onChange={e => setQuery(e.target.value)} />
          <select value={prof} onChange={e => setProf(e.target.value)}>
            <option value="">All instructors</option>
            <option value="reyes">Engr. Reyes</option>
            <option value="lim">Engr. Lim</option>
          </select>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Student ID</th><th>Name</th><th>Department</th>
                <th>Subject</th><th>Instructor</th><th>Upload method</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td className="hash">{s.id}</td>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td style={{ fontSize: 11 }}>{s.dept}</td>
                  <td>{s.subj}</td>
                  <td style={{ fontSize: 11 }}>{ROLES[s.prof].name}</td>
                  <td><UploadMethodBadge method={s.uploadMethod} /></td>
                  <td><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
