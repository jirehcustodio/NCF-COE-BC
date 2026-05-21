import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ROLES } from '../../data/appData';
import { EmptyState, Notice, StatusBadge } from '../Shared';

function computeAverage(row) {
  const values = [row.prelim, row.midterm, row.semi, row.final].filter(v => typeof v === 'number');
  if (values.length === 0) return '—';
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return avg.toFixed(1);
}

export default function FacultyGradeRecord({ students, curRole, profKey, isDeanView = false }) {
  const instructors = useMemo(() => Array.from(new Set(students.map(s => s.prof).filter(Boolean))), [students]);
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [studentQuery, setStudentQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('Prelim');

  const subjectOptions = useMemo(
    () => Array.from(new Set(students.map(s => s.subj).filter(Boolean))),
    [students]
  );
  const periodKey = useMemo(() => {
    const normalized = selectedPeriod.toLowerCase().replace('-', '');
    return normalized === 'semifinal' ? 'semi' : normalized;
  }, [selectedPeriod]);

  const activeProf = profKey || curRole;
  const filtered = students.filter(s => {
    const matchesInstructor = isDeanView ? (!selectedInstructor || s.prof === selectedInstructor) : s.prof === activeProf;
    const matchesSubject = !selectedSubject || s.subj === selectedSubject;
    const idValue = (s.id || '').toLowerCase();
    const matchesStudent = !studentQuery || idValue.includes(studentQuery.toLowerCase());
    return matchesInstructor && matchesSubject && matchesStudent;
  });

  function exportExcel() {
    const rows = filtered.map(row => ({
      Subject: row.subj,
      StudentID: row.id,
      Period: selectedPeriod,
      PeriodGrade: row[periodKey] ?? '',
      FacultyEncoder: ROLES[row.prof]?.name || row.prof,
  DateEncoded: row.encoded_at || row.created_at || '',
      VerificationStatus: row.status,
      AccessLevel: 'Faculty/Admin',
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'FacultyGrades');
    XLSX.writeFile(workbook, 'faculty-grade-record.xlsx');
  }

  function exportPdf() {
    const doc = new jsPDF();
    doc.text('Faculty Grade Record', 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [['Subject', 'Student ID', 'Period', 'Period Grade', 'Faculty Encoder', 'Date Encoded', 'Verification', 'Access']],
      body: filtered.map(row => [
        row.subj,
        row.id,
        selectedPeriod,
        row[periodKey] ?? '',
        ROLES[row.prof]?.name || row.prof,
  row.encoded_at || row.created_at || '—',
        row.status,
        'Faculty/Admin',
      ]),
    });
    doc.save('faculty-grade-record.pdf');
  }

  return (
    <>
      <div className="ph">
        <h2>Faculty grade record</h2>
        <p>{isDeanView ? 'Dean overview of all faculty grade books' : `${ROLES[curRole]?.name} · Your grade book`}</p>
      </div>

      <div className="card">
        <div className="ch">
          <span className="ct">Faculty record components</span>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Faculty Record Component</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Course Code / Subject</td>
                <td>Identifies the subject handled by the faculty member</td>
              </tr>
              <tr>
                <td>Student Identifier</td>
                <td>Uses student number or code instead of unrestricted name display</td>
              </tr>
              <tr>
                <td>Periodical Grade</td>
                <td>Represents the grade recorded for a specific grading period</td>
              </tr>
              <tr>
                <td>Faculty Encoder</td>
                <td>Authorized faculty member responsible for grade entry</td>
              </tr>
              <tr>
                <td>Date of Encoding</td>
                <td>Indicates when the grade record was entered or updated</td>
              </tr>
              <tr>
                <td>Verification Status</td>
                <td>Indicates whether the record has been checked or validated</td>
              </tr>
              <tr>
                <td>Access Level</td>
                <td>Limits access to authorized faculty and administrators only</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="ch">
          <span className="ct">Grade book</span>
          <div className="inline-actions">
            <button className="btn sm" onClick={exportExcel}><i className="ti ti-file-spreadsheet" /> Export Excel</button>
            <button className="btn sm" onClick={exportPdf}><i className="ti ti-download" /> Export PDF</button>
          </div>
        </div>
        <div className="search-row">
          {isDeanView && (
            <select value={selectedInstructor} onChange={event => setSelectedInstructor(event.target.value)}>
              <option value="">All instructors</option>
              {instructors.map(ins => (
                <option key={ins} value={ins}>{ROLES[ins]?.name || ins}</option>
              ))}
            </select>
          )}
          <select value={selectedSubject} onChange={event => setSelectedSubject(event.target.value)}>
            <option value="">All subjects</option>
            {subjectOptions.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
          <input
            placeholder="Student identifier"
            value={studentQuery}
            onChange={event => setStudentQuery(event.target.value)}
          />
          <select value={selectedPeriod} onChange={event => setSelectedPeriod(event.target.value)}>
            <option>Prelim</option>
            <option>Midterm</option>
            <option>Semi-Final</option>
            <option>Final</option>
          </select>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon="ti-clipboard-x">No grade records available.</EmptyState>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Course Code / Subject</th>
                  <th>Student Identifier</th>
                  <th>Periodical Grade</th>
                  <th>Faculty Encoder</th>
                  <th>Date of Encoding</th>
                  <th>Verification Status</th>
                  <th>Access Level</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id}>
                    <td>{row.subj}</td>
                    <td className="hash">{row.id}</td>
                    <td>{row[periodKey] ?? '—'}</td>
                    <td>{ROLES[row.prof]?.name || row.prof}</td>
                    <td style={{ fontSize: 11 }}>{row.encoded_at || row.created_at || '—'}</td>
                    <td><StatusBadge status={row.status} /></td>
                    <td><span className="badge info">Faculty/Admin</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Notice type="info" icon="ti-info-circle">
        Faculty grade records are read-only after being committed to the blockchain.
      </Notice>
    </>
  );
}
