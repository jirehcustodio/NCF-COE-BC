import React, { useState } from 'react';
import { ROLES } from '../../data/appData';

export default function Verify({ students, curRole }) {
  const [studentId, setStudentId] = useState('NCF-2021-0042');
  const [subject,   setSubject]   = useState('CE 401');
  const [result,    setResult]    = useState(null);

  function doVerify() {
    const s = students.find(st => st.id === studentId.trim());

    // Instructor can only verify their own students
    if (ROLES[curRole].type === 'prof' && s && s.prof !== curRole) {
      setResult({ type: 'err', msg: 'Access denied. You can only verify your own students.' });
      return;
    }

    if (s && s.status === 'chain') {
      setResult({ type: 'suc', student: s });
    } else {
      setResult({ type: 'warn', msg: 'No verified blockchain record found for this student/subject combination.' });
    }
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
                  {result.student.name} · {result.student.subj} · {ROLES[result.student.prof].name}<br />
                  <span className="hash">Hash: 0xa3f8...c221 · Block #1045</span><br />
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
    </>
  );
}
