import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { getDocument } from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { Notice } from '../Shared';
import { ROLES } from '../../data/appData';

function normalizeHeader(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9_]/g, '');
}

function getFieldMap(headers) {
  const map = {};
  headers.forEach((h, i) => {
    const key = normalizeHeader(h);
    if (['student_id', 'id', 'studentid', 'no', 'no_'].includes(key)) map.id = i;
    if (['name', 'student_name'].includes(key)) map.name = i;
    if (['program', 'course'].includes(key)) map.program = i;
  });
  return map;
}

function findHeaderRow(rows) {
  const limit = Math.min(rows.length, 20);
  for (let i = 0; i < limit; i += 1) {
    const map = getFieldMap(rows[i] || []);
    if (map.name !== undefined || map.id !== undefined) return { index: i, map };
  }
  return null;
}

function rowsToStudents(rows) {
  if (!rows.length) {
    return { students: [], missingIds: 0, usedFallback: false };
  }

  const headerMatch = findHeaderRow(rows);
  let headerIndex = 0;
  let map = headerMatch?.map || {};
  let usedFallback = false;

  if (headerMatch) {
    headerIndex = headerMatch.index;
  } else {
    map = { id: 0, name: 1, program: 2 };
    usedFallback = true;
  }

  const students = [];
  let missingIds = 0;

  for (let i = headerIndex + 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const name = row[map.name];
    if (!name) continue;
    const rawId = row[map.id];
    if (!rawId) missingIds += 1;
    students.push({
      id: rawId ? String(rawId).trim() : '',
      name: String(name).trim(),
      program: row[map.program] ? String(row[map.program]).trim() : '',
    });
  }

  return { students, missingIds, usedFallback };
}

async function parseSpreadsheet(file, type) {
  if (type === 'csv') {
    const text = await file.text();
    const workbook = XLSX.read(text, { type: 'string' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
  }
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
}

function parseTextTable(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  return lines.map(line => line.split(/\t|\s{2,}|,/).map(cell => cell.trim()));
}

async function parseDocx(file) {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return parseTextTable(result.value || '');
}

async function parsePdf(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: buffer }).promise;
  const lines = [];
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    lines.push(pageText);
  }
  return parseTextTable(lines.join('\n'));
}

async function parseImageOcr(file) {
  const result = await Tesseract.recognize(file, 'eng');
  const text = result?.data?.text || '';
  const confidence = result?.data?.confidence ?? null;
  return { rows: parseTextTable(text), confidence };
}

export default function EnrollStudent({ curRole, onEnroll, subjects = [], curriculumSubjects = [], initialSubject = '', program = '', onEnrollmentLogged }) {
  const rd = ROLES[curRole];
  const programOptions = ['BSCpE', 'BSCE', 'BSGE'];
  const studentIdPattern = /^\d{2}-\d{5}$/;
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadNotice, setUploadNotice] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('Upload student list (CSV/XLSX, PDF, DOCX, OCR)');
  const [uploadSub, setUploadSub] = useState('OCR/PDF/Word supported · CSV/XLSX recommended');
  const [stagedStudents, setStagedStudents] = useState([]);
  const [missingIds, setMissingIds] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [enrollNotice, setEnrollNotice] = useState(null);
  const [manualStudent, setManualStudent] = useState({ id: '', name: '', program: '' });

  const inferredProgram = useMemo(() => {
    const firstProgram = stagedStudents.find(student => student.program)?.program;
    return firstProgram || program || '';
  }, [stagedStudents, program]);

  const subjectOptions = useMemo(() => {
    const excluded = new Set(['CE 401', 'ENR 310', 'GEC 4']);
    const filteredCurriculum = inferredProgram
      ? curriculumSubjects.filter(item => item.program === inferredProgram)
      : curriculumSubjects;
    
    // Return full subject objects with code + title
    return Array.from(
      new Map(
        filteredCurriculum
          .filter(item => item.code && !excluded.has(item.code))
          .map(item => [
            item.code,
            {
              code: item.code,
              title: item.title || item.code,
              fullName: `${item.code} - ${item.title || item.code}`,
            }
          ])
      ).values()
    ).sort((a, b) => a.code.localeCompare(b.code));
  }, [curriculumSubjects, inferredProgram]);

  const filteredSubjects = useMemo(() => {
    if (!subjectSearch) return subjectOptions;
    const term = subjectSearch.toLowerCase();
    return subjectOptions.filter(option => 
      option.code.toLowerCase().includes(term) || 
      option.title.toLowerCase().includes(term)
    );
  }, [subjectOptions, subjectSearch]);

  // Load staged students from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('enrollStagedStudents');
    if (saved) {
      try {
        setStagedStudents(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load staged students', e);
      }
    }
  }, []);

  // Save staged students to localStorage whenever they change
  useEffect(() => {
    if (stagedStudents.length > 0) {
      localStorage.setItem('enrollStagedStudents', JSON.stringify(stagedStudents));
    } else {
      localStorage.removeItem('enrollStagedStudents');
    }
  }, [stagedStudents]);

  useEffect(() => {
    if (initialSubject) setSelectedSubject(initialSubject);
  }, [initialSubject]);

  async function handleFile(file) {
    if (!file) return;
    
    // File size validation
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
    if (file.size > MAX_FILE_SIZE) {
      setUploadNotice({
        type: 'err',
        message: `File size exceeds 50 MB limit. Current: ${(file.size / 1024 / 1024).toFixed(2)} MB`,
      });
      setUploadStatus('idle');
      return;
    }

    setUploadStatus('loading');
    setUploadTitle(file.name);
    setUploadSub('Processing student list...');
    setUploadNotice(null);

    try {
      const ext = file.name.split('.').pop().toLowerCase();
      let rows = [];
      let confidence = null;
      if (['xlsx', 'xls', 'csv'].includes(ext)) {
        rows = await parseSpreadsheet(file, ext === 'csv' ? 'csv' : 'xlsx');
      } else if (['docx', 'doc'].includes(ext)) {
        rows = await parseDocx(file);
      } else if (ext === 'pdf') {
        rows = await parsePdf(file);
      } else if (['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff'].includes(ext)) {
        const ocrResult = await parseImageOcr(file);
        rows = ocrResult.rows;
        confidence = ocrResult.confidence;
      } else {
        throw new Error('Unsupported file type for enrollment.');
      }

      // Warn if too many rows
      if (rows.length > 5000) {
        console.warn(`Large file: ${rows.length} rows detected`);
      }

      const { students, missingIds: missing, usedFallback } = rowsToStudents(rows);
      setStagedStudents(students);
      setMissingIds(missing);
      setUploadStatus('done');
      setUploadSub(`✓ Parsed ${students.length} students`);

      const warnings = [];
      if (usedFallback) warnings.push('Header not detected; used default columns (ID, Name, Program).');
      if (missing) warnings.push(`Missing student ID in ${missing} rows.`);
      if (confidence !== null && confidence < 80) warnings.push(`Low OCR confidence (${Math.round(confidence)}%).`);
      if (students.length > 5000) warnings.push(`⚠️ Large file detected (${students.length} students). Processing may take a moment.`);

      setUploadNotice({ type: warnings.length ? 'warn' : 'suc', message: warnings.length ? warnings.join(' ') : 'Student list parsed successfully.' });
    } catch (err) {
      setUploadStatus('idle');
      setUploadSub('OCR/PDF/Word supported · CSV/XLSX recommended');
      setUploadNotice({ type: 'err', message: err.message || 'Parsing failed.' });
      setStagedStudents([]);
      setMissingIds(0);
    }
  }

  function addManualStudent() {
    if (!manualStudent.name) return;
    if (manualStudent.id && !studentIdPattern.test(manualStudent.id)) {
      setEnrollNotice({
        type: 'warn',
        message: 'Student ID must follow the format XX-XXXXX (2 numbers + 5 digits).',
      });
      return;
    }
    setStagedStudents(prev => [...prev, { ...manualStudent }]);
    setManualStudent({ id: '', name: '', program: '' });
  }

  function removeStagedStudent(indexToRemove) {
    setStagedStudents(prev => prev.filter((_, index) => index !== indexToRemove));
  }

  function openSubjectModal() {
    if (!stagedStudents.length) return;
    setShowModal(true);
    if (!selectedSubject && subjectOptions.length) {
      setSelectedSubject(subjectOptions[0]);
    }
  }

  function confirmEnrollment() {
    if (!selectedSubject) {
      setEnrollNotice({
        type: 'warn',
        message: 'Please select a subject to enroll students.',
      });
      return;
    }
    
    // Get the full subject info
    const subjectInfo = subjectOptions.find(s => s.code === selectedSubject);
    const subject = selectedSubject || 'Unspecified';
    
    const normalized = stagedStudents.map((student, index) => {
      const id = student.id || `TEMP-${Date.now()}-${index}`;
      return {
        ...student,
        id,
        subject,
      };
    });
    const result = onEnroll({ students: normalized, subject }) || { added: 0, skipped: 0 };
    
    // Log enrollment activity for audit trail
    if (onEnrollmentLogged && result.added > 0) {
      try {
        const enrollmentLog = {
          prof: localStorage.getItem('currentUserEmail') || 'Unknown',
          user: localStorage.getItem('currentUserEmail') || 'Unknown',
          userAgent: navigator.userAgent,
          action: 'Enrollment',
          time: new Date().toISOString(),
          desc: `${result.added} student(s) enrolled in ${subjectInfo?.fullName || subject}`,
          ipAddress: 'IP detection in audit trail',
          device: 'Browser Session',
        };
        onEnrollmentLogged(enrollmentLog);
      } catch (e) {
        console.error('Failed to log enrollment activity:', e);
      }
    }
    
    if (result.skipped > 0) {
      setEnrollNotice({
        type: 'warn',
        message: `${result.skipped} duplicate student(s) were skipped for this subject.`,
      });
    } else {
      setEnrollNotice({ type: 'suc', message: `${result.added} student(s) enrolled in ${subjectInfo?.fullName || subject}.` });
    }
    setShowModal(false);
    setStagedStudents([]);
    localStorage.removeItem('enrollStagedStudents');
    setMissingIds(0);
    setSelectedSubject('');
  }

  return (
    <>
      <div className="ph">
        <h2>Enroll a student</h2>
        <p>{rd.name} · Upload a student list or add students manually</p>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="ch"><span className="ct"><i className="ti ti-file-import" /> Upload student list</span></div>
          <div className="uz" onClick={() => document.getElementById('enroll-upload-input').click()}>
            <input
              id="enroll-upload-input"
              type="file"
              accept="image/*,.pdf,.docx,.doc,.xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}
            />
            <i className={`ti ${uploadStatus === 'done' ? 'ti-circle-check' : uploadStatus === 'loading' ? 'ti-loader' : 'ti-file-upload'}`} />
            <div className="ut">{uploadTitle}</div>
            <div className="us">{uploadSub}</div>
          </div>
          {uploadNotice && (
            <Notice type={uploadNotice.type} icon={uploadNotice.type === 'err' ? 'ti-alert-circle' : 'ti-info-circle'}>
              {uploadNotice.message}
            </Notice>
          )}
          <Notice type="info" icon="ti-info-circle">
            OCR detects student names and counts. CSV/XLSX is most accurate.
          </Notice>
        </div>

        <div className="card">
          <div className="ch"><span className="ct"><i className="ti ti-user-plus" /> Add student manually</span></div>
          <div className="form-grid">
            <div className="fg">
              <label>Student ID</label>
              <input
                value={manualStudent.id}
                onChange={e => setManualStudent(prev => ({ ...prev, id: e.target.value }))}
                placeholder="12-34567"
                pattern="\d{2}-\d{5}"
                title="Use format XX-XXXXX (2 numbers + 5 digits)."
              />
            </div>
            <div className="fg">
              <label>Student Name</label>
              <input
                value={manualStudent.name}
                onChange={e => setManualStudent(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Juan Dela Cruz"
              />
            </div>
            <div className="fg">
              <label>Program</label>
              <select
                value={manualStudent.program}
                onChange={e => setManualStudent(prev => ({ ...prev, program: e.target.value }))}
              >
                <option value="">Select program</option>
                {programOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn pri sm" onClick={addManualStudent}>
            <i className="ti ti-plus" /> Add to list
          </button>
        </div>
      </div>

      <div className="card">
        <div className="ch">
          <span className="ct">Staged students ({stagedStudents.length})</span>
          <button className="btn suc sm" onClick={openSubjectModal} disabled={!stagedStudents.length}>
            <i className="ti ti-check" /> Enroll students
          </button>
        </div>
        {enrollNotice && (
          <Notice type={enrollNotice.type} icon={enrollNotice.type === 'warn' ? 'ti-alert-triangle' : 'ti-check'}>
            {enrollNotice.message}
          </Notice>
        )}
        {stagedStudents.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-user-plus" />
            Upload or add students to start enrollment.
          </div>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Program</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stagedStudents.map((student, index) => (
                  <tr key={`${student.id || student.name}-${index}`}>
                    <td className="hash">{student.id || '—'}</td>
                    <td style={{ fontWeight: 500 }}>{student.name}</td>
                    <td>{student.program || '—'}</td>
                    <td>
                      <button
                        className="btn sm"
                        type="button"
                        onClick={() => removeStagedStudent(index)}
                        title="Remove student"
                      >
                        <i className="ti ti-trash" /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {missingIds > 0 && (
          <Notice type="warn" icon="ti-alert-triangle">
            {missingIds} students are missing IDs. IDs will be auto-generated if you proceed.
          </Notice>
        )}
      </div>

      <div className={`modal-bg ${showModal ? 'open' : ''}`}>
        <div className="modal">
          <div className="modal-hdr">
            <h3>Select subject</h3>
            <button className="close-btn" onClick={() => setShowModal(false)}><i className="ti ti-x" /></button>
          </div>
          <div className="modal-meta">
            <div className="row">
              <span>Students ready to enroll</span>
              <span>{stagedStudents.length}</span>
            </div>
            <div className="row">
              <span>Missing IDs</span>
              <span>{missingIds}</span>
            </div>
          </div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            {subjectOptions.length ? (
              <div className="fg">
                <label>Subject</label>
                <input
                  value={subjectSearch}
                  onChange={e => setSubjectSearch(e.target.value)}
                  placeholder="Search subject code or name"
                  style={{ marginBottom: 8 }}
                />
                <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                  <option value="">-- Select Subject --</option>
                  {filteredSubjects.length ? (
                    filteredSubjects.map(subject => (
                      <option key={subject.code} value={subject.code}>
                        {subject.fullName}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No matching subjects</option>
                  )}
                </select>
              </div>
            ) : (
              <div className="fg">
                <label>Subject</label>
                <Notice type="warn" icon="ti-alert-triangle">
                  No subjects found for {inferredProgram || 'selected program'}. Please create subjects first or change student program.
                </Notice>
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn pri" onClick={confirmEnrollment} disabled={!subjectOptions.length}>
              Confirm enrollment
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
