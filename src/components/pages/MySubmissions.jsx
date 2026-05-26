/* ============================================================
   MySubmissions.jsx — Instructor's own activity log
   ============================================================ */
import React from 'react';
import { Notice, LogEntry, EmptyState, HashDisplay } from '../Shared';

export function MySubmissions({ logs, curRole, profKey }) {
  const activeProf = profKey || curRole;
  const myLogs = logs.filter(l => l.prof === activeProf);
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
export function MyChain({ blocks, curRole, profKey }) {
  const activeProf = profKey || curRole;
  const myBlocks = blocks.filter(b => b.prof === activeProf);
  const verificationMap = React.useMemo(() => {
    const ordered = [...myBlocks].sort((a, b) => Number(a.num) - Number(b.num));
    const map = new Map();
    ordered.forEach((block, index) => {
      if (index === 0) {
        map.set(`${block.num}-${block.hash}`, true);
        return;
      }
      const prev = ordered[index - 1];
      map.set(`${block.num}-${block.hash}`, block.prev === prev.hash);
    });
    return map;
  }, [myBlocks]);
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
                <span className={`badge ${verificationMap.get(`${b.num}-${b.hash}`) ? 'ok' : 'pend'}`}>
                  <i className={`ti ${verificationMap.get(`${b.num}-${b.hash}`) ? 'ti-shield-check' : 'ti-clock'}`} />
                  {verificationMap.get(`${b.num}-${b.hash}`) ? 'Verified' : 'Pending'}
                </span>
              </div>
              <HashDisplay label="Block Hash" value={b.hash} />
              <HashDisplay label="Previous Hash" value={b.prev} />
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
