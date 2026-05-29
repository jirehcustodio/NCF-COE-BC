import React, { useMemo, useState } from 'react';
import { Notice } from '../Shared';
import CustomModal from '../CustomModal';

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
  onUpdateInstructorRole,
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleModalInstructor, setRoleModalInstructor] = useState(null);
  const [selectedRoleForChange, setSelectedRoleForChange] = useState('instructor');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetInstructor, setResetInstructor] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);
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

  const programOptions = useMemo(() => ['BSCE', 'BSCpE', 'BSGE'], []);

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
      setFormMessage('Please provide name, email, and a password.');
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
    // Show success modal
    setShowSuccessModal(true);
    // Clear form
    setFormEmail('');
    setFormPassword('');
    setFormName('');
    setFormProgram('');
    setFormRole('instructor');
    setFormStatus('Active');
    setFormMessage('');
  }

  async function handleUpdateRole(row) {
    if (!onUpdateInstructorRole) return;
    setRoleModalInstructor(row);
    setSelectedRoleForChange(row?.role || 'instructor');
    setShowRoleModal(true);
  }

  async function confirmRoleChange() {
    if (!onUpdateInstructorRole || !roleModalInstructor) return;
    const normalized = selectedRoleForChange.trim().toLowerCase();
    if (!['admin', 'dean', 'instructor'].includes(normalized)) {
      setFormMessage('Invalid role. Use admin, dean, or instructor.');
      return;
    }
    const result = await onUpdateInstructorRole({ email: roleModalInstructor.id, role: normalized });
    if (result?.error) {
      setFormMessage(result.error);
    } else {
      setShowRoleModal(false);
      setFormMessage(`Role updated to ${normalized}.`);
      setRoleModalInstructor(null);
    }
  }

  async function handleResetPassword(instructor) {
    setResetInstructor(instructor);
    setShowResetModal(true);
  }

  async function confirmResetPassword() {
    if (!onResetInstructorPassword || !resetInstructor) return;
    setResetLoading(true);
    try {
      const result = await onResetInstructorPassword(resetInstructor.id);
      if (result?.error) {
        setFormMessage(result.error);
      } else {
        setFormMessage(`Password reset email sent to ${resetInstructor.id}`);
        setShowResetModal(false);
        setResetInstructor(null);
      }
    } catch (err) {
      setFormMessage('Error sending reset email. Please try again.');
      console.error('Reset password error:', err);
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <>
      <div className="ph">
        <h2>Faculty accounts</h2>
        <p>Registered faculty with system access — Admin & Dean</p>
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
                 <label>Password</label>
                  <input type="password" value={formPassword} onChange={event => setFormPassword(event.target.value)} placeholder="Password" />
            </div>
            <div className="fg">
              <label>Full name</label>
              <input value={formName} onChange={event => setFormName(event.target.value)} placeholder="Instructor name" />
            </div>
            <div className="fg">
              <label>Program/Department</label>
              <select value={formProgram} onChange={event => setFormProgram(event.target.value)}>
                <option value="">Select program</option>
                {programOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
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
                          onClick={() => handleResetPassword(r)}
                        >
                          <i className="ti ti-mail" /> Reset password
                        </button>
                      )}
                      {allowCreate && (
                        <button className="btn sm" onClick={() => handleUpdateRole(r)}>
                          <i className="ti ti-shield-check" /> Set role
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

      {/* Success Modal */}
      <CustomModal
        isOpen={showSuccessModal}
        title="✓ Account Created"
        icon="ti-check-circle"
        size="small"
        actions={[
          {
            label: 'Close',
            onClick: () => setShowSuccessModal(false),
            variant: 'primary',
          },
        ]}
        onClose={() => setShowSuccessModal(false)}
      >
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
          <p>Faculty account has been created successfully via Postgres.</p>
          <p><strong>Email:</strong> {formEmail || '—'}</p>
          <p><strong>Role:</strong> {formRole}</p>
          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-3)' }}>
            The user can now sign in with their email and password.
          </p>
        </div>
      </CustomModal>

      {/* Role Change Modal */}
      <CustomModal
        isOpen={showRoleModal}
        title="Change User Role"
        icon="ti-user-shield"
        size="small"
        actions={[
          {
            label: 'Cancel',
            onClick: () => setShowRoleModal(false),
            variant: 'secondary',
          },
          {
            label: 'Update Role',
            onClick: confirmRoleChange,
            variant: 'primary',
          },
        ]}
        onClose={() => setShowRoleModal(false)}
      >
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
          <p style={{ marginBottom: 12 }}>
            <strong>User:</strong> {roleModalInstructor?.name || roleModalInstructor?.email || '—'}
          </p>
          <div className="fg" style={{ marginBottom: 0 }}>
            <label>Select new role</label>
            <select
              value={selectedRoleForChange}
              onChange={event => setSelectedRoleForChange(event.target.value)}
              style={{ width: '100%' }}
            >
              <option value="instructor">Instructor</option>
              <option value="dean">Dean</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {formMessage && (
            <p style={{ marginTop: 12, fontSize: 12, color: 'var(--red)', fontWeight: 500 }}>
              ⚠ {formMessage}
            </p>
          )}
        </div>
      </CustomModal>

      {/* Reset Password Modal */}
      <CustomModal
        isOpen={showResetModal}
        title="Reset Password"
        icon="ti-password"
        size="small"
        actions={[
          {
            label: 'Cancel',
            onClick: () => setShowResetModal(false),
            variant: 'secondary',
            disabled: resetLoading,
          },
          {
            label: resetLoading ? 'Sending...' : 'Send Reset Email',
            onClick: confirmResetPassword,
            variant: 'primary',
            disabled: resetLoading,
          },
        ]}
        onClose={() => !resetLoading && setShowResetModal(false)}
      >
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
          <p style={{ marginBottom: 12 }}>
            <strong>User:</strong> {resetInstructor?.name || resetInstructor?.email || '—'}
          </p>
          <p style={{ marginBottom: 12, fontSize: 12 }}>
            A password reset email will be sent to <strong>{resetInstructor?.id || '—'}</strong>
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '12px 0 0' }}>
            The user will receive an email with instructions to reset their password. This is wired to Supabase Auth.
          </p>
          {formMessage && (
            <p style={{ marginTop: 12, fontSize: 12, color: 'var(--red)', fontWeight: 500 }}>
              ⚠ {formMessage}
            </p>
          )}
        </div>
      </CustomModal>
    </>
  );
}
