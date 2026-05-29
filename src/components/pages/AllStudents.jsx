import React, { useEffect, useMemo, useState } from 'react';
import { ROLES } from '../../data/appData';
import { Notice, StatusBadge, UploadMethodBadge } from '../Shared';

export default function AllStudents({ students, logs = [], onDeleteStudent }) {
  const [query, setQuery] = useState('');
  const [prof,  setProf]  = useState('');
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedRows, setSelectedRows] = useState({});
  const [menuState, setMenuState] = useState({ open: false, x: 0, y: 0, student: null });
  const [showInfo, setShowInfo] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const instructorOptions = useMemo(() => {
    const unique = Array.from(new Set(students.map(s => s.prof).filter(Boolean)));
    return unique.map(value => ({
      value,
      label: ROLES[value]?.name || value,
    }));
  }, [students]);

  const filtered = students.filter(s => {
    const name = (s.name || '').toLowerCase();
    const id = (s.id || '').toLowerCase();
    const matchesQuery = !query || name.includes(query.toLowerCase()) || id.includes(query.toLowerCase());
    const matchesProf = !prof || s.prof === prof;
    return matchesQuery && matchesProf;
  });

  const filteredLogs = useMemo(() => {
    if (!menuState.student) return [];
    const targetId = menuState.student.id || '';
    const targetName = (menuState.student.name || '').toLowerCase();
    return logs.filter(entry => {
      const desc = (entry.desc || '').toLowerCase();
      return (targetId && desc.includes(targetId.toLowerCase())) || (targetName && desc.includes(targetName));
    });
  }, [logs, menuState.student]);

  useEffect(() => {
    if (!menuState.open) return undefined;
    const handleClick = () => setMenuState(prev => ({ ...prev, open: false }));
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [menuState.open]);

  function handleContextMenu(event, student) {
    event.preventDefault();
    setMenuState({
      open: true,
      x: event.clientX,
      y: event.clientY,
      student,
    });
  }

  function handleDelete(student) {
    if (!onDeleteStudent) return;
    if (window.confirm(`Delete ${student.name} (${student.id}) from ${student.subj}?`)) {
      onDeleteStudent(student);
    }
  }

  function toggleSelect(student, checked) {
    const key = `${student.id}-${student.subj}`;
    setSelectedRows(prev => ({ ...prev, [key]: checked }));
    if (checked) setSelectedRow(student);
  }

  function toggleSelectAll(checked) {
    if (!checked) {
      setSelectedRows({});
      return;
    }
    const next = {};
    filtered.forEach(student => {
      next[`${student.id}-${student.subj}`] = true;
    });
    setSelectedRows(next);
  }

  function handleDeleteSelected() {
    if (!onDeleteStudent) return;
    const selected = filtered.filter(student => selectedRows[`${student.id}-${student.subj}`]);
    if (!selected.length) return;
    if (window.confirm(`Delete ${selected.length} selected student(s)?`)) {
      selected.forEach(student => onDeleteStudent(student));
      setSelectedRows({});
    }
  }

  return (
    <>
      <div className="ph">
        <h2>All student lists</h2>
        <p>All enrolled students across all instructors — Dean only</p>
      </div>
      <div className="card">
        <div className="ch">
          <span className="ct">Complete student roster ({students.length} total)</span>
        </div>
        <div className="search-row">
          <input placeholder="Search name or ID..." value={query} onChange={e => setQuery(e.target.value)} />
          <select value={prof} onChange={e => setProf(e.target.value)}>
            <option value="">All instructors</option>
            {instructorOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={filtered.length > 0 && filtered.every(student => selectedRows[`${student.id}-${student.subj}`])}
                    onChange={event => toggleSelectAll(event.target.checked)}
                  />
                </th>
                <th>Student ID</th><th>Name</th>
                <th>Subject</th><th>Instructor</th><th>Upload method</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr
                  key={`${s.id}-${s.subj}`}
                  className={selectedRow?.id === s.id && selectedRow?.subj === s.subj ? 'row-selected' : ''}
                  onContextMenu={(event) => handleContextMenu(event, s)}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={!!selectedRows[`${s.id}-${s.subj}`]}
                      onChange={event => toggleSelect(s, event.target.checked)}
                    />
                  </td>
                  <td className="hash">{s.id}</td>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td>{s.subj}</td>
                  <td style={{ fontSize: 11 }}>{ROLES[s.prof]?.name || s.prof}</td>
                  <td><UploadMethodBadge method={s.uploadMethod} /></td>
                  <td><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {menuState.open && menuState.student && (
        <div
          className="context-menu"
          style={{ top: menuState.y, left: menuState.x }}
          onClick={(event) => event.stopPropagation()}
        >
          <button type="button" onClick={() => {
            setSelectedRow(menuState.student);
            toggleSelect(menuState.student, true);
            setMenuState(prev => ({ ...prev, open: false }));
          }}>
            <i className="ti ti-check" /> Select
          </button>
          <button type="button" onClick={() => {
            toggleSelectAll(true);
            setMenuState(prev => ({ ...prev, open: false }));
          }}>
            <i className="ti ti-list-check" /> Select all
          </button>
          <button type="button" onClick={() => {
            setSelectedRows({});
            setMenuState(prev => ({ ...prev, open: false }));
          }}>
            <i className="ti ti-circle-x" /> Clear selection
          </button>
          <button type="button" onClick={() => {
            setShowInfo(true);
            setMenuState(prev => ({ ...prev, open: false }));
          }} disabled={Object.keys(selectedRows).length > 1}>
            <i className="ti ti-info-circle" /> View info
          </button>
          <button type="button" onClick={() => {
            setShowLogs(true);
            setMenuState(prev => ({ ...prev, open: false }));
          }} disabled={Object.keys(selectedRows).length > 1}>
            <i className="ti ti-clipboard-list" /> View logs
          </button>
          <button type="button" onClick={() => {
            if (Object.keys(selectedRows).length > 1) {
              handleDeleteSelected();
            } else {
              handleDelete(menuState.student);
            }
            setMenuState(prev => ({ ...prev, open: false }));
          }}>
            <i className="ti ti-trash" /> Delete student(s)
          </button>
        </div>
      )}

      <div className={`modal-bg ${showInfo ? 'open' : ''}`}>
        <div className="modal">
          <div className="modal-hdr">
            <h3>Student information</h3>
            <button className="close-btn" onClick={() => setShowInfo(false)}><i className="ti ti-x" /></button>
          </div>
          <div className="modal-meta">
            <div className="row"><span>ID</span><span>{menuState.student?.id || '—'}</span></div>
            <div className="row"><span>Name</span><span>{menuState.student?.name || '—'}</span></div>
            <div className="row"><span>Subject</span><span>{menuState.student?.subj || '—'}</span></div>
            <div className="row"><span>Program</span><span>{menuState.student?.dept || '—'}</span></div>
            <div className="row"><span>Instructor</span><span>{ROLES[menuState.student?.prof]?.name || menuState.student?.prof || '—'}</span></div>
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setShowInfo(false)}>Close</button>
          </div>
        </div>
      </div>

      <div className={`modal-bg ${showLogs ? 'open' : ''}`}>
        <div className="modal">
          <div className="modal-hdr">
            <h3>Student activity logs</h3>
            <button className="close-btn" onClick={() => setShowLogs(false)}><i className="ti ti-x" /></button>
          </div>
          {filteredLogs.length === 0 ? (
            <Notice type="info" icon="ti-info-circle">No logs recorded for this student yet.</Notice>
          ) : (
            <div className="log-list">
              {filteredLogs.map((entry, index) => (
                <div key={`${entry.time}-${index}`} className="log-entry">
                  <div className={`dot ${entry.dot}`} />
                  <div className="lt">{entry.time}</div>
                  <div className="ld">{entry.desc}</div>
                </div>
              ))}
            </div>
          )}
          <div className="modal-actions">
            <button className="btn" onClick={() => setShowLogs(false)}>Close</button>
          </div>
        </div>
      </div>
    </>
  );
}
