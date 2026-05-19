import React, { useMemo } from 'react';
import { EmptyState } from '../Shared';

export default function SubjectDetail({ students, curRole, subject, onEnrollSubject, onUploadSubject }) {
  const filtered = students.filter(student => student.subj === subject);

  const summary = useMemo(() => {
    const total = filtered.length || 0;
    const countFilled = (field) => filtered.filter(student => student[field] !== null && student[field] !== undefined && student[field] !== '').length;
    return {
      total,
      prelim: countFilled('prelim'),
      midterm: countFilled('midterm'),
      semi: countFilled('semi'),
      final: countFilled('final'),
    };
  }, [filtered]);

  const chartRows = [
    { key: 'Prelim', value: summary.prelim, total: summary.total },
    { key: 'Midterm', value: summary.midterm, total: summary.total },
    { key: 'Semi-Final', value: summary.semi, total: summary.total },
    { key: 'Final', value: summary.final, total: summary.total },
  ];

  return (
    <>
      <div className="ph">
        <h2>{subject || 'Subject detail'}</h2>
        <p>Students and grades for this subject</p>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="ch">
            <span className="ct">Subject summary</span>
            <div className="inline-actions">
              <button className="btn sm" onClick={() => onEnrollSubject(subject)}>
                <i className="ti ti-user-plus" /> Enroll student
              </button>
              <button className="btn pri sm" onClick={() => onUploadSubject(subject)}>
                <i className="ti ti-upload" /> Upload grades
              </button>
            </div>
          </div>
          <div className="summary-grid">
            <div className="summary-card">
              <span>Total students</span>
              <strong>{summary.total}</strong>
            </div>
            <div className="summary-card">
              <span>Grades recorded</span>
              <strong>{summary.prelim + summary.midterm + summary.semi + summary.final}</strong>
            </div>
          </div>
          <div className="subject-chart">
            {chartRows.map(row => {
              const percent = row.total ? Math.round((row.value / row.total) * 100) : 0;
              return (
                <div className="chart-row" key={row.key}>
                  <div className="chart-label">{row.key}</div>
                  <div className="chart-bar">
                    <span style={{ width: `${percent}%` }} />
                  </div>
                  <div className="chart-value">{row.value}/{row.total}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="ch">
            <span className="ct">Students ({summary.total})</span>
          </div>
          {filtered.length === 0 ? (
            <EmptyState icon="ti-users">No students enrolled in this subject yet.</EmptyState>
          ) : (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Pre.</th>
                    <th>Mid.</th>
                    <th>Semi</th>
                    <th>Fin.</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(student => (
                    <tr key={`${student.id}-${student.subj}`}>
                      <td className="hash">{student.id}</td>
                      <td style={{ fontWeight: 500 }}>{student.name}</td>
                      <td>{student.prelim ?? '—'}</td>
                      <td>{student.midterm ?? '—'}</td>
                      <td>{student.semi ?? '—'}</td>
                      <td>{student.final ?? '—'}</td>
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
