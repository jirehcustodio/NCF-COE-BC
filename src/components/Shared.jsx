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
