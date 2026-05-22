/* ============================================================
   Upload.jsx — Upload student list + grade sheet
   Detects file type and simulates parsing.

   TO ADD REAL PARSING in VS Code:
   - XLSX: npm install xlsx  → import * as XLSX from 'xlsx'
   - DOCX: npm install mammoth → import mammoth from 'mammoth'
   - CSV: built-in (FileReader + text split)
   - OCR: npm install tesseract.js → import Tesseract from 'tesseract.js'
   ============================================================ */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { getDocument } from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
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

const OFFICIAL_TEMPLATES = [
  {
    id: 'official-grade-sheet-project',
    name: 'Official Grading Sheet (with project)',
    headers: ['no', 'name', 'per_exam', 'class_standing', 'project', 'ave_grade', 'finals_grade', 'remarks'],
  },
  {
    id: 'official-grade-sheet-no-project',
    name: 'Official Grading Sheet (without project)',
    headers: ['no', 'name', 'per_exam', 'class_standing', 'project', 'ave_grade', 'finals_grade', 'remarks'],
  },
  {
    id: 'official-v1',
    name: 'Official Grade Sheet (v1)',
    headers: ['student_id', 'name', 'prelim', 'midterm', 'semi', 'final'],
  },
  {
    id: 'official-v2',
    name: 'Official Grade Sheet (v2)',
    headers: ['student_id', 'name', 'prelim', 'midterm', 'final'],
  },
];
const GRADE_HEADER_ALIASES = {
  prelim: ['prelim', 'pre'],
  midterm: ['midterm', 'mid'],
  semi: ['semi', 'semi-final', 'semifinal', 'semi_final'],
  final: ['final', 'fin'],
};

export default function Upload({ students, subjects = [], profKey, curRole, onCommit, onEnrollSubject, initialSubject = '' }) {
  const rd = ROLES[curRole];
  const activeProf = profKey || curRole;
  const myStudents = students.filter(s => s.prof === activeProf);

  const [gradeStatus, setGradeStatus] = useState('idle');
  const [gradeNotice, setGradeNotice] = useState(null);
  const [gradeTitle,  setGradeTitle]  = useState('Upload grade sheet (CSV/XLSX, PDF, DOCX)');
  const [gradeSub,    setGradeSub]    = useState('CSV/XLSX parsing supported · PDF/DOCX text extraction supported · OCR for photos');
  const [gradeValues, setGradeValues] = useState({});
  const [missingStudents, setMissingStudents] = useState([]);
  const [parsedCount, setParsedCount] = useState(0);
  const [ocrMeta, setOcrMeta] = useState(null);
  const [ocrPreview, setOcrPreview] = useState(null);
  const [ocrScale, setOcrScale] = useState({ x: 1, y: 1 });
  const [parseWarnings, setParseWarnings] = useState([]);
  const [detectedTemplate, setDetectedTemplate] = useState(null);
  const [subject,     setSubject]     = useState('');
  const [period,      setPeriod]      = useState('Final');
  const [showEnrollConfirm, setShowEnrollConfirm] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState('');

  const showReview = gradeStatus === 'done';

  const subjectOptions = useMemo(() => {
    const fromStudents = myStudents.map(s => s.subj).filter(Boolean);
    const fromSubjects = (subjects || []).map(s => (typeof s === 'string' ? s : s.code)).filter(Boolean);
    const merged = Array.from(new Set([...fromSubjects, ...fromStudents, initialSubject].filter(Boolean)));
    return merged.length ? merged : rd.subjects;
  }, [myStudents, subjects, rd.subjects, initialSubject]);

  const filteredSubjects = useMemo(() => {
    if (!subjectSearch) return subjectOptions;
    const term = subjectSearch.toLowerCase();
    return subjectOptions.filter(option => option.toLowerCase().includes(term));
  }, [subjectOptions, subjectSearch]);

  useEffect(() => {
    if (initialSubject) setSubject(initialSubject);
  }, [initialSubject]);

  useEffect(() => {
    if (!subjectOptions.length) return;
    if (!subject || !subjectOptions.includes(subject)) {
      setSubject(subjectOptions[0]);
    }
  }, [subjectOptions, subject]);

  useEffect(() => {
    if (!ocrPreview?.url) return undefined;
    return () => URL.revokeObjectURL(ocrPreview.url);
  }, [ocrPreview?.url]);

  function normalizeHeader(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[()]/g, '')
      .replace(/[^a-z0-9_]/g, '');
  }

  function normalizeName(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeOcrToken(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  function getFieldMap(headers) {
    const map = {};
    headers.forEach((h, i) => {
      const key = normalizeHeader(h);
      if (['student_id', 'id', 'studentid'].includes(key)) map.id = i;
      if (['no', 'no.', 'no_'].includes(key)) map.no = i;
      if (['name', 'student_name'].includes(key)) map.name = i;
      if (['prelim', 'pre'].includes(key)) map.prelim = i;
      if (['midterm', 'mid'].includes(key)) map.midterm = i;
      if (['semi', 'semi_final', 'semifinal'].includes(key)) map.semi = i;
      if (['final', 'fin'].includes(key)) map.final = i;
      if (['finals_grade', 'final_grade', 'finals'].includes(key)) map.finals = i;
      if (['ave_grade', 'average_grade', 'avg_grade', 'ave', 'average'].includes(key)) map.ave = i;
    });
    return map;
  }

  function coerceGrade(value) {
    if (value === null || value === undefined || value === '') return null;
    const cleaned = String(value).replace('%', '').trim();
    if (!cleaned) return null;
    const num = Number(cleaned);
    return Number.isNaN(num) ? null : num;
  }

  function findHeaderRow(rows) {
    const limit = Math.min(rows.length, 20);
    for (let i = 0; i < limit; i += 1) {
      const map = getFieldMap(rows[i] || []);
      const hasId = map.id !== undefined;
      const hasGrades = ['prelim', 'midterm', 'semi', 'final'].some(key => map[key] !== undefined);
      const hasOfficial = map.name !== undefined && (map.ave !== undefined || map.finals !== undefined);
      if (hasId || hasGrades || hasOfficial) return { index: i, map };
    }
    return null;
  }

  function resolvePeriodKey(value) {
    const normalized = String(value || '').toLowerCase();
    if (normalized.includes('prelim')) return 'prelim';
    if (normalized.includes('mid')) return 'midterm';
    if (normalized.includes('semi')) return 'semi';
    return 'final';
  }

  function detectTemplate(headers) {
    if (!headers || headers.length === 0) return null;
    let best = null;
    OFFICIAL_TEMPLATES.forEach(template => {
      const matched = template.headers.filter(header => headers.includes(header));
      const ratio = matched.length / template.headers.length;
      if (!best || ratio > best.ratio) {
        best = {
          ...template,
          matched,
          missing: template.headers.filter(header => !headers.includes(header)),
          ratio,
        };
      }
    });
    if (best && best.ratio >= 0.6) return best;
    return null;
  }

  function buildGradeOverlay(words) {
    if (!words?.length) return { words: [], warning: 'No OCR text detected.' };
    const headerMatches = [];
    words.forEach(word => {
      const token = normalizeOcrToken(word.text);
      if (!token) return;
      Object.entries(GRADE_HEADER_ALIASES).forEach(([key, aliases]) => {
        if (aliases.map(normalizeOcrToken).includes(token)) {
          headerMatches.push({ ...word, header: key });
        }
      });
    });

    const headerByKey = {};
    headerMatches.forEach(match => {
      if (!headerByKey[match.header] || match.confidence > headerByKey[match.header].confidence) {
        headerByKey[match.header] = match;
      }
    });

    const headers = Object.values(headerByKey);
    if (headers.length < 2) {
      return { words, warning: 'Grade columns not detected; showing all OCR text.' };
    }

    const headerBottom = Math.max(...headers.map(h => h.bbox.y1));
    const maxX = Math.max(...words.map(w => w.bbox.x1));
    const sortedHeaders = headers
      .map(h => ({ ...h, centerX: (h.bbox.x0 + h.bbox.x1) / 2 }))
      .sort((a, b) => a.centerX - b.centerX);

    const boundaries = sortedHeaders.map((header, index) => {
      const prev = sortedHeaders[index - 1];
      const next = sortedHeaders[index + 1];
      const start = prev ? (prev.centerX + header.centerX) / 2 : 0;
      const end = next ? (header.centerX + next.centerX) / 2 : maxX;
      return { header: header.header, start, end };
    });

    const filtered = words.filter(word => {
      const centerX = (word.bbox.x0 + word.bbox.x1) / 2;
      const belowHeader = word.bbox.y0 > headerBottom + 4;
      if (!belowHeader) return false;
      return boundaries.some(boundary => centerX >= boundary.start && centerX <= boundary.end);
    });

    if (!filtered.length) {
      return { words, warning: 'Grade columns detected but no values found below header.' };
    }

    return { words: filtered, warning: null };
  }

  function rowsToGradeMap(rows, options = {}) {
    if (!rows.length) {
      return {
        map: {},
        count: 0,
        meta: { fallbackUsed: false, invalidGrades: 0, missingIds: 0, headerNormalized: [], usedNameMatch: false },
      };
    }
    const headerMatch = findHeaderRow(rows);
    let headerIndex = 0;
    let map = headerMatch?.map || {};
    let fallbackUsed = false;
    let usedNameMatch = false;

    if (headerMatch) {
      headerIndex = headerMatch.index;
    } else {
      map = { id: 0, name: 1, prelim: 2, midterm: 3, semi: 4, final: 5 };
      fallbackUsed = true;
    }

    if (map.id === undefined && map.no !== undefined) {
      map.id = map.no;
      fallbackUsed = true;
    }

    const headerRow = headerMatch ? rows[headerMatch.index] : [];
    const headerTokens = (headerRow || []).map(normalizeHeader).filter(Boolean);
    const headerNormalized = Array.from(new Set([
      ...headerTokens,
      ...headerTokens.map(token => token.replace(/_\d+$/g, '')),
    ])).filter(Boolean);
    const output = {};
    let count = 0;
    let invalidGrades = 0;
    let missingIds = 0;
    const periodKey = resolvePeriodKey(options.period);
    const studentLookup = new Map(
      (options.students || []).map(student => [normalizeName(student.name), student.id]),
    );
    for (let i = headerIndex + 1; i < rows.length; i += 1) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      let rawId = row[map.id ?? 0];
      let id = rawId ? String(rawId).trim() : '';
      if (!id && map.name !== undefined) {
        const nameCell = row[map.name];
        const lookupId = studentLookup.get(normalizeName(nameCell));
        if (lookupId) {
          id = lookupId;
          usedNameMatch = true;
        }
      }
      if (!id) {
        missingIds += 1;
        continue;
      }
      const grades = {};
      const periodFieldMap = {
        prelim: map.prelim,
        midterm: map.midterm,
        semi: map.semi,
        final: map.final ?? map.finals ?? map.ave,
      };
      const officialGradeIndex = map.finals ?? map.ave;
      const preferredIndex = periodFieldMap[periodKey] ?? officialGradeIndex;

      if (preferredIndex !== undefined) {
        const value = coerceGrade(row[preferredIndex]);
        if (value !== null && (value < 0 || value > 100)) {
          invalidGrades += 1;
          grades[periodKey] = null;
        } else {
          grades[periodKey] = value;
        }
      }

      ['prelim', 'midterm', 'semi', 'final'].forEach(field => {
        if (grades[field] === undefined) grades[field] = null;
      });
      output[id] = grades;
      count += 1;
    }
    return { map: output, count, meta: { fallbackUsed, invalidGrades, missingIds, headerNormalized, usedNameMatch } };
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
    const rows = lines.map(line => line.split(/\t|\s{2,}|,/).map(cell => cell.trim()));
    return rows;
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
    const words = (result?.data?.words || [])
      .filter(word => word.confidence >= 60)
      .map(word => ({
        text: word.text,
        confidence: word.confidence,
        bbox: word.bbox,
      }));
    return { rows: parseTextTable(text), confidence, words };
  }

  function handleOcrImageLoad(event) {
    const img = event.currentTarget;
    if (!img?.naturalWidth || !img?.naturalHeight) return;
    const scaleX = img.clientWidth / img.naturalWidth;
    const scaleY = img.clientHeight / img.naturalHeight;
    setOcrScale({ x: scaleX, y: scaleY });
  }


  async function handleGradeFile(file) {
    const { label } = getMethod(file.name);
    setGradeStatus('loading');
    setGradeTitle(file.name);
    setGradeSub(`Processing via ${label}...`);
    setGradeNotice(null);
    setOcrMeta(null);
  setOcrPreview(null);
    setParseWarnings([]);
  setDetectedTemplate(null);
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      let rows = [];
      let ocrConfidence = null;
      let ocrOverlayWarning = null;
      if (['xlsx', 'xls', 'csv'].includes(ext)) {
        rows = await parseSpreadsheet(file, ext === 'csv' ? 'csv' : 'xlsx');
      } else if (['docx', 'doc'].includes(ext)) {
        rows = await parseDocx(file);
      } else if (ext === 'pdf') {
        rows = await parsePdf(file);
      } else if (['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff'].includes(ext)) {
        const ocrResult = await parseImageOcr(file);
        rows = ocrResult.rows;
        ocrConfidence = ocrResult.confidence;
        const overlay = buildGradeOverlay(ocrResult.words);
        ocrOverlayWarning = overlay.warning;
        setOcrPreview({
          url: URL.createObjectURL(file),
          words: overlay.words,
          warning: overlay.warning,
        });
      } else {
        throw new Error('Unsupported file type for parsing.');
      }

  const { map, count, meta } = rowsToGradeMap(rows, { students: myStudents, period });
      const template = detectTemplate(meta?.headerNormalized);
      const init = {};
      myStudents.forEach(s => {
        const existing = map[s.id] || {};
        init[s.id] = {
          prelim: existing.prelim ?? s.prelim ?? null,
          midterm: existing.midterm ?? s.midterm ?? null,
          semi: existing.semi ?? s.semi ?? null,
          final: existing.final ?? s.final ?? null,
        };
      });

      const missing = myStudents.filter(s => {
        const field = period.toLowerCase().replace('-', '');
        const grade = init[s.id]?.[field === 'semifinal' ? 'semi' : field];
        return grade === null || grade === undefined || grade === '';
      });

      const warnings = [];
      if (meta?.fallbackUsed) warnings.push('Header not detected; used positional columns (ID, Name, Prelim, Midterm, Semi, Final).');
      if (meta?.invalidGrades) warnings.push(`Ignored ${meta.invalidGrades} out-of-range grades (0-100).`);
      if (meta?.missingIds) warnings.push(`Skipped ${meta.missingIds} rows missing Student ID.`);
  if (meta?.usedNameMatch) warnings.push('Matched some rows by student name (Student ID was missing).');
      if (!template) {
        warnings.push('Official grade sheet template not detected. Verify you used the official format.');
      } else if (template.missing.length) {
        warnings.push(`Template mismatch (${template.name}): missing ${template.missing.join(', ')}.`);
      }
      if (ocrOverlayWarning) warnings.push(ocrOverlayWarning);
      if (ocrConfidence !== null && ocrConfidence < 80) {
        warnings.push(`Low OCR confidence (${Math.round(ocrConfidence)}%). Review carefully.`);
      }

      setGradeValues(init);
      setMissingStudents(missing);
      setParsedCount(count);
      setOcrMeta(ocrConfidence !== null ? { confidence: ocrConfidence } : null);
      setParseWarnings(warnings);
  setDetectedTemplate(template);
      setGradeStatus('done');
      const confidenceNote = ocrConfidence !== null ? ` · OCR ${Math.round(ocrConfidence)}%` : '';
      setGradeSub(`✓ Parsed ${count} rows via ${label}${confidenceNote}`);
      setGradeNotice({ type: 'suc', label });
    } catch (err) {
      setGradeStatus('idle');
      setGradeSub('Upload CSV/XLSX, PDF, DOCX, or photo grade sheets');
      setGradeNotice({ type: 'err', label: err.message || 'Parsing failed' });
      setOcrMeta(null);
      setOcrPreview(null);
      setParseWarnings([]);
      setDetectedTemplate(null);
    }
  }

  function handleGradeChange(id, field, val) {
    setGradeValues(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  }

  function commit() {
    onCommit({ subject, period, gradeValues });
  }

  const FILE_TAGS_GRADE = [
    { label: 'Photo (OCR)', icon: 'ti-photo' },
    { label: 'XLSX/CSV',    icon: 'ti-table' },
    { label: 'PDF',         icon: 'ti-file-type-pdf' },
    { label: 'DOCX/DOC',     icon: 'ti-file-word' },
  ];

  function downloadGradeTemplate(format = 'csv') {
    // Create sample data with headers
    const headers = ['Student ID', 'Student Name', 'Prelim', 'Midterm', 'Semi-Final', 'Final'];
    const sampleData = [
      headers,
      ['12-00001', 'Juan Dela Cruz', '', '', '', ''],
      ['12-00002', 'Maria Garcia', '', '', '', ''],
      ['12-00003', 'Pedro Santos', '', '', '', ''],
    ];

    if (format === 'csv') {
      // Generate CSV
      const csvContent = sampleData
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'grade_sheet_template.csv');
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'xlsx') {
      // Generate Excel using XLSX
      const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 15 }, // Student ID
        { wch: 25 }, // Student Name
        { wch: 12 }, // Prelim
        { wch: 12 }, // Midterm
        { wch: 15 }, // Semi-Final
        { wch: 12 }, // Final
      ];

      // Style header row (bold)
      sampleData[0].forEach((_, colIndex) => {
        const cellRef = XLSX.utils.encode_col(colIndex) + '1';
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: 'FFD966' } }, // Yellow background
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        }
      });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Grade Sheet');
      XLSX.writeFile(workbook, 'grade_sheet_template.xlsx');
    }
  }

  return (
    <>
      <div className="ph">
        <h2>Upload grades</h2>
        <p>{rd.name} · Upload a grade sheet for existing enrolled students</p>
      </div>

      <div className="step-row">
        {/* Left column: Step 1 + Step 2 */}
        <div>
          {/* Step 1 — Grade sheet */}
          <div className="card">
            <div className="ch">
              <span className="ct"><i className="ti ti-table-import" /> Step 1 — Upload grade sheet</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn sm"
                  type="button"
                  onClick={() => downloadGradeTemplate('csv')}
                  title="Download a CSV template for grade submission"
                >
                  <i className="ti ti-download" /> CSV Template
                </button>
                <button
                  className="btn sm"
                  type="button"
                  onClick={() => downloadGradeTemplate('xlsx')}
                  title="Download an Excel template for grade submission"
                >
                  <i className="ti ti-download" /> Excel Template
                </button>
                {onEnrollSubject && (
                  <button
                    className="btn sm"
                    type="button"
                    onClick={() => setShowEnrollConfirm(true)}
                  >
                    <i className="ti ti-user-plus" /> Enroll student in this subject
                  </button>
                )}
              </div>
            </div>
            <div className="form-grid">
              <div className="fg">
                <label>Subject</label>
                <input
                  value={subjectSearch}
                  onChange={e => setSubjectSearch(e.target.value)}
                  placeholder="Search subject"
                  style={{ marginBottom: 8 }}
                />
                <select value={subject} onChange={e => setSubject(e.target.value)}>
                  {filteredSubjects.length ? (
                    filteredSubjects.map(s => <option key={s}>{s}</option>)
                  ) : (
                    <option value="" disabled>No matching subjects</option>
                  )}
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
              icon="ti-photo-scan"
              title={gradeTitle} sub={gradeSub}
              tags={FILE_TAGS_GRADE}
              onFile={handleGradeFile}
              status={gradeStatus}
            />
            {gradeNotice && (
              <Notice type={gradeNotice.type} icon={gradeNotice.type === 'err' ? 'ti-alert-circle' : 'ti-check'}>
                {gradeNotice.type === 'err'
                  ? gradeNotice.label
                  : <>Grade sheet processed via <strong>{gradeNotice.label}</strong>. Parsed {parsedCount} rows.</>}
              </Notice>
            )}
            {parseWarnings.length > 0 && (
              <Notice type="warn" icon="ti-alert-triangle">
                {parseWarnings.map((warning, index) => (
                  <div key={`${warning}-${index}`}>{warning}</div>
                ))}
              </Notice>
            )}
            {detectedTemplate && (
              <Notice type="info" icon="ti-clipboard-check">
                Detected template: <strong>{detectedTemplate.name}</strong>
              </Notice>
            )}
            {ocrPreview && (
              <div className="ocr-preview">
                <div className="ocr-preview-head">
                  <span>OCR preview (grade columns)</span>
                  {ocrMeta?.confidence !== null && ocrMeta?.confidence !== undefined && (
                    <span className="ocr-confidence">{Math.round(ocrMeta.confidence)}% confidence</span>
                  )}
                </div>
                <div className="ocr-preview-body">
                  <div className="ocr-image-wrap">
                    <img src={ocrPreview.url} alt="OCR preview" onLoad={handleOcrImageLoad} />
                    <div className="ocr-overlay">
                      {ocrPreview.words.map((word, index) => {
                        const width = (word.bbox.x1 - word.bbox.x0) * ocrScale.x;
                        const height = (word.bbox.y1 - word.bbox.y0) * ocrScale.y;
                        return (
                          <span
                            key={`${word.text}-${index}`}
                            className="ocr-box"
                            title={`${word.text} (${Math.round(word.confidence)}%)`}
                            style={{
                              left: word.bbox.x0 * ocrScale.x,
                              top: word.bbox.y0 * ocrScale.y,
                              width,
                              height,
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Step 3 — Review */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="ch">
            <span className="ct"><i className="ti ti-link" /> Step 2 — Review &amp; commit to blockchain</span>
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
              Upload a grade sheet to preview entries.
            </div>
          ) : (
            <div className="two-col">
              <div className="card" style={{ marginBottom: 0 }}>
                <div className="ch"><span className="ct">Matched grades</span></div>
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
              </div>
              <div className="card" style={{ marginBottom: 0 }}>
                <div className="ch"><span className="ct">Missing grades ({missingStudents.length})</span></div>
                {missingStudents.length === 0 ? (
                  <div className="empty-state" style={{ padding: 20 }}>
                    <i className="ti ti-check" />
                    All students have grades for this period.
                  </div>
                ) : (
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Student ID</th><th>Name</th><th>Subject</th>
                        </tr>
                      </thead>
                      <tbody>
                        {missingStudents.map(s => (
                          <tr key={s.id}>
                            <td className="hash">{s.id}</td>
                            <td style={{ fontWeight: 500 }}>{s.name}</td>
                            <td>{s.subj}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`modal-bg ${showEnrollConfirm ? 'open' : ''}`}>
        <div className="modal">
          <div className="modal-hdr">
            <h3>Confirm subject enrollment</h3>
            <button className="close-btn" onClick={() => setShowEnrollConfirm(false)}><i className="ti ti-x" /></button>
          </div>
          <div className="modal-meta">
            <div className="row">
              <span>Selected subject</span>
              <span>{subject || 'Unspecified'}</span>
            </div>
            <div className="row">
              <span>Grade period</span>
              <span>{period}</span>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setShowEnrollConfirm(false)}>Cancel</button>
            <button
              className="btn pri"
              onClick={() => {
                setShowEnrollConfirm(false);
                if (onEnrollSubject) onEnrollSubject(subject);
              }}
            >
              Continue to enrollment
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
