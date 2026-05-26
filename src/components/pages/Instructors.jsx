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
  onCreateInstructor,
  onToggleInstructorStatus,
  onResetInstructorPassword,
  allowCreate = false,
}) {
  const [query, setQuery] = useState('');
  const [program, setProgram] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formProgram, setFormProgram] = useState('');
  const [formRole, setFormRole] = useState('instructor');
  const [formPassword, setFormPassword] = useState('');
  const [formStatus, setFormStatus] = useState('Active');
  const [formMessage, setFormMessage] = useState('');
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
    const recordStatus = row.status || facultyById.get(id)?.status || 'Active';
    return {
      id,
      name,
      dept: getProgram(row) || row.dept || '—',
      uploads,
      subjects: subjectCount,
      last: lastLog?.time || '—',
      status,
      recordStatus,
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

  async function handleCreateAccount() {
    if (!onCreateInstructor) return;
    setFormMessage('');
    if (!formEmail || !formPassword || !formName) {
      setFormMessage('Please provide name, email, and a temporary password.');
      return;
    }
    const result = await onCreateInstructor({
      email: formEmail,
      password: formPassword,
      role: formRole,
      name: formName,
      program: formProgram,
      status: formStatus,
    });
    if (result?.error) {
      setFormMessage(result.error);
      return;
    }
    if (result?.warning) {
      setFormMessage(result.warning);
    } else {
      setFormMessage('Account request submitted. Ask the user to sign in and update their password.');
    }
    setFormEmail('');
    setFormPassword('');
    setFormName('');
    setFormProgram('');
    setFormRole('instructor');
    setFormStatus('Active');
  }

  return (
    <>
      <div className="ph">
        <h2>Faculty accounts</h2>
        <p>Registered faculty with system access — Admin only</p>
      </div>
      {allowCreate && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="ch"><span className="ct">Create faculty account</span></div>
          <div className="grid-two" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div className="fg">
              <label>Email</label>
              <input value={formEmail} onChange={event => setFormEmail(event.target.value)} placeholder="faculty@school.edu" />
            </div>
            <div className="fg">
              <label>Temporary password</label>
              <input type="password" value={formPassword} onChange={event => setFormPassword(event.target.value)} placeholder="Temp password" />
            </div>
            <div className="fg">
              <label>Full name</label>
              <input value={formName} onChange={event => setFormName(event.target.value)} placeholder="Instructor name" />
            </div>
            <div className="fg">
              <label>Program/Department</label>
              <input value={formProgram} onChange={event => setFormProgram(event.target.value)} placeholder="BSCE, BSCpE..." />
            </div>
            <div className="fg">
              <label>Role</label>
              <select value={formRole} onChange={event => setFormRole(event.target.value)}>
                <option value="instructor">Instructor</option>
                <option value="dean">Dean</option>
              </select>
            </div>
            <div className="fg">
              <label>Status</label>
              <select value={formStatus} onChange={event => setFormStatus(event.target.value)}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="inline-actions" style={{ marginTop: 12 }}>
            <button className="btn pri" onClick={handleCreateAccount}>
              <i className="ti ti-user-plus" /> Create account
            </button>
            {formMessage && <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{formMessage}</span>}
          </div>
          <Notice type="info" icon="ti-info-circle">
            Accounts are created via Supabase Auth. If email confirmations are enabled, the user must confirm before signing in.
          </Notice>
        </div>
      )}
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
                    {r.recordStatus === 'Inactive'
                      ? <span className="badge warn"><i className="ti ti-lock" /> Inactive</span>
                      : r.status === 'ok'
                        ? <span className="badge ok"><i className="ti ti-check" /> Active</span>
                        : <span className="badge pend"><i className="ti ti-clock" /> Pending</span>}
                  </td>
                  <td>
                    <div className="inline-actions">
                      {allowCreate && (
                        <button
                          className="btn sm"
                          onClick={() => onToggleInstructorStatus && onToggleInstructorStatus(r)}
                        >
                          <i className="ti ti-power" /> {r.recordStatus === 'Inactive' ? 'Activate' : 'Deactivate'}
                        </button>
                      )}
                      {allowCreate && (
                        <button
                          className="btn sm"
                          onClick={async () => {
                            if (!onResetInstructorPassword) return;
                            const result = await onResetInstructorPassword(r.id);
                            if (result?.error) {
                              setFormMessage(result.error);
                            } else {
                              setFormMessage('Password reset email sent.');
                            }
                          }}
                        >
                          <i className="ti ti-mail" /> Reset password
                        </button>
                      )}
                      <button className="btn sm" onClick={() => confirmDelete(r)}>
                        <i className="ti ti-trash" /> Delete
                      </button>
                    </div>
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
