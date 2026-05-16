/* ============================================================
   App.jsx — Root component
   Manages global state: role, page, students, blocks, logs
   ============================================================ */
import React, { useEffect, useState } from 'react';
import './App.css';
import { ROLES, INITIAL_STUDENTS, INITIAL_BLOCKS, INITIAL_LOGS } from './data/appData';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient';
import {
  fetchBlocks,
  fetchInstructors,
  fetchLogs,
  fetchStudents,
  insertBlock,
  insertLog,
  signInWithPassword,
  signOut,
  signUp,
  upsertStudent,
} from './lib/queries';

import Sidebar       from './components/Sidebar';
import SuccessModal  from './components/SuccessModal';
import Landing       from './components/Landing';

// Dean pages
import Dashboard    from './components/pages/Dashboard';
import AllGrades    from './components/pages/AllGrades';
import AllStudents  from './components/pages/AllStudents';
import Ledger       from './components/pages/Ledger';
import Verify       from './components/pages/Verify';
import Submissions  from './components/pages/Submissions';
import Instructors  from './components/pages/Instructors';

// Instructor pages
import MyStudents   from './components/pages/MyStudents';
import Upload       from './components/pages/Upload';
import { MySubmissions, MyChain } from './components/pages/MySubmissions';

function genHash() {
  return '0x' + Math.random().toString(16).slice(2, 6) + '...' + Math.random().toString(16).slice(2, 6);
}

function nowStr() {
  return new Date().toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [curRole,    setCurRole]    = useState('dean');
  const [activePage, setActivePage] = useState('dashboard');
  const [students,   setStudents]   = useState(INITIAL_STUDENTS);
  const [blocks,     setBlocks]     = useState(INITIAL_BLOCKS);
  const [logs,       setLogs]       = useState(INITIAL_LOGS);
  const [nextBlock,  setNextBlock]  = useState(1049);
  const [modal,      setModal]      = useState(null);
  const [authUser,   setAuthUser]   = useState(null);
  const [authError,  setAuthError]  = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const isDean = ROLES[curRole]?.type === 'dean';
  useEffect(() => {
    if (!showSplash) return () => {};
    const timer = setTimeout(() => setShowSplash(false), 2600);
    const guard = setTimeout(() => setShowSplash(false), 6000);
    return () => {
      clearTimeout(timer);
      clearTimeout(guard);
    };
  }, [showSplash]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthError('Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to .env, then restart the dev server.');
      return () => {};
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const sessionUser = data?.session?.user || null;
      setAuthUser(sessionUser);
      if (sessionUser) {
        const role = sessionUser.user_metadata?.role === 'dean' ? 'dean' : 'instructor';
        setCurRole(role);
        setActivePage(ROLES[role].type === 'dean' ? 'dashboard' : 'mystudents');
        setShowLanding(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user || null;
      setAuthUser(sessionUser);
      if (!sessionUser) {
        setShowLanding(true);
      }
    });

    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authUser || showLanding) return;
    let active = true;

    const loadData = async () => {
      const [studentsRes, blocksRes, logsRes, instructorsRes] = await Promise.all([
        fetchStudents(),
        fetchBlocks(),
        fetchLogs(),
        fetchInstructors(),
      ]);

      if (!active) return;
      const instructorKey = authUser.email;
      const roleType = ROLES[curRole]?.type;

      const normalize = (items) => Array.isArray(items) ? items : [];
      const studentsData = normalize(studentsRes.data);
      const blocksData = normalize(blocksRes.data);
      const logsData = normalize(logsRes.data);

      if (roleType === 'dean') {
        setStudents(studentsData);
        setBlocks(blocksData);
        setLogs(logsData);
      } else {
        setStudents(studentsData.filter(row => row.prof === instructorKey));
        setBlocks(blocksData.filter(row => row.prof === instructorKey));
        setLogs(logsData.filter(row => row.prof === instructorKey));
      }

      setInstructors(normalize(instructorsRes.data));
    };

    loadData();
    return () => {
      active = false;
    };
  }, [authUser, curRole, showLanding]);

  if (showSplash) {
    return (
      <div className="splash" onClick={() => setShowSplash(false)}>
        <div
          className="splash-logo"
          aria-label="NCF College of Engineering logo"
          style={{ backgroundImage: 'url(/logo.png)' }}
        />
        <div className="splash-org">NCF · College of Engineering</div>
        <div className="splash-title">Blockchain Grade</div>
        <div className="splash-title">Recording System</div>
      </div>
    );
  }

  if (showLanding) {
    return (
      <Landing
        onLogin={handleLogin}
        onCreateAccount={handleCreateAccount}
        authError={authError}
        authLoading={authLoading}
      />
    );
  }

  async function handleLogin({ email, password }) {
    setAuthError('');
    setAuthLoading(true);
    const { data, error } = await signInWithPassword({ email, password });
    setAuthLoading(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    const role = data.user?.user_metadata?.role === 'dean' ? 'dean' : 'instructor';
    setCurRole(role);
    setActivePage(ROLES[role].type === 'dean' ? 'dashboard' : 'mystudents');
    setShowLanding(false);
  }

  async function handleCreateAccount({ email, password, role }) {
    setAuthError('');
    setAuthLoading(true);
    const { data, error } = await signUp({ email, password, role });
    setAuthLoading(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    const createdRole = role === 'dean' ? 'dean' : 'instructor';
    setCurRole(createdRole);
    setActivePage(ROLES[createdRole].type === 'dean' ? 'dashboard' : 'mystudents');
    setShowLanding(false);
  }

  async function handleLogout() {
    await signOut();
    setShowLanding(true);
    setAuthUser(null);
  }

  /* ---- Role switching ---- */
  function handleRoleChange(role) {
    if (authUser) return;
    setCurRole(role);
    setActivePage(ROLES[role].type === 'dean' ? 'dashboard' : 'mystudents');
  }

  /* ---- Navigation ---- */
  function handleNavigate(page) {
    setActivePage(page);
  }

  /* ---- Blockchain commit (from Upload page) ---- */
  function handleCommit({ subject, period, gradeValues }) {
    const rd      = ROLES[curRole];
    const hash    = genHash();
    const now     = nowStr();
    const myS     = students.filter(s => s.prof === curRole);
    const subjCode = subject.split('–')[0].trim();

    // Update student grades and statuses
    setStudents(prev => prev.map(s => {
      if (s.prof !== curRole) return s;
      const vals = gradeValues[s.id];
      if (!vals) return s;
      return {
        ...s,
        prelim:  parseInt(vals.prelim)  || s.prelim,
        midterm: parseInt(vals.midterm) || s.midterm,
        semi:    parseInt(vals.semi)    || s.semi,
        final:   parseInt(vals.final)   || s.final,
        status: 'chain',
        uploadMethod: 'Uploaded (committed)',
      };
    }));

    // Add new block
    const newBlock = {
      num: nextBlock, hash,
      prev: blocks[blocks.length - 1]?.hash || '0x0000...0000',
      time: now, prof: authUser?.email || curRole,
      subj: subjCode, period, count: myS.length,
    };
    setBlocks(prev => [...prev, newBlock]);

    // Add log entry
    const newLog = {
      time: now, dot: 'g',
      desc: `${rd.name} committed ${subjCode} ${period} grades (${myS.length} students) — Block #${nextBlock}`,
      prof: authUser?.email || curRole,
    };
    setLogs(prev => [newLog, ...prev]);

    // Show success modal
    setModal({ num: nextBlock, hash, time: now, subj: subjCode, period, count: myS.length, by: rd.name });
    setNextBlock(n => n + 1);

    if (authUser) {
      myS.forEach(student => {
        const vals = gradeValues[student.id];
        if (!vals) return;
        upsertStudent({
          ...student,
          prof: authUser.email,
          prelim: parseInt(vals.prelim) || student.prelim,
          midterm: parseInt(vals.midterm) || student.midterm,
          semi: parseInt(vals.semi) || student.semi,
          final: parseInt(vals.final) || student.final,
          status: 'chain',
          uploadMethod: 'Uploaded (committed)',
        });
      });
      insertBlock(newBlock);
      insertLog(newLog);
    }
  }

  /* ---- Render current page ---- */
  function renderPage() {
  const props = { students, blocks, logs, curRole };

    switch (activePage) {
      // Dean pages
      case 'dashboard':    return isDean ? <Dashboard {...props} /> : <MyStudents {...props} onNavigate={handleNavigate} />;
      case 'allgrades':    return isDean ? <AllGrades {...props} /> : <MyStudents {...props} onNavigate={handleNavigate} />;
      case 'allstudents':  return isDean ? <AllStudents {...props} /> : <MyStudents {...props} onNavigate={handleNavigate} />;
      case 'ledger':       return isDean ? <Ledger {...props} /> : <MyChain {...props} />;
      case 'verify':       return <Verify {...props} />;
      case 'submissions':  return isDean ? <Submissions {...props} /> : <MySubmissions {...props} />;
      case 'instructors':  return isDean ? <Instructors instructors={instructors} /> : <MyStudents {...props} onNavigate={handleNavigate} />;

      // Instructor pages
      case 'mystudents':    return <MyStudents   {...props} onNavigate={handleNavigate} />;
      case 'upload':        return <Upload        {...props} onCommit={handleCommit} />;
      case 'mysubmissions': return <MySubmissions {...props} />;
      case 'mychain':       return <MyChain       {...props} />;

      default: return <Dashboard {...props} />;
    }
  }

  return (
    <div className="layout">
      <Sidebar
        curRole={curRole}
        activePage={activePage}
        onRoleChange={handleRoleChange}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        showRoleSwitcher={!authUser}
      />
      <div className="main">
        {renderPage()}
      </div>
      <SuccessModal
        data={modal}
        onClose={() => setModal(null)}
        onViewLedger={() => { setModal(null); handleNavigate('ledger'); }}
      />
    </div>
  );
}
