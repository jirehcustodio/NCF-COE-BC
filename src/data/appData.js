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
      { id: 'mystudents',    icon: 'ti-users',           label: 'My Student List' },
      { id: 'upload',        icon: 'ti-upload',          label: 'Upload Grades' },
      { id: 'mysubmissions', icon: 'ti-clipboard-check', label: 'My Submissions' },
    ],
  },
  {
    sec: 'Blockchain',
    items: [
      { id: 'mychain', icon: 'ti-link',         label: 'My Chain Records' },
      { id: 'verify',  icon: 'ti-shield-check', label: 'Verify Grade' },
    ],
  },
];

export const INITIAL_STUDENTS = [];

export const INITIAL_BLOCKS = [];

export const INITIAL_LOGS = [];

export const INSTRUCTORS_TABLE = [];
