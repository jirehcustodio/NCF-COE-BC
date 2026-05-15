import React, { useState } from 'react';
import { ROLES } from '../../data/appData';
import { StatusBadge } from '../Shared';

export default function AllGrades({ students }) {
  const [query, setQuery]   = useState('');
  const [prof,  setProf]    = useState('');
  const [subj,  setSubj]    = useState('');
  const [stat,  setStat]    = useState('');

  const filtered = students.filter(s =>
    (!query || s.name.toLowerCase().includes(query.toLowerCase()) || s.id.toLowerCase().includes(query.toLowerCase())) &&
    (!prof  || s.prof   === prof) &&
    (!subj  || s.subj   === subj) &&
    (!stat  || s.status === stat)
  );

  return (
    <>
      <div className="ph">
        <h2>All grade records</h2>
        <p>Complete grade view across all instructors and departments — Dean only</p>
      </div>
      <div className="card">
        <div className="search-row">
          <input placeholder="Search by name or student ID..." value={query} onChange={e => setQuery(e.target.value)} />
          <select value={prof} onChange={e => setProf(e.target.value)}>
            <option value="">All instructors</option>
            <option value="reyes">Engr. Reyes</option>
            <option value="lim">Engr. Lim</option>
          </select>
          <select value={subj} onChange={e => setSubj(e.target.value)}>
            <option value="">All subjects</option>
            <option>CE 401</option><option>CE 301</option><option>EE 301</option>
          </select>
          <select value={stat} onChange={e => setStat(e.target.value)}>
            <option value="">All statuses</option>
            <option value="chain">On chain</option>
            <option value="ok">Uploaded</option>
            <option value="pend">Pending</option>
          </select>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Student ID</th><th>Name</th><th>Department</th>
                <th>Subject</th><th>Instructor</th>
                <th>Pre.</th><th>Mid.</th><th>Semi</th><th>Fin.</th><th>Status</th>
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
                  <td>{s.prelim  ?? '—'}</td>
                  <td>{s.midterm ?? '—'}</td>
                  <td>{s.semi    ?? '—'}</td>
                  <td>{s.final   ?? '—'}</td>
                  <td><StatusBadge status={s.status} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign:'center', color:'var(--text-3)', padding:24 }}>No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
