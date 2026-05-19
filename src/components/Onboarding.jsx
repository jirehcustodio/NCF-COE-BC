/* ============================================================
   Onboarding.jsx — Full-screen onboarding slides
   ============================================================ */
import React, { useMemo, useState } from 'react';

export default function Onboarding({
  roleType = 'instructor',
  requireProfile = false,
  programOptions = [],
  profileDefaults = { name: '', program: '' },
  profileSaving = false,
  onSaveProfile,
  onFinish,
  onSkip,
}) {
  const [step, setStep] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [profileName, setProfileName] = useState(profileDefaults.name || '');
  const [profileProgram, setProfileProgram] = useState(profileDefaults.program || '');
  const [profileError, setProfileError] = useState('');

  const slides = useMemo(() => {
    const common = [
      {
        title: 'Welcome to NCF Blockchain Grade Recording',
        body: 'We’ll show you the basics so you can upload, review, and commit grades with confidence.',
        icon: 'ti ti-stars',
      },
      {
        title: 'Upload grades in minutes',
        body: 'Use CSV/Excel for best accuracy. PDFs, Word, and photo scans are also supported with OCR.',
        icon: 'ti ti-upload',
      },
      {
        title: 'Review before you commit',
        body: 'Always verify detected grades. You can edit values before committing to the blockchain.',
        icon: 'ti ti-clipboard-check',
      },
      {
        title: 'Immutable records',
        body: 'Once committed, grades are locked and cannot be edited or removed.',
        icon: 'ti ti-lock',
      },
    ];

    if (roleType === 'dean') {
      return [
        ...common,
        {
          title: 'Dean tools at a glance',
          body: 'Track submissions, view all grades, and verify records directly from the ledger.',
          icon: 'ti ti-shield-check',
        },
      ];
    }

    return [
      ...common,
      {
        title: 'Instructor dashboard',
        body: 'See your students, upload grade sheets, and keep a clean audit trail.',
        icon: 'ti ti-user-check',
      },
    ];
  }, [roleType]);

  const current = slides[step];
  const isLast = step === slides.length - 1;
  const canSkip = !requireProfile || !showProfile;

  return (
    <div className="onboard">
      <div className="onboard-card">
        <div className="onboard-progress">
          {slides.map((_, index) => (
            <span
              key={`dot-${index}`}
              className={`onboard-dot ${index === step ? 'active' : ''}`}
            />
          ))}
        </div>
        {showProfile ? (
          <>
            <div className="onboard-icon"><i className="ti ti-id" /></div>
            <h2>Instructor profile</h2>
            <p>Tell us which program you handle so the dean can recognize your subject list.</p>
            <div className="form-grid" style={{ marginTop: 18 }}>
              <div className="fg">
                <label>Full name</label>
                <input
                  value={profileName}
                  placeholder="Cecille Roja"
                  onChange={event => setProfileName(event.target.value)}
                />
              </div>
              <div className="fg">
                <label>Program handled</label>
                <select
                  value={profileProgram}
                  onChange={event => setProfileProgram(event.target.value)}
                >
                  <option value="">Select program</option>
                  {programOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            {profileError && <div className="landing-error" style={{ marginTop: 12 }}>{profileError}</div>}
          </>
        ) : (
          <>
            <div className="onboard-icon"><i className={current.icon} /></div>
            <h2>{current.title}</h2>
            <p>{current.body}</p>
          </>
        )}
        <div className="onboard-actions">
          <button
            className="btn"
            type="button"
            onClick={() => {
              if (!canSkip) return;
              if (requireProfile) {
                setShowProfile(true);
                return;
              }
              onSkip();
            }}
            disabled={!canSkip}
          >
            {requireProfile ? 'Skip intro' : 'Skip'}
          </button>
          <div className="onboard-actions-right">
            {!showProfile && step > 0 && (
              <button
                className="btn"
                type="button"
                onClick={() => setStep(prev => Math.max(prev - 1, 0))}
              >
                Back
              </button>
            )}
            <button
              className="btn pri"
              type="button"
              disabled={profileSaving}
              onClick={async () => {
                if (showProfile) {
                  const trimmedName = profileName.trim();
                  if (!trimmedName) {
                    setProfileError('Please enter your full name.');
                    return;
                  }
                  if (!profileProgram) {
                    setProfileError('Please select the program you handle.');
                    return;
                  }
                  setProfileError('');
                  if (onSaveProfile) {
                    await onSaveProfile({ name: trimmedName, program: profileProgram });
                  }
                  onFinish();
                  return;
                }
                if (isLast) {
                  if (requireProfile) {
                    setShowProfile(true);
                    return;
                  }
                  onFinish();
                } else {
                  setStep(prev => Math.min(prev + 1, slides.length - 1));
                }
              }}
            >
              {showProfile ? (profileSaving ? 'Saving...' : 'Save & finish') : (isLast ? 'Finish' : 'Next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
