/* ============================================================
   appData.js — Seed data for NCF Blockchain Grade System
   Replace these arrays with real API calls in production.
   ============================================================ */

export const ROLES = {
  dean: {
    name: 'Dean Account',
    role: 'Dean — Full Access',
    av: 'DN',
    type: 'dean',
    color: 'dean',
    dept: null,
    subjects: [],
  },
  instructor: {
    name: 'Instructor Account',
    role: 'Instructor — Limited Access',
    av: 'IN',
    type: 'prof',
    color: 'prof',
    dept: '',
    subjects: [],
  },
};

export const DEAN_NAV = [
  {
    sec: 'Overview',
    items: [
      { id: 'dashboard',   icon: 'ti-layout-dashboard', label: 'Dashboard' },
      { id: 'allgrades',   icon: 'ti-table',             label: 'All Grade Records' },
      { id: 'allstudents', icon: 'ti-users',              label: 'All Student Lists' },
      { id: 'enroll',      icon: 'ti-user-plus',          label: 'Enroll a Student' },
    ],
  },
  {
    sec: 'Academics',
    items: [
      { id: 'facultyrecords', icon: 'ti-id-badge',       label: 'Faculty Records' },
      { id: 'siasdocs',       icon: 'ti-file-description', label: 'SIAS Documentation' },
      { id: 'periodical',     icon: 'ti-calendar-stats', label: 'Periodical Grade Recording' },
      { id: 'facultygrades',  icon: 'ti-report',         label: 'Faculty Grade Record' },
    ],
  },
  {
    sec: 'Blockchain',
    items: [
      { id: 'ledger', icon: 'ti-link',         label: 'Blockchain Ledger' },
      { id: 'verify', icon: 'ti-shield-check', label: 'Verify Grade' },
    ],
  },
  {
    sec: 'Admin',
    items: [
      { id: 'submissions', icon: 'ti-clipboard-check', label: 'Submissions Log' },
      { id: 'instructors', icon: 'ti-user-check',      label: 'Instructors' },
    ],
  },
];

export const PROF_NAV = [
  {
    sec: 'My Workspace',
    items: [
      { id: 'subjects',      icon: 'ti-book',            label: 'My Subjects' },
      { id: 'mystudents',    icon: 'ti-users',           label: 'My Student List' },
      { id: 'upload',        icon: 'ti-upload',          label: 'Upload Grades' },
      { id: 'enroll',        icon: 'ti-user-plus',       label: 'Enroll a Student' },
      { id: 'mysubmissions', icon: 'ti-clipboard-check', label: 'My Submissions' },
    ],
  },
  {
    sec: 'Grades',
    items: [
      { id: 'periodical',    icon: 'ti-calendar-stats', label: 'Periodical Grade Recording' },
      { id: 'facultygrades', icon: 'ti-report',         label: 'Faculty Grade Record' },
    ],
  },
  {
    sec: 'Blockchain',
    items: [
      { id: 'mychain', icon: 'ti-link',         label: 'My Chain Records' },
      { id: 'verify',  icon: 'ti-shield-check', label: 'Verify Grade' },
    ],
  },
  {
    sec: 'Account',
    items: [
      { id: 'settings', icon: 'ti-settings', label: 'Settings' },
    ],
  },
];

export const INITIAL_STUDENTS = [];

export const INITIAL_BLOCKS = [];

export const INITIAL_LOGS = [];

export const INSTRUCTORS_TABLE = [];

export const FACULTY_RECORDS = [
  { id: 'FAC-001', name: 'Engr. Hannah Reyes', dept: 'Civil Engineering', rank: 'Asst. Professor', status: 'Active' },
  { id: 'FAC-002', name: 'Engr. Marco Lim', dept: 'Electrical Engineering', rank: 'Instructor I', status: 'Active' },
  { id: 'FAC-003', name: 'Engr. Arianne Dizon', dept: 'Mechanical Engineering', rank: 'Associate Prof.', status: 'On Leave' },
];

export const TEACHING_LOADS = [
  { facultyId: 'FAC-001', faculty: 'Engr. Hannah Reyes', subject: 'CE 401', section: 'BSCE-4A', units: 3, schedule: 'MWF 10:00–11:00' },
  { facultyId: 'FAC-001', faculty: 'Engr. Hannah Reyes', subject: 'CE 302', section: 'BSCE-3B', units: 3, schedule: 'TTh 09:00–10:30' },
  { facultyId: 'FAC-002', faculty: 'Engr. Marco Lim', subject: 'EE 301', section: 'BSEE-3A', units: 3, schedule: 'MWF 13:00–14:00' },
];

export const CURRICULUM_SUBJECTS = [
  { code: 'CE 401', title: 'Structural Analysis II', units: 3, program: 'BSCE', year: '4th', semester: '1st' },
  { code: 'CE 302', title: 'Hydraulics', units: 3, program: 'BSCE', year: '3rd', semester: '2nd' },
  { code: 'EE 301', title: 'Power Systems I', units: 3, program: 'BSEE', year: '3rd', semester: '1st' },
];

export const ENROLLMENT_RECORDS = [
  { id: '2024-0001', name: 'Alyssa Cruz', program: 'BSCE', section: 'BSCE-3B', status: 'Enrolled', adviser: 'Engr. Hannah Reyes' },
  { id: '2024-0002', name: 'Nico Ramos', program: 'BSEE', section: 'BSEE-3A', status: 'Enrolled', adviser: 'Engr. Marco Lim' },
  { id: '2024-0003', name: 'Jessa Flores', program: 'BSME', section: 'BSME-2A', status: 'On Hold', adviser: 'Engr. Arianne Dizon' },
];

export const GRADE_SHEETS = [
  { subject: 'CE 401', section: 'BSCE-4A', period: 'Prelim', lastUpdated: 'May 02, 2026', status: 'Submitted' },
  { subject: 'CE 302', section: 'BSCE-3B', period: 'Midterm', lastUpdated: 'May 12, 2026', status: 'Pending' },
  { subject: 'EE 301', section: 'BSEE-3A', period: 'Final', lastUpdated: 'May 15, 2026', status: 'Submitted' },
];
