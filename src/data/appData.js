/* ============================================================
   appData.js — Seed data for NCF Blockchain Grade System
   Replace these arrays with real API calls in production.
   ============================================================ */

export const ROLES = {
  admin: {
    name: 'Admin Account',
    role: 'Admin — Account Management',
    av: 'AD',
    type: 'admin',
    color: 'admin',
    dept: null,
    subjects: [],
  },
  dean: {
    name: 'Dean Account',
    role: 'Dean — Academic Oversight',
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
    type: 'instructor',
    color: 'prof',
    dept: '',
    subjects: [],
  },
};

export const ADMIN_NAV = [
  {
    sec: 'Overview',
    items: [
      { id: 'dashboard', icon: 'ti-layout-dashboard', label: 'Dashboard' },
    ],
  },
  {
    sec: 'User Management',
    items: [
      { id: 'instructors', icon: 'ti-user-check', label: 'Faculty Accounts (Create)' },
    ],
  },
  {
    sec: 'Academics',
    items: [
      { id: 'curriculum', icon: 'ti-book', label: 'Curriculum' },
    ],
  },
  {
    sec: 'Security',
    items: [
      { id: 'activitylog', icon: 'ti-shield-alert', label: 'Activity Log & Security' },
    ],
  },
];

export const DEAN_NAV = [
  {
    sec: 'Overview',
    items: [
      { id: 'dashboard', icon: 'ti-layout-dashboard', label: 'Dashboard' },
      { id: 'allgrades',   icon: 'ti-table',             label: 'All Grade Records' },
      { id: 'allstudents', icon: 'ti-users',              label: 'All Student Lists' },
      { id: 'enroll',      icon: 'ti-user-plus',          label: 'Enroll a Student' },
    ],
  },
  {
    sec: 'Academics',
    items: [
      { id: 'facultyrecords', icon: 'ti-id-badge',       label: 'Faculty Records' },
      { id: 'curriculum',     icon: 'ti-book',           label: 'Curriculum' },
      { id: 'siasdocs',       icon: 'ti-file-description', label: 'SIAS Documentation' },
      { id: 'periodical',     icon: 'ti-calendar-stats', label: 'Periodical Grade Recording' },
      { id: 'facultygrades',  icon: 'ti-report',         label: 'Faculty Grade Record' },
    ],
  },
  {
    sec: 'Blockchain',
    items: [
      { id: 'ledger', icon: 'ti-link',         label: 'Blockchain Ledger' },
      { id: 'commits', icon: 'ti-git-commit',  label: 'Committed Blockchain' },
      { id: 'verify', icon: 'ti-shield-check', label: 'Verify Grade' },
    ],
  },
  {
    sec: 'Admin',
    items: [
      { id: 'submissions', icon: 'ti-clipboard-check', label: 'Submissions Log' },
      { id: 'instructors', icon: 'ti-user-check',      label: 'Faculty Accounts' },
      { id: 'activitylog', icon: 'ti-shield-alert',    label: 'Activity Log & Security' },
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
      { id: 'curriculum',    icon: 'ti-book',           label: 'Curriculum' },
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
      { id: 'settings',    icon: 'ti-settings',       label: 'Settings' },
      { id: 'activitylog', icon: 'ti-shield-alert',   label: 'Activity Log & Security' },
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
  { code: 'Math 111', title: 'Calculus 1 (Differential Calculus)', units: 3, program: 'BSCpE', year: '1st', semester: '1st' },
  { code: 'Chem 111', title: 'Chemistry for Engineers', units: 3, program: 'BSCpE', year: '1st', semester: '1st' },
  { code: 'CpE 111', title: 'Computer Engineering as a Discipline', units: 3, program: 'BSCpE', year: '1st', semester: '1st' },
  { code: 'CpE 112', title: 'Programming Logic and Design', units: 3, program: 'BSCpE', year: '1st', semester: '1st' },
  { code: 'GEC 2', title: 'Understanding the Self', units: 3, program: 'BSCpE', year: '1st', semester: '1st' },
  { code: 'GEC 4', title: 'Mathematics for the Modern World', units: 3, program: 'BSCpE', year: '1st', semester: '1st' },
  { code: 'GEC 7', title: 'Science, Technology and Society', units: 3, program: 'BSCpE', year: '1st', semester: '1st' },
  { code: 'PE 1', title: 'Physical Fitness', units: 2, program: 'BSCpE', year: '1st', semester: '1st' },
  { code: 'NSTP 1', title: 'CWTS/ROTC 1', units: 3, program: 'BSCpE', year: '1st', semester: '1st' },
  { code: 'Math 122', title: 'Calculus 2 (Integral Calculus)', units: 3, program: 'BSCpE', year: '1st', semester: '2nd' },
  { code: 'Math 123', title: 'Engineering Data Analysis', units: 3, program: 'BSCpE', year: '1st', semester: '2nd' },
  { code: 'Phys 121', title: 'Physics for Engineers (Calculus-based)', units: 4, program: 'BSCpE', year: '1st', semester: '2nd' },
  { code: 'CpE 121', title: 'Discrete Mathematics', units: 3, program: 'BSCpE', year: '1st', semester: '2nd' },
  { code: 'CpE 122', title: 'Object-Oriented Programming', units: 3, program: 'BSCpE', year: '1st', semester: '2nd' },
  { code: 'GEC 3', title: 'Readings in the Philippine History', units: 3, program: 'BSCpE', year: '1st', semester: '2nd' },
  { code: 'PE 2', title: 'Rhythmic Activities', units: 2, program: 'BSCpE', year: '1st', semester: '2nd' },
  { code: 'NSTP 2', title: 'CWTS/ROTC 2', units: 3, program: 'BSCpE', year: '1st', semester: '2nd' },
  { code: 'Math 213', title: 'Differential Equations', units: 3, program: 'BSCpE', year: '2nd', semester: '1st' },
  { code: 'CpE 211', title: 'Data Structures and Algorithms', units: 2, program: 'BSCpE', year: '2nd', semester: '1st' },
  { code: 'CpE 212', title: 'Computer-Aided Drafting', units: 2, program: 'BSCpE', year: '2nd', semester: '1st' },
  { code: 'CpE 213', title: 'Engineering Economics', units: 3, program: 'BSCpE', year: '2nd', semester: '1st' },
  { code: 'CpE 214', title: 'Fundamentals of Electrical Circuits', units: 4, program: 'BSCpE', year: '2nd', semester: '1st' },
  { code: 'MCR 211', title: 'Life and Works of Rizal', units: 3, program: 'BSCpE', year: '2nd', semester: '1st' },
  { code: 'GEC 1', title: 'Purposive Communication', units: 3, program: 'BSCpE', year: '2nd', semester: '1st' },
  { code: 'GEC 9B', title: 'Living in the Information Technology Era', units: 3, program: 'BSCpE', year: '2nd', semester: '1st' },
  { code: 'PE 3', title: 'Individual and Dual Sports', units: 2, program: 'BSCpE', year: '2nd', semester: '1st' },
  { code: 'CpE 221', title: 'Software Design', units: 4, program: 'BSCpE', year: '2nd', semester: '2nd' },
  { code: 'CpE 222', title: 'Fundamentals of Electronic Circuits', units: 4, program: 'BSCpE', year: '2nd', semester: '2nd' },
  { code: 'CpE 223', title: 'Numerical Methods', units: 3, program: 'BSCpE', year: '2nd', semester: '2nd' },
  { code: 'GEC 6', title: 'Arts Appreciation', units: 3, program: 'BSCpE', year: '2nd', semester: '2nd' },
  { code: 'GEC 10B', title: 'Philippine Popular Culture', units: 3, program: 'BSCpE', year: '2nd', semester: '2nd' },
  { code: 'IRC 221', title: 'NCEAN Development Program', units: 3, program: 'BSCpE', year: '2nd', semester: '2nd' },
  { code: 'PE 4', title: 'Team Sports', units: 2, program: 'BSCpE', year: '2nd', semester: '2nd' },
  { code: 'CpE 311', title: 'Logic Circuits and Design', units: 4, program: 'BSCpE', year: '3rd', semester: '1st' },
  { code: 'CpE 312', title: 'Operating Systems', units: 3, program: 'BSCpE', year: '3rd', semester: '1st' },
  { code: 'CpE 313', title: 'Data and Digital Communications', units: 3, program: 'BSCpE', year: '3rd', semester: '1st' },
  { code: 'CpE 314', title: 'Feedback and Control Systems', units: 3, program: 'BSCpE', year: '3rd', semester: '1st' },
  { code: 'CpE 315', title: 'Fundamentals of Mixed Signals and Sensors', units: 3, program: 'BSCpE', year: '3rd', semester: '1st' },
  { code: 'CpE 316', title: 'Introduction to HDL', units: 1, program: 'BSCpE', year: '3rd', semester: '1st' },
  { code: 'CpE 317', title: 'Computer Engineering Drafting and Design', units: 1, program: 'BSCpE', year: '3rd', semester: '1st' },
  { code: 'CpE 318', title: 'System & Network Administration 1', units: 3, program: 'BSCpE', year: '3rd', semester: '1st' },
  { code: 'CpE 319', title: 'Software Development 1', units: 3, program: 'BSCpE', year: '3rd', semester: '1st' },
  { code: 'CpE 321', title: 'Computer Networks and Security', units: 4, program: 'BSCpE', year: '3rd', semester: '2nd' },
  { code: 'CpE 322', title: 'Microprocessors', units: 4, program: 'BSCpE', year: '3rd', semester: '2nd' },
  { code: 'CpE 323', title: 'CpE Laws and Professional Practice', units: 3, program: 'BSCpE', year: '3rd', semester: '2nd' },
  { code: 'CpE 324', title: 'Basic Occupational Safety and Health', units: 3, program: 'BSCpE', year: '3rd', semester: '2nd' },
  { code: 'CpE 325', title: 'System & Network Administration 2', units: 3, program: 'BSCpE', year: '3rd', semester: '2nd' },
  { code: 'CpE 326', title: 'Software Development 2', units: 3, program: 'BSCpE', year: '3rd', semester: '2nd' },
  { code: 'CpE 327', title: 'Methods of Research', units: 2, program: 'BSCpE', year: '3rd', semester: '2nd' },
  { code: 'GEC 5', title: 'Contemporary World', units: 3, program: 'BSCpE', year: '3rd', semester: '2nd' },
  { code: 'CpE 328', title: 'On-the-Job Training (min. of 240 hrs.)', units: 3, program: 'BSCpE', year: '4th', semester: 'Summer' },
  { code: 'CpE 411', title: 'Embedded Systems', units: 4, program: 'BSCpE', year: '4th', semester: '1st' },
  { code: 'CpE 412', title: 'Computer Architecture and Organization', units: 4, program: 'BSCpE', year: '4th', semester: '1st' },
  { code: 'CpE 413', title: 'Digital Signal Processing', units: 4, program: 'BSCpE', year: '4th', semester: '1st' },
  { code: 'CpE 414', title: 'Emerging Technologies in CpE', units: 3, program: 'BSCpE', year: '4th', semester: '1st' },
  { code: 'CpE 415', title: 'Computer Engineering Practice and Design 1', units: 1, program: 'BSCpE', year: '4th', semester: '1st' },
  { code: 'CpE 416', title: 'System & Network Administration 3', units: 3, program: 'BSCpE', year: '4th', semester: '1st' },
  { code: 'CpE 417', title: 'Environmental Science and Engineering', units: 3, program: 'BSCpE', year: '4th', semester: '1st' },
  { code: 'CpE 421', title: 'Computer Engineering Practice and Design 2', units: 2, program: 'BSCpE', year: '4th', semester: '2nd' },
  { code: 'CpE 422', title: 'Seminars and Fieldtrips', units: 1, program: 'BSCpE', year: '4th', semester: '2nd' },
  { code: 'CpE 423', title: 'Technopreneurship 101', units: 3, program: 'BSCpE', year: '4th', semester: '2nd' },
  { code: 'CpE 424', title: 'Software Development 3', units: 3, program: 'BSCpE', year: '4th', semester: '2nd' },
  { code: 'GEC 8', title: 'Ethics', units: 3, program: 'BSCpE', year: '4th', semester: '2nd' },
  { code: 'IRC 422', title: 'Enhanced Skills in English for Effective Communication', units: 3, program: 'BSCpE', year: '4th', semester: '2nd' },
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
