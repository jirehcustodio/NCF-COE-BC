import React, { useState } from 'react';
import { ROLES } from '../../data/appData';
import { LogEntry } from '../Shared';

export default function Submissions({ logs }) {
  const [filterProf, setFilterProf] = useState('');
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
            <option value="reyes">Engr. Reyes</option>
            <option value="lim">Engr. Lim</option>
          </select>
        </div>
        {filtered.map((l, i) => (
          <LogEntry key={i} entry={l} showActor actorName={ROLES[l.prof].name} />
        ))}
      </div>
    </>
  );
}
