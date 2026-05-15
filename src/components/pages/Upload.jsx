/* ============================================================
   Upload.jsx — Upload student list + grade sheet
   Detects file type and simulates parsing.

   TO ADD REAL PARSING in VS Code:
   - XLSX: npm install xlsx  → import * as XLSX from 'xlsx'
   - DOCX: npm install mammoth → import mammoth from 'mammoth'
   - CSV: built-in (FileReader + text split)
   - OCR: npm install tesseract.js → import Tesseract from 'tesseract.js'
   ============================================================ */
import React, { useState, useRef } from 'react';
import { ROLES } from '../../data/appData';
import { Notice } from '../Shared';

function getMethod(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const imgExts = ['jpg','jpeg','png','webp','bmp','tiff'];
  if (imgExts.includes(ext)) return { label: 'Photo scan (OCR)', icon: 'ti-photo' };
  const map = {
    xlsx: { label: 'Excel (.xlsx)',  icon: 'ti-table'             },
    xls:  { label: 'Excel (.xls)',   icon: 'ti-table'             },
    csv:  { label: 'CSV import',     icon: 'ti-file-spreadsheet'  },
    pdf:  { label: 'PDF extraction', icon: 'ti-file-type-pdf'     },
    docx: { label: 'Word (.docx)',   icon: 'ti-file-word'         },
    doc:  { label: 'Word (.doc)',    icon: 'ti-file-word'         },
  };
  return map[ext] || { label: 'File import', icon: 'ti-file' };
}

function UploadZone({ id, icon, title, sub, tags, onFile, status }) {
  const inputRef = useRef();
  const [drag, setDrag] = useState(false);

  function handle(file) { if (file) onFile(file); }

  return (
    <>
      <div
        className={`uz ${drag ? 'drag' : ''}`}
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
      >
        <input
          ref={inputRef} type="file" style={{ display: 'none' }}
          accept="image/*,.pdf,.docx,.doc,.xlsx,.xls,.csv"
          onChange={e => handle(e.target.files[0])}
        />
        <i className={`ti ${status === 'done' ? 'ti-circle-check' : status === 'loading' ? 'ti-loader' : icon}`}
           style={{ color: status === 'done' ? 'var(--green)' : undefined }} />
        <div className="ut">{title}</div>
        <div className="us">{sub}</div>
        <div className="file-tags">
          {tags.map(t => (
            <span className="ftag" key={t.label}><i className={`ti ${t.icon}`} /> {t.label}</span>
          ))}
        </div>
      </div>
    </>
  );
}

export default function Upload({ students, curRole, onCommit }) {
  const rd = ROLES[curRole];
  const myStudents = students.filter(s => s.prof === curRole);

  const [listStatus,  setListStatus]  = useState('idle');   // idle | loading | done
  const [gradeStatus, setGradeStatus] = useState('idle');
  const [listNotice,  setListNotice]  = useState(null);
  const [gradeNotice, setGradeNotice] = useState(null);
  const [listTitle,   setListTitle]   = useState('Click or drag to upload student list');
  const [listSub,     setListSub]     = useState('Supports: Photo (OCR) · PDF · Word (.docx) · Excel (.xlsx) · CSV');
  const [gradeTitle,  setGradeTitle]  = useState('Click or drag to upload grade sheet');
  const [gradeSub,    setGradeSub]    = useState('Photo of grade sheet · Excel · CSV · PDF');
  const [gradeValues, setGradeValues] = useState({});
  const [subject,     setSubject]     = useState(rd.subjects[0] || '');
  const [period,      setPeriod]      = useState('Final');

  const showReview = listStatus === 'done' && gradeStatus === 'done';

  function handleListFile(file) {
    const { label } = getMethod(file.name);
    setListStatus('loading');
    setListTitle(file.name);
    setListSub(`Processing via ${label}...`);
    setListNotice(null);

    // SIMULATION — replace with real parsing (SheetJS / mammoth / Tesseract)
    setTimeout(() => {
      setListStatus('done');
      setListSub(`✓ ${myStudents.length} students detected via ${label}`);
      setListNotice({ type: 'suc', label });
    }, 1100);
  }

  function handleGradeFile(file) {
    const { label } = getMethod(file.name);
    setGradeStatus('loading');
    setGradeTitle(file.name);
    setGradeSub(`Processing via ${label}...`);
    setGradeNotice(null);

    // SIMULATION — replace with real parsing
    setTimeout(() => {
      setGradeStatus('done');
      setGradeSub(`✓ Grade data extracted via ${label}`);
      setGradeNotice({ type: 'suc', label });
      // Pre-fill grade values from student data
      const init = {};
      myStudents.forEach(s => {
        init[s.id] = { prelim: s.prelim, midterm: s.midterm, semi: s.semi, final: s.final };
      });
      setGradeValues(init);
    }, 1200);
  }

  function handleGradeChange(id, field, val) {
    setGradeValues(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  }

  function commit() {
    onCommit({ subject, period, gradeValues });
  }

  const FILE_TAGS_LIST = [
    { label: 'JPG/PNG (OCR)', icon: 'ti-photo' },
    { label: 'PDF',           icon: 'ti-file-type-pdf' },
    { label: 'DOCX/DOC',     icon: 'ti-file-word' },
    { label: 'XLSX/XLS',     icon: 'ti-table' },
    { label: 'CSV',           icon: 'ti-file-spreadsheet' },
  ];
  const FILE_TAGS_GRADE = [
    { label: 'Photo (OCR)', icon: 'ti-photo' },
    { label: 'XLSX/CSV',    icon: 'ti-table' },
    { label: 'PDF',         icon: 'ti-file-type-pdf' },
  ];

  return (
    <>
      <div className="ph">
        <h2>Upload grades</h2>
        <p>{rd.name} · Upload student list and grade sheet — your data is private from other instructors</p>
      </div>

      <div className="step-row">
        {/* Left column: Step 1 + Step 2 */}
        <div>
          {/* Step 1 — Student list */}
          <div className="card">
            <div className="ch"><span className="ct"><i className="ti ti-list-numbers" /> Step 1 — Upload student list</span></div>
            <div className="form-grid">
              <div className="fg">
                <label>Subject</label>
                <select value={subject} onChange={e => setSubject(e.target.value)}>
                  {rd.subjects.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="fg">
                <label>Grade period</label>
                <select value={period} onChange={e => setPeriod(e.target.value)}>
                  <option>Prelim</option><option>Midterm</option>
                  <option>Semi-Final</option><option>Final</option>
                </select>
              </div>
            </div>
            <UploadZone
              icon="ti-file-import"
              title={listTitle} sub={listSub}
              tags={FILE_TAGS_LIST}
              onFile={handleListFile}
              status={listStatus}
            />
            {listNotice && (
              <Notice type={listNotice.type} icon="ti-check">
                Student list imported via <strong>{listNotice.label}</strong>.&nbsp;
                {myStudents.length} entries ready.
              </Notice>
            )}
          </div>

          {/* Step 2 — Grade sheet */}
          <div className="card">
            <div className="ch"><span className="ct"><i className="ti ti-table-import" /> Step 2 — Upload grade sheet</span></div>
            <UploadZone
              icon="ti-photo-scan"
              title={gradeTitle} sub={gradeSub}
              tags={FILE_TAGS_GRADE}
              onFile={handleGradeFile}
              status={gradeStatus}
            />
            {gradeNotice && (
              <Notice type={gradeNotice.type} icon="ti-check">
                Grade sheet processed via <strong>{gradeNotice.label}</strong>.
                Values pre-filled — review before committing.
              </Notice>
            )}
          </div>
        </div>

        {/* Right column: Step 3 — Review */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="ch">
            <span className="ct"><i className="ti ti-link" /> Step 3 — Review &amp; commit to blockchain</span>
            {showReview && (
              <button className="btn suc" onClick={commit}>
                <i className="ti ti-lock" /> Commit to blockchain
              </button>
            )}
          </div>
          <Notice type="lock" icon="ti-info-circle">
            Review carefully. Once committed, grades <strong>cannot be changed or deleted</strong>.
          </Notice>

          {!showReview ? (
            <div className="empty-state">
              <i className="ti ti-scan" />
              Upload a student list and grade sheet to preview entries.
            </div>
          ) : (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student ID</th><th>Name</th>
                    <th>Prelim</th><th>Midterm</th><th>Semi-Final</th><th>Final</th>
                  </tr>
                </thead>
                <tbody>
                  {myStudents.map(s => (
                    <tr key={s.id}>
                      <td className="hash">{s.id}</td>
                      <td style={{ fontWeight: 500 }}>{s.name}</td>
                      {['prelim','midterm','semi','final'].map(f => (
                        <td key={f}>
                          <input
                            type="number" min="0" max="100"
                            className="grade-input"
                            value={gradeValues[s.id]?.[f] ?? ''}
                            onChange={e => handleGradeChange(s.id, f, e.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
