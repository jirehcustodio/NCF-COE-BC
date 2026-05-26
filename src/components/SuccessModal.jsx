/* ============================================================
   SuccessModal.jsx — Blockchain commit confirmation modal
   ============================================================ */
import React from 'react';
import { HashDisplay } from './Shared';

export default function SuccessModal({ data, onClose, onViewLedger }) {
  if (!data) return null;

  return (
    <div className={`modal-bg ${data ? 'open' : ''}`}>
      <div className="modal">
        <div className="modal-hdr">
          <h3>✓ Committed to Blockchain</h3>
          <button className="close-btn" onClick={onClose}><i className="ti ti-x" /></button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 14 }}>
          Grades have been cryptographically hashed and permanently written to the blockchain.
          This record is <strong style={{ color: 'var(--text)' }}>immutable and irreversible</strong>.
        </p>
        <div className="modal-meta">
          <div className="row"><span>Block #</span><span>{data.num}</span></div>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <span>Transaction Hash</span>
            <span style={{ flex: 1 }}>
              <HashDisplay label="" value={data.hash} />
            </span>
          </div>
          <div className="row"><span>Timestamp</span><span>{data.time}</span></div>
          <div className="row"><span>Subject</span><span>{data.subj} — {data.period}</span></div>
          <div className="row"><span>Students recorded</span><span>{data.count} students</span></div>
          <div className="row"><span>Submitted by</span><span>{data.by}</span></div>
        </div>
        <div className="modal-actions">
          <button className="btn pri" onClick={onViewLedger}>
            <i className="ti ti-link" /> View on Ledger
          </button>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
