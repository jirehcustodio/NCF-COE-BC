/* ============================================================
   Shared.jsx — Reusable UI components
   ============================================================ */
import React from 'react';

export function StatusBadge({ status }) {
  if (status === 'chain') return <span className="badge chain"><i className="ti ti-lock" /> On chain</span>;
  if (status === 'ok')    return <span className="badge ok"><i className="ti ti-check" /> Uploaded</span>;
  return <span className="badge pend"><i className="ti ti-clock" /> Pending</span>;
}

export function UploadMethodBadge({ method }) {
  if (!method || method === '—') return <span style={{ color: 'var(--text-3)' }}>—</span>;
  const icon = method.includes('OCR')  ? 'ti-photo'
    : method.includes('xlsx') || method.includes('Excel') ? 'ti-table'
    : method.includes('docx') || method.includes('Word')  ? 'ti-file-word'
    : method.includes('CSV')  ? 'ti-file-spreadsheet'
    : 'ti-file';
  return <span className="badge info"><i className={`ti ${icon}`} /> {method}</span>;
}

export function Notice({ type = 'info', icon, children }) {
  return (
    <div className={`notice ${type}`}>
      <i className={`ti ${icon}`} />
      <div>{children}</div>
    </div>
  );
}

export function EmptyState({ icon, children }) {
  return (
    <div className="empty-state">
      <i className={`ti ${icon}`} />
      {children}
    </div>
  );
}

export function LogEntry({ entry, showActor = false, actorName = '' }) {
  return (
    <div className="log-entry">
      <div className={`dot ${entry.dot}`} />
      <div className="lt">{entry.time}</div>
      <div className="ld">{entry.desc}</div>
      {showActor && <div className="la">{actorName}</div>}
    </div>
  );
}

export function HashDisplay({ label = 'Block Hash', value, showCopy = true }) {
  if (!value) {
    return (
      <div style={{ marginBottom: 4 }}>
        {label !== '' && <span style={{ color: 'var(--text-3)', fontSize: 11 }}>{label}: </span>}
        <span className="hash">—</span>
      </div>
    );
  }
  const short = value.length > 12 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;
  return (
    <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {label !== '' && <span style={{ color: 'var(--text-3)', fontSize: 11 }}>{label}:</span>}
      <span className="hash" title={value}>{short}</span>
      {showCopy && (
        <button
          className="btn sm"
          type="button"
          onClick={() => {
            if (navigator.clipboard?.writeText) {
              navigator.clipboard.writeText(value);
            }
          }}
        >
          <i className="ti ti-copy" /> Copy
        </button>
      )}
    </div>
  );
}

export function AccessDenied({ message = 'You do not have access to this page.' }) {
  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <div className="ch"><span className="ct">Access restricted</span></div>
      <Notice type="warn" icon="ti-lock">
        {message}
      </Notice>
    </div>
  );
}
