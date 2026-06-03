import React, { useState, useMemo } from 'react';
import { ROLES } from '../../data/appData';
import { StatusBadge, Notice } from '../Shared';

export default function MyStudents({ students, curRole, profKey, program = '', subjects = [], curriculumSubjects = [], onNavigate, onDeleteStudent, onRefresh, refreshing = false, allowDelete = false }) {
  const activeProf = profKey || curRole;
  const myS = students.filter(s => s.prof === activeProf);
  const rd  = ROLES[curRole];
  const [showDelete, setShowDelete] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create a map of subject codes to titles
  const subjectMap = useMemo(() => {
    const map = {};
    subjects.forEach(s => {
      if (s.code) {
        map[s.code] = s.title || s.code;
      }
    });
    return map;
  }, [subjects]);

  const programMap = useMemo(() => {
    const map = {};
    curriculumSubjects.forEach(subject => {
      const code = String(subject.code || '').trim().toLowerCase();
      if (code && subject.program) {
        map[code] = subject.program;
      }
    });
    return map;
  }, [curriculumSubjects]);

  const semesterYearMap = useMemo(() => {
    const map = {};
    curriculumSubjects.forEach(subject => {
      const code = String(subject.code || '').trim().toLowerCase();
      if (code) {
        map[code] = {
          year: subject.year || '',
          semester: subject.semester || '',
        };
      }
    });
    return map;
  }, [curriculumSubjects]);

  const getProgramForSubject = (subject) => {
    const key = String(subject || '').trim().toLowerCase();
    return programMap[key] || '';
  };

  const getSemesterYearForSubject = (subject) => {
    const key = String(subject || '').trim().toLowerCase();
    return semesterYearMap[key] || { year: '', semester: '' };
  };

  const formatSemesterYear = (semesterYearInfo) => {
    const { year, semester } = semesterYearInfo;
    if (!year && !semester) return '—';
    
    // Extract year components (e.g., "2026-2027" → get first year "2026")
    const yearMatch = String(year || '').match(/^\d{4}/);
    const baseYear = yearMatch ? yearMatch[0] : year;
    
    // Parse semester to ordinal (1st, 2nd)
    const semesterOrdinal = semester === '2nd' ? '2nd' : '1st';
    
    // Create label like "1st Year, 1st Semester" or "2nd Year, 2nd Semester"
    const parts = [];
    if (baseYear) {
      // Determine year level: if starts with current year, it's 1st year; older is higher year
      const currentYear = new Date().getFullYear();
      const enrollmentYear = parseInt(baseYear, 10);
      const yearLevel = currentYear - enrollmentYear + 1;
      parts.push(`${yearLevel}${getOrdinal(yearLevel)} Year`);
    }
    if (semester) {
      parts.push(`${semesterOrdinal} Semester`);
    }
    return parts.join(', ');
  };

  function getOrdinal(num) {
    if (num % 10 === 1 && num % 100 !== 11) return 'st';
    if (num % 10 === 2 && num % 100 !== 12) return 'nd';
    if (num % 10 === 3 && num % 100 !== 13) return 'rd';
    return 'th';
  };

  // Calculate average grade and determine pass/fail
  function calculateAverage(student) {
    const grades = [student.prelim, student.midterm, student.semi, student.final]
      .map(g => (g === '' || g === undefined || g === null ? null : Number(g)))
      .filter(g => Number.isFinite(g));
    // Only show average if ALL four periods have grades
    if (grades.length !== 4) return null;
    return (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2);
  }

  function getRemarks(average) {
    if (average === null) return '—';
    const avg = parseFloat(average);
    return avg >= 75 ? 'Passed' : 'Failed';
  }

  function getAverageColor(average) {
    if (average === null) return '';
    const avg = parseFloat(average);
    return avg >= 75 ? '#22c55e' : '#ef4444'; // green for pass, red for fail
  }

  // Get unique subjects for filter
  const subjectOptions = useMemo(() => {
    const subjects = new Set(myS.map(s => s.subj).filter(Boolean));
    return Array.from(subjects).sort();
  }, [myS]);

  // Apply filters
  const filteredStudents = useMemo(() => {
    return myS.filter(s => {
      // Status filter
      if (statusFilter !== 'all') {
        const avg = calculateAverage(s);
        const remarks = getRemarks(avg);
        if (statusFilter === 'passed' && remarks !== 'Passed') return false;
        if (statusFilter === 'failed' && remarks !== 'Failed') return false;
      }
      // Subject filter
      if (subjectFilter !== 'all' && s.subj !== subjectFilter) return false;
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return s.id?.toLowerCase().includes(query) || s.name?.toLowerCase().includes(query);
      }
      return true;
    });
  }, [myS, statusFilter, subjectFilter, searchQuery]);

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
        <p>{rd.name} — only your enrolled students are visible here</p>
      </div>
      <Notice type="info" icon="ti-eye-off">
        Student records from other instructors are <strong>not visible</strong> to you.
        Only your own enrolled students appear in this system.
      </Notice>
      <div className="card">
        <div className="ch">
          <span className="ct">My students ({filteredStudents.length} of {myS.length} total)</span>
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

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px', padding: '0 0 12px 0', borderBottom: '1px solid rgba(128, 0, 32, 0.12)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)' }}>Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(128, 0, 32, 0.2)', fontSize: '13px' }}>
              <option value="all">All statuses</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)' }}>Subject</label>
            <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(128, 0, 32, 0.2)', fontSize: '13px' }}>
              <option value="all">All subjects</option>
              {subjectOptions.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)' }}>Search</label>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by ID or name"
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(128, 0, 32, 0.2)', fontSize: '13px' }}
            />
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Student ID</th><th>Name</th><th>Subject</th><th>Program</th><th>Semester</th>
                <th>Pre.</th><th>Mid.</th><th>Semi</th><th>Fin.</th><th>Average</th><th>Remarks</th><th>Status</th>
                {allowDelete && <th />}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(s => {
                const avg = calculateAverage(s);
                const remarks = getRemarks(avg);
                const avgColor = getAverageColor(avg);
                const semesterYear = getSemesterYearForSubject(s.subj);
                return (
                  <tr key={`${s.id}-${s.subj}`}>
                    <td className="hash">{s.id}</td>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td title={s.subj} style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {subjectMap[s.subj] || s.subj}
                    </td>
                    <td>
                      {getProgramForSubject(s.subj) ? (
                        <span className="badge info">{getProgramForSubject(s.subj)}</span>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: '12px', fontWeight: '500' }}>
                      {formatSemesterYear(semesterYear) && (
                        <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                          {formatSemesterYear(semesterYear)}
                        </span>
                      )}
                    </td>
                    <td>{s.prelim  ?? '—'}</td>
                    <td>{s.midterm ?? '—'}</td>
                    <td>{s.semi    ?? '—'}</td>
                    <td>{s.final   ?? '—'}</td>
                    <td style={{ fontWeight: '600', color: avgColor }}>{avg ?? '—'}</td>
                    <td style={{ fontWeight: '600', color: avgColor }}>{remarks}</td>
                    <td><StatusBadge status={s.status} /></td>
                    {allowDelete && (
                      <td>
                        <button className="btn sm" onClick={() => confirmDelete(s)}>
                          <i className="ti ti-trash" /> Remove
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
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
