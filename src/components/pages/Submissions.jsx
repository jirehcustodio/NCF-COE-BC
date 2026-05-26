import React, { useState } from 'react';
import { ROLES } from '../../data/appData';
import { LogEntry } from '../Shared';

export default function Submissions({ logs }) {
  const [filterProf, setFilterProf] = useState('');
  const instructorOptions = Array.from(new Set(logs.map(l => l.prof).filter(Boolean)));
  const filtered = logs.filter(l => !filterProf || l.prof === filterProf);

  return (
    <>
      <div className="ph">
        <h2>Submissions log</h2>
        <p>Full audit trail of all upload and grade commit activity — Dean only</p>
      </div>
      <div className="card">
        <div className="ch">
          <span className="ct">Activity log — all instructors</span>
          <select value={filterProf} onChange={e => setFilterProf(e.target.value)}>
            <option value="">All instructors</option>
            {instructorOptions.map(id => (
              <option key={id} value={id}>{ROLES[id]?.name || id}</option>
            ))}
          </select>
        </div>
        {filtered.map((l, i) => (
          <LogEntry key={i} entry={l} showActor actorName={ROLES[l.prof]?.name || l.prof || 'Instructor'} />
        ))}
      </div>
    </>
  );
}
