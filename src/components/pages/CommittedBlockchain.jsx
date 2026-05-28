import React, { useMemo, useState } from 'react';
import { EmptyState, HashDisplay } from '../Shared';
import { ROLES } from '../../data/appData';

export default function CommittedBlockchain({ blocks = [], facultyRecords = [], curRole }) {
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const rd = ROLES[curRole];
  const isAdmin = rd?.type === 'admin';
  const isDean = rd?.type === 'dean';

  const instructorOptions = useMemo(() => {
    const fromBlocks = blocks.map(block => block.prof).filter(Boolean);
    const fromFaculty = facultyRecords.map(record => record.id).filter(Boolean);
    return Array.from(new Set([...fromBlocks, ...fromFaculty])).sort();
  }, [blocks, facultyRecords]);

  const rows = useMemo(() => {
    const filtered = selectedInstructor
      ? blocks.filter(block => block.prof === selectedInstructor)
      : blocks;
    return [...filtered].sort((a, b) => Number(b.num) - Number(a.num));
  }, [blocks, selectedInstructor]);

  const resolveName = (prof) => {
    if (!prof) return '—';
    const record = facultyRecords.find(item => item.id === prof);
    return record?.name || ROLES[prof]?.name || prof;
  };

  return (
    <>
      <div className="ph">
        <h2>Committed blockchain</h2>
        <p>{isDean ? 'Live record of all grade commits by instructors.' : 'System-wide blockchain grade submission audit trail.'}</p>
      </div>
      <div className="card">
        <div className="search-row">
          <select value={selectedInstructor} onChange={event => setSelectedInstructor(event.target.value)}>
            <option value="">All instructors</option>
            {instructorOptions.map(ins => (
              <option key={ins} value={ins}>{resolveName(ins)}</option>
            ))}
          </select>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon="ti-link">No blockchain commits yet.</EmptyState>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Block</th>
                  <th>Instructor</th>
                  <th>Subject</th>
                  <th>Period</th>
                  <th>Time</th>
                  <th>Hash</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((block, i) => (
                  <tr key={`${block.num}-${block.hash}-${i}`}>
                    <td style={{ fontWeight: 600 }}>#{block.num}</td>
                    <td>{resolveName(block.prof)}</td>
                    <td>{block.subj || '—'}</td>
                    <td>{block.period || '—'}</td>
                    <td style={{ fontSize: 11 }}>{block.time || '—'}</td>
                    <td>
                      <HashDisplay label="" value={block.hash} showCopy={false} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
