/* ============================================================
   MySubmissions.jsx — Instructor's own activity log
   ============================================================ */
import React from 'react';
import { Notice, LogEntry, EmptyState } from '../Shared';

export function MySubmissions({ logs, curRole }) {
  const myLogs = logs.filter(l => l.prof === curRole);
  return (
    <>
      <div className="ph">
        <h2>My submissions</h2>
        <p>Your own upload and blockchain commit history — other instructors' activity is not visible here</p>
      </div>
      <Notice type="info" icon="ti-eye-off">
        Only your own submissions appear here. Other instructors cannot see your activity.
      </Notice>
      <div className="card">
        <div className="ch"><span className="ct">My activity log ({myLogs.length} entries)</span></div>
        {myLogs.length > 0
          ? myLogs.map((l, i) => <LogEntry key={i} entry={l} />)
          : <EmptyState icon="ti-clipboard-x">No submissions yet. Upload your first grade sheet to get started.</EmptyState>
        }
      </div>
    </>
  );
}

/* ============================================================
   MyChain.jsx — Instructor's own blockchain blocks
   ============================================================ */
export function MyChain({ blocks, curRole }) {
  const myBlocks = blocks.filter(b => b.prof === curRole);
  return (
    <>
      <div className="ph">
        <h2>My chain records</h2>
        <p>Blockchain entries from your submissions only</p>
      </div>
      <Notice type="lock" icon="ti-lock">
        These records are permanently immutable. Other instructors cannot view your chain entries.
      </Notice>
      {myBlocks.length > 0 ? (
        <div className="block-chain">
          {[...myBlocks].reverse().map(b => (
            <div className="bb" key={b.num}>
              <div className="bh">
                <span className="bnum">Block #{b.num} — {b.subj} {b.period}</span>
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
      ) : (
        <EmptyState icon="ti-link-off">
          No blockchain commits yet. Upload and commit a grade sheet to create your first block.
        </EmptyState>
      )}
    </>
  );
}
