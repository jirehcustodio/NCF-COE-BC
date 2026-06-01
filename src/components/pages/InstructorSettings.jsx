import React, { useEffect, useState } from 'react';

export default function InstructorSettings({
  profile,
  programOptions = [],
  onSave,
  saving = false,
}) {
  const [name, setName] = useState(profile?.name || '');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    setName(profile?.name || '');
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
    setError('');
    if (onSave) {
      await onSave({ name: trimmedName });
    }
    setToast('Settings saved.');
  }

  return (
    <>
      <div className="ph">
        <h2>Instructor settings</h2>
        <p>Update your profile information.</p>
      </div>

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
