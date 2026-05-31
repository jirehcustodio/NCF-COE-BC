import React, { useMemo } from 'react';
import { ROLES } from '../../data/appData';
import { HashDisplay, Notice } from '../Shared';

export default function Ledger({ blocks }) {
  const verificationMap = useMemo(() => {
    const map = new Map();
    
    if (!blocks || blocks.length === 0) return map;
    
    // Sort blocks by number to maintain chain order
    const sorted = [...blocks].sort((a, b) => Number(a.num) - Number(b.num));
    
    sorted.forEach((block, index) => {
      let verified = false;
      
      if (index === 0) {
        // First block should have prev as genesis hash
        verified = block.prev === '0x0000...0000' || !block.prev;
      } else {
        // Check if previous hash matches the actual previous block's hash
        const prevBlock = sorted[index - 1];
        verified = block.prev === prevBlock.hash;
      }
      
      map.set(`${block.num}-${block.hash}`, verified);
    });
    
    return map;
  }, [blocks]);

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
        {[...blocks].reverse().map(b => {
          const verified = verificationMap.get(`${b.num}-${b.hash}`);
          const instructorName = ROLES[b.prof]?.name || b.prof || 'Instructor';
          return (
            <div className="bb" key={b.num}>
              <div className="bh">
                <span className="bnum">Block #{b.num} — {b.subj} {b.period} · {instructorName}</span>
                <span className={`badge ${verified ? 'ok' : 'pend'}`}>
                  <i className={`ti ${verified ? 'ti-shield-check' : 'ti-clock'}`} />
                  {verified ? 'Verified' : 'Pending'}
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
          );
        })}
      </div>
    </>
  );
}
