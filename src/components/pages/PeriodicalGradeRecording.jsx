import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ROLES } from '../../data/appData';
import { EmptyState, Notice } from '../Shared';

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

export default function PeriodicalGradeRecording({
  students,
  subjects = [],
  gradeSheets = [],
  curRole,
  profKey,
  isDeanView = false,
  onSavePeriodicalGrades,
}) {
  const rd = ROLES[curRole];
  const activeProf = profKey || curRole;
  const availableStudents = isDeanView ? students : students.filter(s => s.prof === activeProf);

  const instructors = useMemo(() => unique(students.map(s => s.prof)), [students]);

  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('Prelim');
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [fileName, setFileName] = useState('');
  const [gradeEdits, setGradeEdits] = useState({});
  const [lastSaved, setLastSaved] = useState('');
  const [toast, setToast] = useState('');

  const programOptions = useMemo(() => {
    const detected = availableStudents.map(s => s.program).filter(Boolean);
    const defaults = ['BSCE', 'BSCpE', 'BSGE'];
    return unique([...detected, ...defaults]);
  }, [availableStudents]);

  const programFilteredStudents = useMemo(() => (
    selectedProgram
      ? availableStudents.filter(student => student.program === selectedProgram)
      : availableStudents
  ), [availableStudents, selectedProgram]);

  const subjectOptions = useMemo(() => {
    const fromStudents = programFilteredStudents.map(s => s.subj).filter(Boolean);
    const fromSubjects = (subjects || []).map(subject => (typeof subject === 'string' ? subject : subject.code)).filter(Boolean);
    const fromSheets = (gradeSheets || []).map(sheet => sheet.subject).filter(Boolean);
    return unique([...fromSubjects, ...fromSheets, ...fromStudents]);
  }, [programFilteredStudents, subjects, gradeSheets]);
  const sectionOptions = useMemo(() => {
    const fromStudents = programFilteredStudents.map(s => s.section || s.block || 'General');
    const fromSheets = gradeSheets
      .filter(sheet => !selectedSubject || sheet.subject === selectedSubject)
      .map(sheet => sheet.section || 'General');
    return unique([...fromSheets, ...fromStudents]);
  }, [programFilteredStudents, gradeSheets, selectedSubject]);

  useEffect(() => {
    if (!selectedSubject && subjectOptions.length) {
      setSelectedSubject(subjectOptions[0]);
    }
  }, [subjectOptions, selectedSubject]);

  useEffect(() => {
    if (!sectionOptions.length) {
      setSelectedSection('');
      return;
    }
    if (!selectedSection || !sectionOptions.includes(selectedSection)) {
      setSelectedSection(sectionOptions[0]);
    }
  }, [sectionOptions, selectedSection]);

  const periodKey = useMemo(() => {
    const normalized = selectedPeriod.toLowerCase().replace('-', '');
    return normalized === 'semifinal' ? 'semi' : normalized;
  }, [selectedPeriod]);

  const filtered = programFilteredStudents.filter(s =>
    (!selectedSubject || s.subj === selectedSubject) &&
    (!selectedSection || (s.section || s.block || 'General') === selectedSection) &&
    (!selectedInstructor || s.prof === selectedInstructor)
  );

  const hasEdits = useMemo(() => Object.keys(gradeEdits).length > 0, [gradeEdits]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  function handleGradeChange(id, value) {
    setGradeEdits(prev => ({ ...prev, [id]: value }));
  }

  function handleSave() {
    const updates = filtered
      .filter(row => gradeEdits[row.id] !== undefined)
      .map(row => ({
        ...row,
        grade: gradeEdits[row.id],
      }));
    if (!updates.length) return;
    if (onSavePeriodicalGrades) {
      const savedAt = onSavePeriodicalGrades({ periodKey, updates });
      if (savedAt) setLastSaved(savedAt);
    }
    setGradeEdits({});
    setToast('Saved');
  }

  function exportCsv() {
    const rows = filtered.map(row => ({
      StudentID: row.id,
      Name: row.name,
      Subject: row.subj,
      Section: row.section || row.block || 'General',
      Period: selectedPeriod,
      Grade: row[periodKey] ?? '',
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'PeriodGrades');
    XLSX.writeFile(workbook, `periodical-${selectedPeriod.toLowerCase()}.xlsx`);
  }

  function exportPdf() {
    const doc = new jsPDF();
    doc.text(`Periodical Grades (${selectedPeriod})`, 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [['Student ID', 'Name', 'Subject', 'Section', 'Grade']],
      body: filtered.map(row => [
        row.id,
        row.name,
        row.subj,
        row.section || row.block || 'General',
        row[periodKey] ?? '',
      ]),
    });
    doc.save(`periodical-${selectedPeriod.toLowerCase()}.pdf`);
  }

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (file) setFileName(file.name);
  }

  return (
    <>
      <div className="ph">
        <h2>Periodical grade recording</h2>
        <p>{isDeanView ? 'Dean overview of periodical grade submissions' : `${rd.name} · Record grades per subject and period`}</p>
      </div>

      <div className="card">
        <div className="ch">
          <span className="ct">Recording settings</span>
          <div className="inline-actions">
            <button className="btn sm" onClick={exportCsv}><i className="ti ti-file-spreadsheet" /> Export Excel</button>
            <button className="btn sm" onClick={exportPdf}><i className="ti ti-download" /> Export PDF</button>
          </div>
        </div>
        <div className="form-grid">
          {isDeanView && (
            <div className="fg">
              <label>Instructor</label>
              <select value={selectedInstructor} onChange={event => setSelectedInstructor(event.target.value)}>
                <option value="">All instructors</option>
                {instructors.map(ins => (
                  <option key={ins} value={ins}>{ROLES[ins]?.name || ins}</option>
                ))}
              </select>
            </div>
          )}
          <div className="fg">
            <label>Program</label>
            <select value={selectedProgram} onChange={event => setSelectedProgram(event.target.value)}>
              <option value="">All programs</option>
              {programOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="fg">
            <label>Subject</label>
            <select value={selectedSubject} onChange={event => setSelectedSubject(event.target.value)}>
              <option value="">All subjects</option>
              {subjectOptions.map(sub => <option key={sub}>{sub}</option>)}
            </select>
          </div>
          <div className="fg">
            <label>Block/Section</label>
            <select value={selectedSection} onChange={event => setSelectedSection(event.target.value)}>
              <option value="">All sections</option>
              {sectionOptions.map(sec => <option key={sec} value={sec}>{sec}</option>)}
            </select>
          </div>
          <div className="fg">
            <label>Period</label>
            <select value={selectedPeriod} onChange={event => setSelectedPeriod(event.target.value)}>
              <option>Prelim</option>
              <option>Midterm</option>
              <option>Semi-Final</option>
              <option>Final</option>
            </select>
          </div>
        </div>

        <div className="upload-inline">
          <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} />
          <span className="muted-text">
            {fileName ? `Selected file: ${fileName}` : 'Upload CSV/Excel grade sheet (optional)'}
          </span>
        </div>

        <Notice type="info" icon="ti-info-circle">
          Uploading a file is optional; you can also encode grades manually below before submitting.
        </Notice>
      </div>

      <div className="card">
        <div className="ch">
          <span className="ct">Grade entries ({filtered.length})</span>
          <div className="inline-actions">
            {lastSaved && <span className="muted-text">Last saved: {lastSaved}</span>}
            <button className="btn suc" onClick={handleSave} disabled={!hasEdits}>
              <i className="ti ti-device-floppy" /> Save period grades
            </button>
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon="ti-clipboard-x">No students found for the selected filters.</EmptyState>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Subject</th>
                  <th>Section</th>
                  <th>{selectedPeriod}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id}>
                    <td className="hash">{row.id}</td>
                    <td style={{ fontWeight: 600 }}>{row.name}</td>
                    <td>{row.subj}</td>
                    <td>{row.section || row.block || 'General'}</td>
                    <td>
                      <input
                        className="grade-input"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="—"
                        value={gradeEdits[row.id] ?? row[periodKey] ?? ''}
                        onChange={event => handleGradeChange(row.id, event.target.value === '' ? '' : Number(event.target.value))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && (
        <div className="toast">
          <i className="ti ti-circle-check" />
          <div>{toast}</div>
        </div>
      )}
    </>
  );
}
