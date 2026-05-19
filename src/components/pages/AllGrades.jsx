import React, { useMemo, useState } from 'react';
import { ROLES } from '../../data/appData';
import { StatusBadge } from '../Shared';

export default function AllGrades({ students, facultyRecords = [] }) {
  const [query, setQuery]   = useState('');
  const [prof,  setProf]    = useState('');
  const [subj,  setSubj]    = useState('');
  const [stat,  setStat]    = useState('');
  const [program, setProgram] = useState('');

  const instructors = useMemo(
    () => Array.from(new Set(students.map(s => s.prof).filter(Boolean))),
    [students]
  );
  const subjects = useMemo(
    () => Array.from(new Set(students.map(s => s.subj).filter(Boolean))),
    [students]
  );
  const statuses = useMemo(
    () => Array.from(new Set(students.map(s => s.status).filter(Boolean))),
    [students]
  );
  const programs = useMemo(() => {
    const fromStudents = students.map(s => s.dept).filter(Boolean);
    const fromFaculty = facultyRecords.map(r => r.dept).filter(Boolean);
    return Array.from(new Set([...fromStudents, ...fromFaculty]));
  }, [students, facultyRecords]);

  const programByInstructor = useMemo(() => {
    const map = new Map();
    facultyRecords.forEach(record => {
      if (record.id) map.set(record.id, record.dept);
    });
    return map;
  }, [facultyRecords]);

  const filtered = students.filter(s => {
    const name = (s.name || '').toLowerCase();
    const id = (s.id || '').toLowerCase();
    const matchesQuery = !query || name.includes(query.toLowerCase()) || id.includes(query.toLowerCase());
    const matchesProf = !prof || s.prof === prof;
    const matchesSubj = !subj || s.subj === subj;
    const matchesStat = !stat || s.status === stat;
    const recordProgram = s.dept || programByInstructor.get(s.prof) || '';
    const matchesProgram = !program || recordProgram === program;
    return matchesQuery && matchesProf && matchesSubj && matchesStat && matchesProgram;
  });

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
            {instructors.map(ins => (
              <option key={ins} value={ins}>{ROLES[ins]?.name || ins}</option>
            ))}
          </select>
          <select value={program} onChange={e => setProgram(e.target.value)}>
            <option value="">All programs</option>
            {programs.map(item => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select value={subj} onChange={e => setSubj(e.target.value)}>
            <option value="">All subjects</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
          <select value={stat} onChange={e => setStat(e.target.value)}>
            <option value="">All statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Student ID</th><th>Name</th><th>Program</th>
                <th>Subject</th><th>Instructor</th>
                <th>Pre.</th><th>Mid.</th><th>Semi</th><th>Fin.</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={`${s.id}-${s.subj}`}>
                  <td className="hash">{s.id}</td>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td style={{ fontSize: 11 }}>{s.dept || programByInstructor.get(s.prof) || '—'}</td>
                  <td>{s.subj}</td>
                  <td style={{ fontSize: 11 }}>{ROLES[s.prof]?.name || s.prof || '—'}</td>
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
