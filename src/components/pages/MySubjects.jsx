import React, { useEffect, useMemo, useState } from 'react';
import { ROLES } from '../../data/appData';
import { EmptyState, Notice } from '../Shared';

export default function MySubjects({
  students,
  curRole,
  subjects = [],
  curriculumSubjects = [],
  program,
  onUploadSubject,
  onEnrollSubject,
  onOpenSubject,
  onCreateSubject,
  onRefresh,
  refreshing = false,
}) {
  const rd = ROLES[curRole];
  const myStudents = students;
  const [showCreate, setShowCreate] = useState(false);
  const [showCurriculum, setShowCurriculum] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [toast, setToast] = useState('');
  const [curriculumProgram, setCurriculumProgram] = useState(program || '');
  const [curriculumYear, setCurriculumYear] = useState('');
  const [curriculumSearch, setCurriculumSearch] = useState('');

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (program) {
      setCurriculumProgram(program);
    }
  }, [program]);

  const subjectCards = useMemo(() => {
    const map = new Map();
    myStudents.forEach(student => {
      const subject = student.subj || 'Unassigned';
      const current = map.get(subject) || { subject, count: 0 };
      map.set(subject, { ...current, count: current.count + 1 });
    });
    subjects.forEach(subject => {
      const code = subject.code || subject.subject;
      if (!code) return;
      if (!map.has(code)) {
        map.set(code, { subject: code, count: 0 });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.subject.localeCompare(b.subject));
  }, [myStudents, subjects]);

  const curriculumPrograms = useMemo(() => {
    const detected = curriculumSubjects.map(subject => subject.program).filter(Boolean);
    const defaults = ['BSCE', 'BSEE', 'BSME', 'BSCpE'];
    return Array.from(new Set([...detected, ...defaults]));
  }, [curriculumSubjects]);

  const curriculumYears = useMemo(() => {
    const detected = curriculumSubjects.map(subject => subject.year).filter(Boolean);
    const defaults = ['1st', '2nd', '3rd', '4th'];
    return Array.from(new Set([...detected, ...defaults]));
  }, [curriculumSubjects]);

  const curriculumRows = useMemo(() => {
    const filtered = curriculumSubjects.filter(subject => !curriculumProgram || subject.program === curriculumProgram);
    const withYear = filtered.filter(subject => !curriculumYear || subject.year === curriculumYear);
    const term = curriculumSearch.trim().toLowerCase();
    const searched = term
      ? withYear.filter(subject =>
        subject.code?.toLowerCase().includes(term)
        || subject.title?.toLowerCase().includes(term)
        || subject.year?.toLowerCase().includes(term)
        || subject.semester?.toLowerCase().includes(term))
      : withYear;
    return searched.sort((a, b) => a.code.localeCompare(b.code));
  }, [curriculumSubjects, curriculumProgram, curriculumYear, curriculumSearch]);

  const existingSubjectCodes = useMemo(() => new Set(subjects.map(item => item.code || item.subject)), [subjects]);

  return (
    <>
      <div className="ph">
        <h2>My subjects</h2>
        <p>{rd.name} · Manage your subjects and enrolled students</p>
      </div>

      <div className="card">
        <div className="ch">
          <span className="ct">Subject shortcuts</span>
          <div className="inline-actions">
            <button
              className="btn sm"
              onClick={onRefresh}
              disabled={refreshing}
            >
              <i className={`ti ${refreshing ? 'ti-loader' : 'ti-refresh'}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button className="btn sm" onClick={() => setShowCurriculum(true)}>
              <i className="ti ti-book" /> Curriculum
            </button>
            <button className="btn pri sm" onClick={() => setShowCreate(true)}>
              <i className="ti ti-plus" /> Create subject
            </button>
          </div>
        </div>
        <Notice type="info" icon="ti-info-circle">
          Add subjects from your program curriculum or create one manually.
        </Notice>
      </div>

      {subjectCards.length === 0 ? (
        <EmptyState icon="ti-book">
          No subjects yet. Enroll students or add a curriculum subject to build your list.
        </EmptyState>
      ) : (
        <div className="two-col">
          {subjectCards.map(subject => (
            <div className="card" key={subject.subject}>
              <div className="ch">
                <span className="ct">{subject.subject}</span>
                <span className="badge info"><i className="ti ti-users" /> {subject.count} students</span>
              </div>
              <div className="inline-actions">
                <button
                  className="btn sm"
                  onClick={() => onOpenSubject && onOpenSubject(subject.subject)}
                >
                  <i className="ti ti-file-description" /> View detail
                </button>
                <button
                  className="btn sm"
                  onClick={() => onEnrollSubject(subject.subject)}
                >
                  <i className="ti ti-user-plus" /> Enroll student
                </button>
                <button
                  className="btn pri sm"
                  onClick={() => onUploadSubject(subject.subject)}
                >
                  <i className="ti ti-upload" /> Upload grades
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={`modal-bg ${showCreate ? 'open' : ''}`}>
        <div className="modal">
          <div className="modal-hdr">
            <h3>Create subject</h3>
            <button className="close-btn" onClick={() => setShowCreate(false)}><i className="ti ti-x" /></button>
          </div>
          <div className="form-grid">
            <div className="fg">
              <label>Subject code</label>
              <input
                value={newSubject}
                onChange={event => setNewSubject(event.target.value)}
                placeholder="CE 401"
              />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setShowCreate(false)}>Cancel</button>
            <button
              className="btn pri"
              onClick={() => {
                const trimmed = newSubject.trim();
                if (onCreateSubject && trimmed) {
                  onCreateSubject(trimmed);
                  setToast(`Subject ${trimmed} synced.`);
                }
                setNewSubject('');
                setShowCreate(false);
              }}
            >
              Create subject
            </button>
          </div>
        </div>
      </div>

      <div className={`modal-bg ${showCurriculum ? 'open' : ''}`} onClick={() => setShowCurriculum(false)}>
        <div className="modal modal-lg" onClick={event => event.stopPropagation()}>
          <div className="modal-hdr">
            <h3>Curriculum subjects</h3>
            <button className="close-btn" onClick={() => setShowCurriculum(false)}><i className="ti ti-x" /></button>
          </div>
          <div className="modal-meta">
            <div className="row">
              <span>Program</span>
              <select value={curriculumProgram} onChange={event => setCurriculumProgram(event.target.value)}>
                <option value="">All programs</option>
                {curriculumPrograms.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="row">
              <span>Year</span>
              <select value={curriculumYear} onChange={event => setCurriculumYear(event.target.value)}>
                <option value="">All years</option>
                {curriculumYears.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="row">
              <span>Search</span>
              <input
                value={curriculumSearch}
                onChange={event => setCurriculumSearch(event.target.value)}
                placeholder="Search by code, title, year, or semester"
              />
            </div>
          </div>
          {curriculumRows.length === 0 ? (
            <EmptyState icon="ti-book">No curriculum subjects found for this program.</EmptyState>
          ) : (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Title</th>
                    <th>Units</th>
                    <th>Year</th>
                    <th>Semester</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {curriculumRows.map(row => {
                    const exists = existingSubjectCodes.has(row.code);
                    return (
                      <tr key={row.code}>
                        <td>{row.code}</td>
                        <td>{row.title}</td>
                        <td>{row.units}</td>
                        <td>{row.year}</td>
                        <td>{row.semester}</td>
                        <td>
                          <button
                            className={`btn sm ${exists ? '' : 'pri'}`}
                            disabled={exists}
                            onClick={() => {
                              if (onCreateSubject) {
                                onCreateSubject(row.code);
                                setToast(`Subject ${row.code} added.`);
                              }
                            }}
                          >
                            {exists ? 'Added' : 'Add to my subjects'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="toast">
          <i className="ti ti-circle-check" />
          <div>{toast}</div>
        </div>
      )}
    </>
  );
}
