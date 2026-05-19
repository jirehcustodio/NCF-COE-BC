import React, { useState } from 'react';
import { ROLES } from '../../data/appData';
import { StatusBadge, Notice } from '../Shared';

export default function MyStudents({ students, curRole, profKey, program = '', onNavigate, onDeleteStudent, onRefresh, refreshing = false, allowDelete = false }) {
  const activeProf = profKey || curRole;
  const myS = students.filter(s => s.prof === activeProf);
  const rd  = ROLES[curRole];
  const [showDelete, setShowDelete] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  function confirmDelete(student) {
    setSelectedStudent(student);
    setShowDelete(true);
  }

  function handleDelete() {
    if (selectedStudent && onDeleteStudent) {
      onDeleteStudent(selectedStudent);
    }
    setShowDelete(false);
    setSelectedStudent(null);
  }

  return (
    <>
      <div className="ph">
        <h2>My student list</h2>
        <p>{rd.name} · {program || 'Program not set'} — only your enrolled students are visible here</p>
      </div>
      <Notice type="info" icon="ti-eye-off">
        Student records from other instructors are <strong>not visible</strong> to you.
        Only your own enrolled students appear in this system.
      </Notice>
      <div className="card">
        <div className="ch">
          <span className="ct">My students ({myS.length} total)</span>
          <div className="inline-actions">
            <button
              className="btn sm"
              onClick={onRefresh}
              disabled={refreshing}
            >
              <i className={`ti ${refreshing ? 'ti-loader' : 'ti-refresh'}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button className="btn pri sm" onClick={() => onNavigate('upload')}>
              <i className="ti ti-upload" /> Upload grades
            </button>
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Student ID</th><th>Name</th><th>Subject</th><th>Program</th>
                <th>Pre.</th><th>Mid.</th><th>Semi</th><th>Fin.</th><th>Status</th>
                {allowDelete && <th />}
              </tr>
            </thead>
            <tbody>
              {myS.map(s => (
                <tr key={`${s.id}-${s.subj}`}>
                  <td className="hash">{s.id}</td>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td>{s.subj}</td>
                  <td>
                    {program || s.dept ? (
                      <span className="badge info">{program || s.dept}</span>
                    ) : '—'}
                  </td>
                  <td>{s.prelim  ?? '—'}</td>
                  <td>{s.midterm ?? '—'}</td>
                  <td>{s.semi    ?? '—'}</td>
                  <td>{s.final   ?? '—'}</td>
                  <td><StatusBadge status={s.status} /></td>
                  {allowDelete && (
                    <td>
                      <button className="btn sm" onClick={() => confirmDelete(s)}>
                        <i className="ti ti-trash" /> Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`modal-bg ${showDelete ? 'open' : ''}`}>
        <div className="modal">
          <div className="modal-hdr">
            <h3>Remove student from subject</h3>
            <button className="close-btn" onClick={() => setShowDelete(false)}><i className="ti ti-x" /></button>
          </div>
          <div className="modal-meta">
            <div className="row">
              <span>Student</span>
              <span>{selectedStudent?.name || '—'}</span>
            </div>
            <div className="row">
              <span>Subject</span>
              <span>{selectedStudent?.subj || '—'}</span>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setShowDelete(false)}>Cancel</button>
            <button className="btn pri" onClick={handleDelete}>
              Remove student
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
