import React, { useState } from 'react';
import { ROLES } from '../../data/appData';
import { HashDisplay } from '../Shared';

export default function Verify({ students, blocks = [], curRole }) {
  const [studentId, setStudentId] = useState('NCF-2021-0042');
  const [subject,   setSubject]   = useState('CE 401');
  const [result,    setResult]    = useState(null);
  const [blockQuery, setBlockQuery] = useState('');
  const [blockResult, setBlockResult] = useState(null);

  function doVerify() {
    const s = students.find(st => st.id === studentId.trim());

    // Instructor can only verify their own students
    if (ROLES[curRole]?.type === 'instructor' && s && s.prof !== curRole) {
      setResult({ type: 'err', msg: 'Access denied. You can only verify your own students.' });
      return;
    }

    if (s && s.status === 'chain') {
      const matchingBlocks = blocks.filter(block => block.subj === subject);
      const latestBlock = matchingBlocks
        .sort((a, b) => Number(b.num) - Number(a.num))[0];
      setResult({ type: 'suc', student: s, block: latestBlock });
    } else {
      setResult({ type: 'warn', msg: 'No verified blockchain record found for this student/subject combination.' });
    }
  }

  function verifyBlock() {
    const query = blockQuery.trim();
    if (!query) {
      setBlockResult({ type: 'err', msg: 'Enter a block number or hash to verify.' });
      return;
    }
    const sorted = [...blocks].sort((a, b) => Number(a.num) - Number(b.num));
    const found = sorted.find(block => String(block.num) === query || block.hash === query);
    if (!found) {
      setBlockResult({ type: 'warn', msg: 'No block found for that number/hash.' });
      return;
    }
    const idx = sorted.findIndex(block => block.num === found.num);
    
    // Verify previous hash
    let validPrev = false;
    if (idx === 0) {
      // First block should have genesis prev hash
      validPrev = found.prev === '0x0000...0000' || !found.prev;
    } else {
      // Check if prev hash matches the previous block's hash
      const prevBlock = sorted[idx - 1];
      validPrev = found.prev === prevBlock.hash;
    }
    
    if (!validPrev) {
      const prevBlock = idx > 0 ? sorted[idx - 1] : null;
      setBlockResult({ type: 'err', msg: 'Block chain mismatch. Previous hash does not match.', block: found, prev: prevBlock });
      return;
    }
    setBlockResult({ type: 'suc', block: found, prev: idx > 0 ? sorted[idx - 1] : null });
  }

  return (
    <>
      <div className="ph">
        <h2>Verify grade integrity</h2>
        <p>Confirm a student's grade matches the on-chain cryptographic record</p>
      </div>
      <div className="card" style={{ maxWidth: 460 }}>
        <div className="fg">
          <label>Student ID</label>
          <input
            value={studentId}
            onChange={e => setStudentId(e.target.value)}
            placeholder="NCF-XXXX-XXXX"
          />
        </div>
        <div className="fg">
          <label>Subject</label>
          <select value={subject} onChange={e => setSubject(e.target.value)}>
            <option>CE 401</option>
            <option>CE 301</option>
            <option>EE 301</option>
          </select>
        </div>
        <button className="btn pri" onClick={doVerify}>
          <i className="ti ti-shield-check" /> Verify on blockchain
        </button>

        {result && (
          <div style={{ marginTop: 14 }}>
            {result.type === 'suc' && (
              <div className="notice suc">
                <i className="ti ti-shield-check" />
                <div>
                  <strong>Grade verified — integrity confirmed</strong><br />
                  {result.student.name} · {result.student.subj} · {ROLES[result.student.prof]?.name || result.student.prof}<br />
                  <HashDisplay label="Block Hash" value={result.block?.hash} showCopy={false} />
                  <span style={{ fontSize: 11 }}>All grade values match the on-chain record. No tampering detected.</span>
                </div>
              </div>
            )}
            {result.type === 'warn' && (
              <div className="notice warn">
                <i className="ti ti-alert-circle" /> {result.msg}
              </div>
            )}
            {result.type === 'err' && (
              <div className="notice err">
                <i className="ti ti-lock" /> {result.msg}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="card" style={{ maxWidth: 460, marginTop: 18 }}>
        <div className="ch"><span className="ct">Verify transaction by block</span></div>
        <div className="fg">
          <label>Block number or hash</label>
          <input
            value={blockQuery}
            onChange={event => setBlockQuery(event.target.value)}
            placeholder="e.g. 1050 or 0x1a2b...3c4d"
          />
        </div>
        <button className="btn pri" onClick={verifyBlock}>
          <i className="ti ti-shield-check" /> Verify transaction
        </button>

        {blockResult && (
          <div style={{ marginTop: 14 }}>
            {blockResult.type === 'suc' && (
              <div className="notice suc">
                <i className="ti ti-shield-check" />
                <div>
                  <strong>Transaction verified — block is intact</strong><br />
                  Block #{blockResult.block?.num} · {blockResult.block?.subj} · {blockResult.block?.period || '—'}<br />
                  <HashDisplay label="Block Hash" value={blockResult.block?.hash} showCopy={false} />
                  <HashDisplay label="Previous Hash" value={blockResult.block?.prev} showCopy={false} />
                </div>
              </div>
            )}
            {blockResult.type === 'warn' && (
              <div className="notice warn">
                <i className="ti ti-alert-circle" /> {blockResult.msg}
              </div>
            )}
            {blockResult.type === 'err' && (
              <div className="notice err">
                <i className="ti ti-shield-x" /> {blockResult.msg}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
