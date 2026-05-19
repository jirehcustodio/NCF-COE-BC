import React, { useEffect, useState } from 'react';
import { Notice } from '../Shared';

export default function InstructorSettings({
  profile,
  programOptions = [],
  onSave,
  saving = false,
}) {
  const [name, setName] = useState(profile?.name || '');
  const [program, setProgram] = useState(profile?.dept || '');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    setName(profile?.name || '');
    setProgram(profile?.dept || '');
  }, [profile]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your full name.');
      return;
    }
    if (!program) {
      setError('Please select your program.');
      return;
    }
    setError('');
    if (onSave) {
      await onSave({ name: trimmedName, program });
    }
    setToast('Settings saved.');
  }

  return (
    <>
      <div className="ph">
        <h2>Instructor settings</h2>
        <p>Update your program so the dean can identify your handled subjects.</p>
      </div>

      <Notice type="info" icon="ti-id-badge">
        Your program is displayed on the dean’s faculty records and is used for program filtering.
      </Notice>

      <div className="card">
        <div className="form-grid">
          <div className="fg">
            <label>Full name</label>
            <input
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="Cecille Roja"
            />
          </div>
          <div className="fg">
            <label>Program handled</label>
            <select
              value={program}
              onChange={event => setProgram(event.target.value)}
            >
              <option value="">Select program</option>
              {programOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
        {error && <div className="landing-error" style={{ marginTop: 12 }}>{error}</div>}
        <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
          <button className="btn pri" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save settings'}
          </button>
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
