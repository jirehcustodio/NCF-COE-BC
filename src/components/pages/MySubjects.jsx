import React, { useEffect, useMemo, useState } from 'react';
import { ROLES } from '../../data/appData';
import { EmptyState, Notice } from '../Shared';

export default function MySubjects({
  students,
  curRole,
  subjects = [],
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
  const [newSubject, setNewSubject] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

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
            <button className="btn pri sm" onClick={() => setShowCreate(true)}>
              <i className="ti ti-plus" /> Create subject
            </button>
          </div>
        </div>
        <Notice type="info" icon="ti-info-circle">
          You can create a subject even before enrolling students.
        </Notice>
      </div>

      {subjectCards.length === 0 ? (
        <EmptyState icon="ti-book">
          No subjects yet. Enroll students to create your subject list.
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

      {toast && (
        <div className="toast">
          <i className="ti ti-circle-check" />
          <div>{toast}</div>
        </div>
      )}
    </>
  );
}
