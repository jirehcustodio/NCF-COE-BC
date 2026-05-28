import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { EmptyState, Notice } from '../Shared';

export default function Curriculum({ curriculumSubjects = [], onImportCurriculum, allowImport = true }) {
  const [program, setProgram] = useState('');
  const [importRows, setImportRows] = useState([]);
  const [importStatus, setImportStatus] = useState('idle');
  const [importNotice, setImportNotice] = useState(null);
  const [importDefaults, setImportDefaults] = useState({ program: 'BSCpE', year: '', semester: '' });
  const programOptions = ['BSCE', 'BSCpE', 'BSGE'];

  const filteredCurriculum = curriculumSubjects.filter(s => !program || s.program === program);
  const previewRows = useMemo(() => importRows.slice(0, 8), [importRows]);

  function normalizeHeader(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[()]/g, '')
      .replace(/[^a-z0-9_]/g, '');
  }

  function parseCurriculumRows(rows) {
    if (!rows?.length) return [];
    const [header, ...body] = rows;
    const headers = header?.map(normalizeHeader) || [];
    const map = {
      code: headers.findIndex(h => ['course_number', 'course_code', 'code', 'subject_code'].includes(h)),
      title: headers.findIndex(h => ['course_description', 'description', 'title', 'subject_description'].includes(h)),
      units: headers.findIndex(h => ['units', 'unit'].includes(h)),
      program: headers.findIndex(h => ['program', 'course_program'].includes(h)),
      year: headers.findIndex(h => ['year', 'level'].includes(h)),
      semester: headers.findIndex(h => ['semester', 'term'].includes(h)),
    };

    const hasHeader = Object.values(map).some(idx => idx >= 0);
    const rowsToUse = hasHeader ? body : rows;

    const values = rowsToUse
      .filter(row => row && row.length)
      .map((row) => {
        const getValue = (idx, fallbackIdx) => {
          if (idx >= 0) return row[idx];
          if (fallbackIdx >= 0) return row[fallbackIdx];
          return null;
        };

        const code = hasHeader ? getValue(map.code, -1) : row[0];
        const title = hasHeader ? getValue(map.title, -1) : row[1];
        const units = hasHeader ? getValue(map.units, -1) : row[2];
        const programValue = hasHeader ? getValue(map.program, -1) : row[3];
        const yearValue = hasHeader ? getValue(map.year, -1) : row[4];
        const semesterValue = hasHeader ? getValue(map.semester, -1) : row[5];

        return {
          code: code ? String(code).trim() : '',
          title: title ? String(title).trim() : '',
          units: units === '' || units === null || units === undefined ? null : Number(units),
          program: programValue ? String(programValue).trim() : '',
          year: yearValue ? String(yearValue).trim() : '',
          semester: semesterValue ? String(semesterValue).trim() : '',
        };
      })
      .filter(row => row.code || row.title);

    const deduped = new Map();
    values.forEach(row => {
      if (!row.code) return;
      deduped.set(row.code, {
        ...row,
        program: row.program || importDefaults.program,
        year: row.year || importDefaults.year,
        semester: row.semester || importDefaults.semester,
      });
    });

    return Array.from(deduped.values());
  }

  async function handleImportFile(file) {
    if (!file) return;
    setImportStatus('loading');
    setImportNotice(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
      const parsed = parseCurriculumRows(rows);
      if (!parsed.length) {
        setImportRows([]);
        setImportNotice({ type: 'warn', message: 'No curriculum rows detected in this file.' });
      } else {
        setImportRows(parsed);
        setImportNotice({ type: 'suc', message: `Parsed ${parsed.length} curriculum rows.` });
      }
    } catch (error) {
      setImportRows([]);
      setImportNotice({ type: 'err', message: error.message || 'Failed to parse file.' });
    } finally {
      setImportStatus('idle');
    }
  }

  async function handleImportSubmit() {
    if (!onImportCurriculum) return;
    setImportStatus('saving');
    const result = await onImportCurriculum(importRows);
    setImportStatus('idle');
    setImportNotice({ type: 'suc', message: `Saved ${result?.added || importRows.length} curriculum rows.` });
    setImportRows([]);
  }

  return (
    <>
      <div className="ph">
        <h2>Curriculum</h2>
        <p>View the curriculum catalog (requisite and prerequisite subjects).</p>
      </div>

      {allowImport && (
        <div className="card">
        <div className="ch">
          <span className="ct">Curriculum / subjects</span>
          <select value={program} onChange={event => setProgram(event.target.value)}>
            <option value="">All programs</option>
            {programOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        {filteredCurriculum.length === 0 ? (
          <EmptyState icon="ti-book">No curriculum data found.</EmptyState>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Title</th>
                  <th>Units</th>
                  <th>Program</th>
                  <th>Year</th>
                  <th>Semester</th>
                </tr>
              </thead>
              <tbody>
                {filteredCurriculum.map(row => (
                  <tr key={row.code}>
                    <td>{row.code}</td>
                    <td>{row.title}</td>
                    <td>{row.units}</td>
                    <td>{row.program}</td>
                    <td>{row.year}</td>
                    <td>{row.semester}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      )}

      <div className="card">
        <div className="ch">
          <span className="ct">Curriculum import</span>
          <button
            className="btn pri sm"
            onClick={() => document.getElementById('curriculum-import-input').click()}
            disabled={importStatus === 'loading' || importStatus === 'saving'}
          >
            <i className={`ti ${importStatus === 'loading' ? 'ti-loader' : 'ti-file-upload'}`} />
            {importStatus === 'loading' ? 'Parsing...' : 'Upload CSV/XLSX'}
          </button>
        </div>
        <input
          id="curriculum-import-input"
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
          onChange={event => handleImportFile(event.target.files?.[0])}
        />
        <div className="form-grid">
          <div className="fg">
            <label>Default program</label>
            <select
              value={importDefaults.program}
              onChange={event => setImportDefaults(prev => ({ ...prev, program: event.target.value }))}
            >
              <option value="">Select program</option>
              {programOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="fg">
            <label>Default year</label>
            <select
              value={importDefaults.year}
              onChange={event => setImportDefaults(prev => ({ ...prev, year: event.target.value }))}
            >
              <option value="">Select year</option>
              <option value="1st">1st</option>
              <option value="2nd">2nd</option>
              <option value="3rd">3rd</option>
              <option value="4th">4th</option>
            </select>
          </div>
          <div className="fg">
            <label>Default semester</label>
            <select
              value={importDefaults.semester}
              onChange={event => setImportDefaults(prev => ({ ...prev, semester: event.target.value }))}
            >
              <option value="">Select semester</option>
              <option value="1st">1st</option>
              <option value="2nd">2nd</option>
              <option value="Summer">Summer</option>
            </select>
          </div>
        </div>
        {importNotice && (
          <Notice type={importNotice.type} icon={importNotice.type === 'err' ? 'ti-alert-circle' : 'ti-info-circle'}>
            {importNotice.message}
          </Notice>
        )}
        {previewRows.length ? (
          <>
            <div className="tbl-wrap" style={{ marginTop: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Title</th>
                    <th>Units</th>
                    <th>Program</th>
                    <th>Year</th>
                    <th>Semester</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map(row => (
                    <tr key={row.code}>
                      <td>{row.code}</td>
                      <td>{row.title}</td>
                      <td>{row.units ?? '—'}</td>
                      <td>{row.program || importDefaults.program || '—'}</td>
                      <td>{row.year || importDefaults.year || '—'}</td>
                      <td>{row.semester || importDefaults.semester || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="inline-actions" style={{ marginTop: 12 }}>
              <span className="badge info">
                {importRows.length} rows ready to import
              </span>
              <button
                className="btn suc sm"
                onClick={handleImportSubmit}
                disabled={!importRows.length || importStatus === 'saving'}
              >
                <i className={`ti ${importStatus === 'saving' ? 'ti-loader' : 'ti-cloud-upload'}`} />
                {importStatus === 'saving' ? 'Saving...' : 'Import to database'}
              </button>
            </div>
          </>
        ) : (
          <Notice type="info" icon="ti-info-circle">
            Upload a CSV/XLSX file with columns like Course Number, Course Description, Units, Program, Year, Semester.
          </Notice>
        )}
      </div>
    </>
  );
}
