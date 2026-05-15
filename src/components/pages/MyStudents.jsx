import React from 'react';
import { ROLES } from '../../data/appData';
import { StatusBadge, Notice } from '../Shared';

export default function MyStudents({ students, curRole, onNavigate }) {
  const myS = students.filter(s => s.prof === curRole);
  const rd  = ROLES[curRole];

  return (
    <>
      <div className="ph">
        <h2>My student list</h2>
        <p>{rd.name} · {rd.dept} — only your enrolled students are visible here</p>
      </div>
      <Notice type="info" icon="ti-eye-off">
        Student records from other instructors are <strong>not visible</strong> to you.
        Only your own enrolled students appear in this system.
      </Notice>
      <div className="card">
        <div className="ch">
          <span className="ct">My students ({myS.length} total)</span>
          <button className="btn pri sm" onClick={() => onNavigate('upload')}>
            <i className="ti ti-upload" /> Upload grades
          </button>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Student ID</th><th>Name</th><th>Subject</th>
                <th>Pre.</th><th>Mid.</th><th>Semi</th><th>Fin.</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myS.map(s => (
                <tr key={s.id}>
                  <td className="hash">{s.id}</td>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td>{s.subj}</td>
                  <td>{s.prelim  ?? '—'}</td>
                  <td>{s.midterm ?? '—'}</td>
                  <td>{s.semi    ?? '—'}</td>
                  <td>{s.final   ?? '—'}</td>
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
