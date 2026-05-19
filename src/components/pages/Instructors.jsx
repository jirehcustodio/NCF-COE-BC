import React, { useMemo, useState } from 'react';
import { Notice } from '../Shared';

export default function Instructors({
  instructors = [],
  facultyRecords = [],
  students = [],
  subjects = [],
  blocks = [],
  logs = [],
  onDeleteInstructor,
}) {
  const [query, setQuery] = useState('');
  const [program, setProgram] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const rows = instructors.length ? instructors : facultyRecords;
  const facultyById = useMemo(() => {
    const map = new Map();
    facultyRecords.forEach(record => {
      if (record.id) map.set(record.id, record);
    });
    return map;
  }, [facultyRecords]);
  const facultyByName = useMemo(() => {
    const map = new Map();
    facultyRecords.forEach(record => {
      if (record.name) map.set(record.name.toLowerCase(), record);
    });
    return map;
  }, [facultyRecords]);

  const getProgram = (row) => {
    if (row.dept) return row.dept;
    const key = row.email || row.id;
    if (key && facultyById.has(key)) return facultyById.get(key)?.dept || '';
    const byName = row.name ? facultyByName.get(row.name.toLowerCase()) : null;
    return byName?.dept || '';
  };

  const filtered = rows.filter(row => {
    if (!query) return true;
    const lower = query.toLowerCase();
    const program = getProgram(row).toLowerCase();
    const name = (row.name || '').toLowerCase();
    const id = (row.id || row.email || '').toLowerCase();
    return name.includes(lower) || id.includes(lower) || program.includes(lower);
  });

  const programs = useMemo(() => {
    const fromRows = rows.map(getProgram).filter(Boolean);
    return Array.from(new Set(fromRows)).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredByProgram = filtered.filter(row => {
    if (!program) return true;
    return getProgram(row) === program;
  });

  const instructorRows = filteredByProgram.map(row => {
    const id = row.id || row.email;
    const name = row.name || row.full_name || row.email || '—';
    const uploads = blocks.filter(block => block.prof === id).length;
    const lastLog = logs.find(log => log.prof === id);
    const subjectCount = subjects.filter(item => item.prof === id).length ||
      Array.from(new Set(students.filter(student => student.prof === id).map(student => student.subj))).length;
    const status = uploads > 0 ? 'ok' : 'pend';
    return {
      id,
      name,
      dept: getProgram(row) || row.dept || '—',
      uploads,
      subjects: subjectCount,
      last: lastLog?.time || '—',
      status,
    };
  });

  function confirmDelete(row) {
    setSelectedInstructor(row);
    setShowDelete(true);
  }

  function handleDelete() {
    if (selectedInstructor && onDeleteInstructor) {
      onDeleteInstructor(selectedInstructor);
    }
    setShowDelete(false);
    setSelectedInstructor(null);
  }

  return (
    <>
      <div className="ph">
        <h2>Instructors</h2>
        <p>Registered faculty with system access — Dean only</p>
      </div>
      <div className="card">
        <div className="search-row">
          <input
            placeholder="Search by name, email, or program..."
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
          <select value={program} onChange={event => setProgram(event.target.value)}>
            <option value="">All programs</option>
            {programs.map(item => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Program</th><th>Subjects</th>
                <th>Uploads</th><th>Last active</th><th>Status</th><th />
              </tr>
            </thead>
            <tbody>
              {instructorRows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '18px', color: 'var(--text-3)' }}>
                    No instructors yet.
                  </td>
                </tr>
              )}
              {instructorRows.map((r, i) => (
                <tr key={r.id || i}>
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
                  <td>
                    <button className="btn sm" onClick={() => confirmDelete(r)}>
                      <i className="ti ti-trash" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`modal-bg ${showDelete ? 'open' : ''}`}>
        <div className="modal">
          <div className="modal-hdr">
            <h3>Remove instructor</h3>
            <button className="close-btn" onClick={() => setShowDelete(false)}><i className="ti ti-x" /></button>
          </div>
          <div className="modal-meta">
            <div className="row">
              <span>Instructor</span>
              <span>{selectedInstructor?.name || '—'}</span>
            </div>
            <div className="row">
              <span>Program</span>
              <span>{selectedInstructor?.dept || '—'}</span>
            </div>
          </div>
          <Notice type="warn" icon="ti-alert-triangle">
            This removes the instructor profile and all linked subjects/students from the system.
          </Notice>
          <div className="modal-actions">
            <button className="btn" onClick={() => setShowDelete(false)}>Cancel</button>
            <button className="btn pri" onClick={handleDelete}>Delete instructor</button>
          </div>
        </div>
      </div>
    </>
  );
}
