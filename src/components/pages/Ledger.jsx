import React from 'react';
import { ROLES } from '../../data/appData';
import { Notice } from '../Shared';

export default function Ledger({ blocks }) {
  return (
    <>
      <div className="ph">
        <h2>Blockchain ledger</h2>
        <p>Complete immutable chain — all instructor grade submissions</p>
      </div>
      <Notice type="lock" icon="ti-lock" style={{ marginBottom: 16 }}>
        Once committed to the blockchain, no record can be altered, deleted, or reversed by anyone —
        including the Dean or system administrators. This guarantees tamper-proof academic records.
      </Notice>
      <div className="block-chain">
        {[...blocks].reverse().map(b => (
          <div className="bb" key={b.num}>
            <div className="bh">
              <span className="bnum">Block #{b.num} — {b.subj} {b.period} · {ROLES[b.prof].name}</span>
              <span className="badge chain"><i className="ti ti-lock" /> Immutable</span>
            </div>
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: 'var(--text-3)', fontSize: 11 }}>Hash: </span>
              <span className="bhash">{b.hash}</span>
            </div>
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: 'var(--text-3)', fontSize: 11 }}>Prev: </span>
              <span className="hash">{b.prev}</span>
            </div>
            <div className="block-meta">
              <div><span>Students: </span>{b.count}</div>
              <div><span>Period: </span>{b.period}</div>
              <div><span>Committed: </span>{b.time}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
