import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EmptyState, Notice } from '../Shared';

export default function SiasDocs({ gradeSheets = [], curriculumSubjects = [], enrollmentRecords = [] }) {
  const [gradeStatus, setGradeStatus] = useState('');
  const [program, setProgram] = useState('');
  const programOptions = useMemo(() => {
    const detected = curriculumSubjects.map(subject => subject.program).filter(Boolean);
    const defaults = ['BSCE', 'BSCpE', 'BSGE'];
    return Array.from(new Set([...detected, ...defaults]));
  }, [curriculumSubjects]);

  const filteredSheets = gradeSheets.filter(s => !gradeStatus || s.status === gradeStatus);
  const filteredCurriculum = curriculumSubjects.filter(s => !program || s.program === program);

  function exportSheetsExcel() {
    const rows = filteredSheets.map(r => ({
      Subject: r.subject,
      Period: r.period,
      'Last Updated': r.lastUpdated || r.last_updated,
      Status: r.status,
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'GradeSheets');
    XLSX.writeFile(workbook, 'grade-sheets.xlsx');
  }

  function exportSheetsPdf() {
    const doc = new jsPDF();
    doc.text('Grade Sheets', 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [['Subject', 'Period', 'Last Updated', 'Status']],
      body: filteredSheets.map(r => [
        r.subject,
        r.period,
        r.lastUpdated || r.last_updated,
        r.status,
      ]),
    });
    doc.save('grade-sheets.pdf');
  }

  return (
    <>
      <div className="ph">
        <h2>SIAS documentation</h2>
        <p>Grade sheets, curriculum/subjects, enrollment records, and printable reports</p>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="ch">
            <span className="ct">Grade sheets</span>
            <div className="inline-actions">
              <select value={gradeStatus} onChange={event => setGradeStatus(event.target.value)}>
                <option value="">All statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Pending">Pending</option>
              </select>
              <button className="btn sm" onClick={exportSheetsPdf}><i className="ti ti-download" /> PDF</button>
              <button className="btn sm" onClick={exportSheetsExcel}><i className="ti ti-file-spreadsheet" /> Excel</button>
            </div>
          </div>
          {filteredSheets.length === 0 ? (
            <EmptyState icon="ti-file-report">No grade sheets found.</EmptyState>
          ) : (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Period</th>
                    <th>Last Updated</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSheets.map((r, i) => (
                    <tr key={`${r.subject}-${i}`}>
                      <td>{r.subject}</td>
                      <td>{r.period}</td>
                      <td>{r.lastUpdated}</td>
                      <td>
                        <span className={`badge ${r.status === 'Submitted' ? 'ok' : 'pend'}`}>
                          <i className={`ti ${r.status === 'Submitted' ? 'ti-check' : 'ti-clock'}`} />
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="ch">
            <span className="ct">Printable reports</span>
          </div>
          <div className="report-grid">
            <button className="btn pri"><i className="ti ti-printer" /> Grade sheet summary</button>
            <button className="btn pri"><i className="ti ti-printer" /> Enrollment summary</button>
            <button className="btn pri"><i className="ti ti-printer" /> Faculty load list</button>
            <button className="btn pri"><i className="ti ti-printer" /> Curriculum matrix</button>
          </div>
          <Notice type="info" icon="ti-info-circle">
            Printable reports are generated based on the latest records and semester selections.
          </Notice>
        </div>
      </div>

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

      <div className="card">
        <div className="ch">
          <span className="ct">Enrollment records</span>
        </div>
        {enrollmentRecords.length === 0 ? (
          <EmptyState icon="ti-users">No enrollment records yet.</EmptyState>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Program</th>
                  <th>Status</th>
                  <th>Adviser</th>
                </tr>
              </thead>
              <tbody>
                {enrollmentRecords.map(row => (
                  <tr key={row.id}>
                    <td className="hash">{row.id}</td>
                    <td>{row.name}</td>
                    <td>{row.program}</td>
                    <td>
                      <span className={`badge ${row.status === 'Enrolled' ? 'ok' : 'pend'}`}>
                        <i className={`ti ${row.status === 'Enrolled' ? 'ti-check' : 'ti-clock'}`} />
                        {row.status}
                      </span>
                    </td>
                    <td>{row.adviser}</td>
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
