/* ============================================================
   App.jsx — Root component
   Manages global state: role, page, students, blocks, logs
   ============================================================ */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import {
  ROLES,
  INITIAL_STUDENTS,
  INITIAL_BLOCKS,
  INITIAL_LOGS,
  FACULTY_RECORDS,
  TEACHING_LOADS,
  CURRICULUM_SUBJECTS,
  ENROLLMENT_RECORDS,
  GRADE_SHEETS,
} from './data/appData';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient';
import {
  fetchBlocks,
  fetchCurriculumSubjects,
  fetchEnrollmentRecords,
  fetchFacultyRecords,
  fetchGradeSheets,
  fetchInstructors,
  fetchLogs,
  fetchStudents,
  fetchTeachingLoads,
  fetchSubjects,
  upsertCurriculumSubjects,
  insertBlock,
  insertLog,
  deleteStudent,
  deleteAllStudents,
  insertSubject,
  insertGradeSheet,
  upsertGradeSheet,
  signInWithPassword,
  signOut,
  signUp,
  requestPasswordReset,
  adminUpdateUserMetadata,
  adminUpdateUserPassword,
  updateUserMetadata,
  fetchUserProfile,
  upsertUserProfile,
  uploadAvatar,
  upsertStudent,
  upsertFacultyRecord,
  deleteFacultyRecord,
  deleteSubject,
  deleteSubjectsByProf,
  deleteStudentsByProf,
} from './lib/queries';

import Sidebar       from './components/Sidebar';
import SuccessModal  from './components/SuccessModal';
import { AccessDenied } from './components/Shared';
import Landing       from './components/Landing';
import Splash        from './components/Splash';
import AdminDashboard from './components/pages/AdminDashboard';
import Onboarding    from './components/Onboarding';
import ProfileModal  from './components/ProfileModal';

// Dean pages
import Dashboard    from './components/pages/Dashboard';
import AllGrades    from './components/pages/AllGrades';
import AllStudents  from './components/pages/AllStudents';
import Ledger       from './components/pages/Ledger';
import Verify       from './components/pages/Verify';
import CommittedBlockchain from './components/pages/CommittedBlockchain';
import Submissions  from './components/pages/Submissions';
import Instructors  from './components/pages/Instructors';
import FacultyRecords from './components/pages/FacultyRecords';
import SiasDocs       from './components/pages/SiasDocs';
import Curriculum     from './components/pages/Curriculum';
import PeriodicalGradeRecording from './components/pages/PeriodicalGradeRecording';
import FacultyGradeRecord from './components/pages/FacultyGradeRecord';
import EnrollStudent from './components/pages/EnrollStudent';
import MySubjects from './components/pages/MySubjects';
import SubjectDetail from './components/pages/SubjectDetail';
import InstructorSettings from './components/pages/InstructorSettings';

// Instructor pages
import MyStudents   from './components/pages/MyStudents';
import Upload       from './components/pages/Upload';
import { MySubmissions, MyChain } from './components/pages/MySubmissions';
import ActivityLog from './components/pages/ActivityLog';

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
  const [splashPhase, setSplashPhase] = useState('enter');
  const [showLanding, setShowLanding] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
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
  const [refreshing, setRefreshing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [facultyRecords, setFacultyRecords] = useState([]);
  const [teachingLoads, setTeachingLoads] = useState([]);
  const [curriculumSubjects, setCurriculumSubjects] = useState([]);
  const [enrollmentRecords, setEnrollmentRecords] = useState([]);
  const [gradeSheets, setGradeSheets] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [loadError, setLoadError] = useState('');
  const isAdmin = ROLES[curRole]?.type === 'admin';
  const isDean = ROLES[curRole]?.type === 'dean';
  const onboardingKey = useMemo(() => (authUser?.id ? `onboarding_seen_${authUser.id}` : ''), [authUser?.id]);
  const [enrollSubject, setEnrollSubject] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');
  const [activeSubject, setActiveSubject] = useState('');
  const isActiveRef = useRef(true);
  const loginRoleRef = useRef(null);

  const programOptions = useMemo(() => {
    const fromCurriculum = curriculumSubjects.map(subject => subject.program).filter(Boolean);
    const defaults = ['BSCE', 'BSCpE', 'BSGE'];
    return Array.from(new Set([...fromCurriculum, ...defaults]));
  }, [curriculumSubjects]);

  const instructorProfile = useMemo(() => {
    if (!authUser?.email) return null;
    return facultyRecords.find(record => record.id === authUser.email) || null;
  }, [facultyRecords, authUser?.email]);
  const needsProfile = !!authUser && ROLES[curRole]?.type === 'instructor' && !instructorProfile;
  const instructorProgram = authUser?.user_metadata?.program || instructorProfile?.dept || '';
  const profileName = userProfile?.name || instructorProfile?.name || authUser?.email || ROLES[curRole]?.name;
  const profileAvatar = userProfile?.avatar_url || authUser?.user_metadata?.avatar_url || '';

  function safeGetStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('Storage read blocked:', error);
      return null;
    }
  }

  function safeSetStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('Storage write blocked:', error);
    }
  }

  function shouldShowOnboarding(user, roleType) {
    if (!user?.id) return false;
    if (roleType && roleType !== 'instructor') return false;
    return !safeGetStorage(`onboarding_seen_${user.id}`);
  }

  function resolveRole(role) {
    const normalized = String(role || '').toLowerCase();
    return ['admin', 'dean', 'instructor'].includes(normalized) ? normalized : 'instructor';
  }

  function getDefaultPage(role) {
    if (role === 'admin') return 'dashboard';
    if (role === 'dean') return 'dashboard';
    return 'mystudents';
  }

  function formatAuthError(error) {
    const message = error?.message || '';
    if (message.toLowerCase().includes('email not confirmed')) {
      return 'Email not confirmed. If confirmation is already disabled, this user was created before the change. Please confirm or delete the user in Supabase → Authentication → Users (or run an update query to set email_confirmed_at), then sign in again.';
    }
    return message;
  }

  const [lastLoggedInUser, setLastLoggedInUser] = useState(null);

  function logDeviceLogin(user) {
    if (!user) return;
    
    // Only log if this is a new login (different from the last logged user)
    // This prevents duplicate logs on page refresh or auth state changes
    if (lastLoggedInUser === user.email || lastLoggedInUser === user.id) {
      return; // Already logged this session
    }
    
    const ua = navigator.userAgent || '';
    
    // Store user email for later use in other components
  safeSetStorage('currentUserEmail', user.email || user.id);
    
    // Track this user as logged in
    setLastLoggedInUser(user.email || user.id);
    
    // Helper: Save audit log to localStorage only
    const saveAuditLog = (log) => {
      // Persist to localStorage (single source of truth)
      try {
        const stored = localStorage.getItem('auditLogs');
        const existing = stored ? JSON.parse(stored) : [];
        // Avoid duplicates by checking within last 2 minutes (120 seconds)
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        const isDuplicate = existing.some(
          l => l.prof === log.prof && 
               l.action === log.action && 
               l.time > twoMinutesAgo
        );
        if (!isDuplicate) {
          existing.push(log);
          localStorage.setItem('auditLogs', JSON.stringify(existing));
        }
      } catch (e) {
        console.error('Failed to save audit log to storage:', e);
      }
    };
    
    // Fetch client IP from a public API
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        const newAuditLog = {
          prof: user.email || user.id,
          user: user.email || user.id,
          userAgent: ua,
          action: 'Login',
          time: new Date().toISOString(),
          ipAddress: data.ip || 'Unable to fetch IP',
          device: 'Browser Session',
        };
        saveAuditLog(newAuditLog);
      })
      .catch(() => {
        const newAuditLog = {
          prof: user.email || user.id,
          user: user.email || user.id,
          userAgent: ua,
          action: 'Login',
          time: new Date().toISOString(),
          ipAddress: 'IP detection unavailable',
          device: 'Browser Session',
        };
        saveAuditLog(newAuditLog);
      })
      .catch(err => {
        console.warn('Failed to fetch IP address:', err);
        saveAuditLog({
          prof: user.email || user.id,
          user: user.email || user.id,
          userAgent: ua,
          action: 'Login',
          time: new Date().toISOString(),
          desc: `User ${user.email || user.id} logged in`,
          ipAddress: 'IP unavailable',
          device: 'Browser Session',
        });
      });
  }

  function logAuditActivity(auditLog) {
    if (!auditLog) return;

    try {
      const stored = localStorage.getItem('auditLogs');
      const existing = stored ? JSON.parse(stored) : [];
      // Create a unique key for this log entry
      const logKey = `${auditLog.prof}-${auditLog.action}-${auditLog.time}`;
      // Check if this exact log already exists
      const isDuplicate = existing.some(l => {
        const existingKey = `${l.prof}-${l.action}-${l.time}`;
        return existingKey === logKey;
      });
      if (!isDuplicate) {
        existing.push(auditLog);
        localStorage.setItem('auditLogs', JSON.stringify(existing));
      }
    } catch (e) {
      console.error('Failed to save audit log to localStorage:', e);
    }
  }

  function logEnrollmentActivity(enrollmentLog) {
    logAuditActivity(enrollmentLog);
  }
  
  useEffect(() => {
    if (!showSplash) return () => {};
    setSplashPhase('enter');
    const fadeTimer = setTimeout(() => setSplashPhase('exit'), 1800);
    const timer = setTimeout(() => setShowSplash(false), 2600);
    const guard = setTimeout(() => setShowSplash(false), 6000);
    return () => {
      clearTimeout(fadeTimer);
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
        const role = resolveRole(sessionUser.user_metadata?.role);
        setCurRole(role);
        setActivePage(getDefaultPage(role));
        setShowLanding(false);
        setShowOnboarding(shouldShowOnboarding(sessionUser, role));
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user || null;
      if (sessionUser) {
        const role = resolveRole(sessionUser.user_metadata?.role);
        if (loginRoleRef.current && role !== loginRoleRef.current) {
          await signOut();
          loginRoleRef.current = null;
          setAuthUser(null);
          setShowLanding(true);
          setAuthError(`This account is registered as ${role}. Please sign in using the ${role} role.`);
          return;
        }
        loginRoleRef.current = null;
        setAuthUser(sessionUser);
        setCurRole(role);
        setActivePage(getDefaultPage(role));
        setShowLanding(false);
        setShowOnboarding(shouldShowOnboarding(sessionUser, role));
        logDeviceLogin(sessionUser);
      } else {
        setAuthUser(null);
        setShowLanding(true);
        setShowOnboarding(false);
      }
    });

    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!authUser || showLanding) return;
    setLoadError('');
    try {
      const [
        studentsRes,
        blocksRes,
        logsRes,
        instructorsRes,
        facultyRes,
        loadsRes,
        curriculumRes,
        enrollmentRes,
        gradeSheetsRes,
        subjectsRes,
        profileRes,
      ] = await Promise.all([
        fetchStudents(),
        fetchBlocks(),
        fetchLogs(),
        fetchInstructors(),
        fetchFacultyRecords(),
        fetchTeachingLoads(),
        fetchCurriculumSubjects(),
        fetchEnrollmentRecords(),
        fetchGradeSheets(),
        fetchSubjects(),
        fetchUserProfile(authUser.email),
      ]);

      if (!isActiveRef.current) return;
      const instructorKey = authUser.email;
      const roleType = ROLES[curRole]?.type;

      const normalize = (items) => Array.isArray(items) ? items : [];
  const studentsData = normalize(studentsRes.data).map(row => ({
    ...row,
    uploadMethod: row.upload_method,
  }));
  const blocksData = normalize(blocksRes.data);
  const logsData = normalize(logsRes.data);
  const subjectsData = normalize(subjectsRes.data);

      // Keep an unfiltered copy of subjects for pages that need to show all subjects
      setAllSubjects(subjectsData);
      const canViewAll = roleType === 'dean' || roleType === 'admin';
      if (canViewAll) {
        setStudents(studentsData);
        setBlocks(blocksData);
        setLogs(logsData);
        setSubjects(subjectsData);
      } else {
        setStudents(studentsData.filter(row => row.prof === instructorKey));
        setBlocks(blocksData.filter(row => row.prof === instructorKey));
        setLogs(logsData.filter(row => row.prof === instructorKey));
        setSubjects(subjectsData.filter(row => row.prof === instructorKey));
      }

      // Calculate next block number from highest existing block
      // This ensures block numbers always increment correctly and persist on refresh
      if (blocksData && blocksData.length > 0) {
        const blockNumbers = blocksData.map(b => Number(b.num) || 0).filter(n => n > 0);
        const maxBlockNum = Math.max(...blockNumbers);
        setNextBlock(maxBlockNum + 1);
      } else {
        setNextBlock(1);
      }

      const fallback = (data) => (Array.isArray(data) ? data : []);
      const facultyData = fallback(facultyRes.data);
      const instructorData = fallback(instructorsRes.data);
      setInstructors(instructorData.length ? instructorData : facultyData);
      setFacultyRecords(facultyData);
      setTeachingLoads(fallback(loadsRes.data));
      setCurriculumSubjects(fallback(curriculumRes.data));
      setEnrollmentRecords(fallback(enrollmentRes.data));
      setGradeSheets(fallback(gradeSheetsRes.data));
      setUserProfile(profileRes?.data || null);
      if (authUser && ROLES[curRole]?.type === 'instructor') {
        const profile = facultyData.find(record => record.id === authUser.email);
        if (profile?.status === 'Inactive') {
          setAuthError('Your account is deactivated. Please contact the administrator.');
          await handleLogout();
          return;
        }
        if (!profile) setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setLoadError(error?.message || 'Failed to load data after login. Please try again.');
    }
  }, [authUser, curRole, showLanding, showOnboarding]);

  useEffect(() => {
    isActiveRef.current = true;
    loadData();
    
    // Auto-refresh for Admin/Dean users every 30 seconds to sync instructor submissions
    let refreshInterval;
    if (ROLES[curRole]?.type === 'dean' || ROLES[curRole]?.type === 'admin') {
      refreshInterval = setInterval(async () => {
        if (isActiveRef.current && authUser && !showLanding) {
          try {
            const [
              studentsRes,
              blocksRes,
              logsRes,
            ] = await Promise.all([
              fetchStudents(),
              fetchBlocks(),
              fetchLogs(),
            ]);

            if (!isActiveRef.current) return;

            const normalize = (items) => Array.isArray(items) ? items : [];
            const studentsData = normalize(studentsRes.data).map(row => ({
              ...row,
              uploadMethod: row.upload_method,
            }));
            const blocksData = normalize(blocksRes.data);
            const logsData = normalize(logsRes.data);

            // Update state with fresh data from database
            setStudents(studentsData);
            setBlocks(blocksData);
            setLogs(logsData);

            // Recalculate nextBlock from latest blocks
            if (blocksData && blocksData.length > 0) {
              const blockNumbers = blocksData.map(b => Number(b.num) || 0).filter(n => n > 0);
              const maxBlockNum = Math.max(...blockNumbers);
              setNextBlock(maxBlockNum + 1);
            }
          } catch (err) {
            console.warn('Auto-refresh failed:', err);
          }
        }
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      isActiveRef.current = false;
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [loadData, authUser, curRole, showLanding, showOnboarding]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  if (showSplash) {
    return (
      <div
        className={`splash ${splashPhase === 'exit' ? 'fade-out' : 'fade-in'}`}
        onClick={() => {
          setSplashPhase('exit');
          setTimeout(() => setShowSplash(false), 350);
        }}
      >
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
        authError={authError}
        authLoading={authLoading}
      />
    );
  }

  if (showOnboarding && authUser) {
    return (
      <Onboarding
        roleType={ROLES[curRole]?.type}
        requireProfile={needsProfile}
        profileSaving={profileSaving}
        profileDefaults={{ name: instructorProfile?.name || '' }}
        onSaveProfile={async ({ name }) => {
          if (!authUser?.email) return;
          setProfileSaving(true);
          const payload = {
            id: authUser.email,
            name,
            rank: 'Instructor',
            status: 'Active',
          };
          await upsertFacultyRecord(payload);
          setFacultyRecords(prev => {
            const exists = prev.find(record => record.id === payload.id);
            if (exists) {
              return prev.map(record => (record.id === payload.id ? { ...record, ...payload } : record));
            }
            return [...prev, payload];
          });
          setProfileSaving(false);
        }}
        onFinish={() => {
          if (onboardingKey) safeSetStorage(onboardingKey, 'true');
          setShowOnboarding(false);
        }}
        onSkip={() => {
          if (onboardingKey) safeSetStorage(onboardingKey, 'true');
          setShowOnboarding(false);
        }}
      />
    );
  }

  if (loadError) {
    return (
      <div className="landing">
        <div className="landing-card">
          <div className="landing-brand">
            <div className="landing-logo" style={{ backgroundImage: 'url(/logo.png)' }} />
            <div className="landing-org">NCF · College of Engineering</div>
            <div className="landing-title">Blockchain Grade Recording System</div>
          </div>
          <div className="landing-error">{loadError}</div>
          <div className="landing-actions">
            <button className="btn pri" onClick={handleRefresh}>Retry</button>
            <button className="btn" onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  async function handleLogin({ email, password, role: requestedRole }) {
    setAuthError('');
    setAuthLoading(true);
    loginRoleRef.current = requestedRole || null;
    const { data, error } = await signInWithPassword({ email, password });
    setAuthLoading(false);
    if (error) {
      loginRoleRef.current = null;
      setAuthError(formatAuthError(error));
      return;
    }
    const user = data.user || null;
    const role = resolveRole(user?.user_metadata?.role);
    if (requestedRole && role !== requestedRole) {
      await signOut();
      loginRoleRef.current = null;
      setAuthUser(null);
      setShowLanding(true);
      setAuthError(`This account is registered as ${role}. Please sign in using the ${role} role.`);
      return;
    }
    loginRoleRef.current = null;
    setAuthUser(user);
    setCurRole(role);
    setActivePage(getDefaultPage(role));
    setShowLanding(false);
    setShowOnboarding(shouldShowOnboarding(user, role));
  }

  async function handleCreateAccount({ email, password, role, name, status }) {
    setAuthError('');
    setAuthLoading(true);
    const { data, error } = await signUp({ email, password, role });
    setAuthLoading(false);
    if (error) {
      return { error: formatAuthError(error) };
    }
    if (name || status) {
      const payload = {
        id: email,
        name: name || email,
        dept: 'General',
        rank: role === 'dean' ? 'Dean' : 'Instructor',
        status: status || 'Active',
      };
      await upsertFacultyRecord(payload);
      setFacultyRecords(prev => {
        const exists = prev.find(record => record.id === payload.id);
        if (exists) {
          return prev.map(record => (record.id === payload.id ? { ...record, ...payload } : record));
        }
        return [...prev, payload];
      });
    }
    const actor = authUser?.email || authUser?.id || 'system';
    logAuditActivity({
      prof: actor,
      user: actor,
      userAgent: navigator.userAgent,
      action: 'Account Created',
      time: new Date().toISOString(),
      desc: `Created ${role} account for ${email}`,
      ipAddress: 'IP detection in audit trail',
      device: 'Browser Session',
    });
    if (data?.session?.user) {
      await signOut();
      setShowLanding(true);
      setAuthUser(null);
      return { warning: 'Account created, but the session switched. Please sign in again as admin.' };
    }
    return { ok: true };
  }

  async function handleUpdateInstructorRole({ email, role }) {
    if (!email) return { error: 'Email is required.' };
    if (!role) return { error: 'Role is required.' };
    const { data, error } = await adminUpdateUserMetadata({
      email,
      metadata: { role },
    });
    if (error) {
      return { error: error.message || 'Failed to update role.' };
    }
    return { ok: true, user: data?.user };
  }

  async function handleResetInstructorPassword(email, newPassword) {
    if (!email) return { error: 'Email is required.' };
    if (!newPassword || newPassword.length < 8) {
      return { error: 'Password must be at least 8 characters.' };
    }
    const { error } = await adminUpdateUserPassword({ email, password: newPassword });
    if (error) {
      return { error: error.message || 'Failed to update password.' };
    }
    return { ok: true };
  }

  async function handleLogout() {
    await signOut();
    setShowLanding(true);
    setShowOnboarding(false);
    setAuthUser(null);
  }

  /* ---- Navigation ---- */
  async function handleNavigate(page) {
    setActivePage(page);
    if (!authUser || showLanding) return;
    if (['ledger', 'committed', 'allgrades', 'mychain', 'activitylog', 'mysubmissions'].includes(page)) {
      await loadData();
    }
  }

  /* ---- Blockchain commit (from Upload page) ---- */
  async function handleCommit({ subject, period, gradeValues }) {
    const rd      = ROLES[curRole];
    const hash    = genHash();
    const now     = nowStr();
    const profKey = authUser?.email || curRole;
    const subjCode = subject.split('–')[0].trim();
    
    // Count students with actual grades being committed
    const gradeEntries = Object.entries(gradeValues).filter(([id, vals]) => {
      return vals && (vals.prelim !== null || vals.midterm !== null || vals.semi !== null || vals.final !== null);
    });
    const gradesCount = gradeEntries.length;

    // Update student grades and statuses
    setStudents(prev => prev.map(s => {
      if (s.prof !== profKey) return s;
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

    // Add new block with correct count of students with grades
    const newBlock = {
      num: nextBlock, hash,
      prev: blocks.length > 0 ? blocks[blocks.length - 1]?.hash : '0x0000...0000',
      time: now, prof: profKey,
      subj: subjCode, period, count: gradesCount,
      status: 'committed',
    };
    setBlocks(prev => [...prev, newBlock]);

    // Add log entry
    const newLog = {
      time: now, dot: 'g',
      desc: `${rd.name} committed ${subjCode} ${period} grades (${gradesCount} students) — Block #${nextBlock}`,
      prof: profKey,
    };
    setLogs(prev => [newLog, ...prev]);
    logAuditActivity({
      prof: profKey,
      user: profKey,
      userAgent: navigator.userAgent,
      action: 'Commit',
      time: new Date().toISOString(),
      desc: newLog.desc,
      ipAddress: 'IP detection in audit trail',
      device: 'Browser Session',
    });

    const sheetKey = `${subjCode}-${period}`;
    setGradeSheets(prev => {
      const exists = prev.find(sheet => `${sheet.subject}-${sheet.period}` === sheetKey);
      const updated = {
        subject: subjCode,
        section: '—',
        period,
        lastUpdated: now,
        status: 'Submitted',
      };
      if (exists) {
        return prev.map(sheet => (`${sheet.subject}-${sheet.period}` === sheetKey ? { ...sheet, ...updated } : sheet));
      }
      return [...prev, updated];
    });

  // NOTE: Do not show success modal or advance nextBlock yet — wait until persistence completes.

    if (authUser) {
      try {
        // Update all students with their grades. If any upsert fails, throw so the whole commit aborts.
        // Helper to parse grade safely (0 is a valid grade)
        const parseGrade = (val) => {
          const parsed = parseInt(val, 10);
          return Number.isFinite(parsed) ? parsed : null;
        };
        
        await Promise.all(Object.entries(gradeValues).map(async ([studentId, vals]) => {
          if (!vals) return Promise.resolve();
          const student = students.find(s => s.id === studentId && s.prof === authUser.email);
          if (!student) return Promise.resolve();
          const { uploadMethod, program, dept, ...studentData } = student;
          const res = await upsertStudent({
            ...studentData,
            prof: authUser.email,
            prelim: parseGrade(vals.prelim) ?? student.prelim,
            midterm: parseGrade(vals.midterm) ?? student.midterm,
            semi: parseGrade(vals.semi) ?? student.semi,
            final: parseGrade(vals.final) ?? student.final,
            status: 'chain',
            upload_method: 'Uploaded (committed)',
          });
          if (res?.error) throw res.error;
          return res;
        }));

        // Insert block
        const { error: blockError } = await insertBlock(newBlock);
        if (blockError) throw blockError;

        // Insert log
        const { error: logError } = await insertLog(newLog);
        if (logError) throw logError;

        // Upsert grade sheet
        const { error: sheetError } = await upsertGradeSheet({
          subject: subjCode,
          section: '—',
          period,
          last_updated: now,
          status: 'Submitted',
        });
        if (sheetError) throw sheetError;

        // Refresh blocks from database to ensure they're persisted
        const { data: refreshedBlocks } = await fetchBlocks();
        if (refreshedBlocks && isActiveRef.current) {
          const blocksArray = Array.isArray(refreshedBlocks) ? refreshedBlocks : [];
          setBlocks(blocksArray);
          
          // Recalculate nextBlock from refreshed blocks
          // This ensures block numbers are always consistent with database
          if (blocksArray.length > 0) {
            const blockNumbers = blocksArray.map(b => Number(b.num) || 0).filter(n => n > 0);
            const maxBlockNum = Math.max(...blockNumbers);
            // Now that persistence is confirmed, set nextBlock accordingly and show success modal
            setNextBlock(maxBlockNum + 1);
            setModal({ num: maxBlockNum, hash, time: now, subj: subjCode, period, count: gradesCount, by: rd.name });
            // Note: modal shows the block that was just created (maxBlockNum)
          }
        }

        // Refresh students to show committed grades in My Students list
        const { data: refreshedStudents } = await fetchStudents();
        if (refreshedStudents && isActiveRef.current) {
          setStudents(Array.isArray(refreshedStudents) ? refreshedStudents : []);
        }
      } catch (error) {
        console.error('Failed to persist blockchain commit:', error);
        setModal(null); // Close any success modal if error occurs
        const errorMsg = error?.message || error?.toString() || 'Failed to persist grades. Please try again.';
        throw new Error(errorMsg); // Throw so Upload component can catch and display error
      }

      // Refresh logs for dean/admin to see the latest commits
      if (isActiveRef.current && (ROLES[curRole]?.type === 'dean' || ROLES[curRole]?.type === 'admin')) {
        try {
          const { data: refreshedLogs } = await fetchLogs();
          if (refreshedLogs && isActiveRef.current) {
            setLogs(Array.isArray(refreshedLogs) ? refreshedLogs : []);
          }
        } catch (err) {
          console.warn('Failed to refresh logs:', err);
        }
      }
    }
  }

  async function handleEnroll({ students: studentsToEnroll, subject }) {
    const prof = authUser?.email || curRole;
    const normalizeName = (value) => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const subjectKey = String(subject || '').toLowerCase();
    const existing = new Set(
      students
        .filter(student => String(student.subj || '').toLowerCase() === subjectKey)
        .map(student => student.id || normalizeName(student.name)),
    );

    const uniqueStudents = studentsToEnroll.filter(student => {
      const key = student.id || normalizeName(student.name);
      if (!key) return false;
      if (existing.has(key)) return false;
      existing.add(key);
      return true;
    });

    if (!uniqueStudents.length) {
      return { added: 0, skipped: studentsToEnroll.length };
    }

    setStudents(prev => [
      ...prev,
      ...uniqueStudents.map(student => ({
        id: student.id,
        name: student.name,
        subj: subject,
        prof,
        prelim: null,
        midterm: null,
        semi: null,
        final: null,
        status: 'ok',
        upload_method: 'Enrolled',
      })),
    ]);

    if (authUser) {
      // Ensure subject exists in subjects table (same as My Subjects tab)
      if (!subjects.some(s => s.code === subject && s.prof === authUser.email)) {
        const currSubject = curriculumSubjects.find(cs => cs.code === subject);
        insertSubject({ 
          code: subject, 
          prof: authUser.email, 
          title: currSubject?.title || '' 
        });
        // Add to local state to reflect immediately
        setSubjects(prev => [...prev, { 
          code: subject, 
          prof: authUser.email, 
          title: currSubject?.title || '',
          year: currSubject?.year || '',
          semester: currSubject?.semester || '',
        }]);
      }

      // Wait for ALL student upserts to complete before proceeding
      try {
        await Promise.all(uniqueStudents.map(student =>
          upsertStudent({
            id: student.id,
            name: student.name,
            subj: subject,
            prof: authUser.email,
            prelim: null,
            midterm: null,
            semi: null,
            final: null,
            status: 'ok',
            upload_method: 'Enrolled',
          })
        ));
      } catch (err) {
        console.error('Failed to upsert students during enrollment:', err);
        throw err;
      }

      // Wait a bit for database to settle before fetching
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Refresh students to ensure enrollment is persisted
      try {
        const { data: refreshedStudents } = await fetchStudents();
        if (refreshedStudents && isActiveRef.current) {
          const studentsData = Array.isArray(refreshedStudents) ? refreshedStudents : [];
          const instructorKey = authUser.email;
          const roleType = ROLES[curRole]?.type;
          const canViewAll = roleType === 'dean' || roleType === 'admin';
          
          if (canViewAll) {
            setStudents(studentsData);
          } else {
            const filtered = studentsData.filter(row => row.prof === instructorKey);
            setStudents(filtered);
          }
        }
      } catch (err) {
        console.warn('Failed to refresh students after enrollment:', err);
      }
    }
    return { added: uniqueStudents.length, skipped: studentsToEnroll.length - uniqueStudents.length };
  }

  async function handleDeleteStudent(student) {
    const shouldScopeToProf = ROLES[curRole]?.type === 'instructor';
    setStudents(prev => prev.filter(s => !(s.id === student.id && s.subj === student.subj && s.prof === student.prof)));
    if (authUser) {
      await deleteStudent({
        id: student.id,
        subject: student.subj,
        prof: shouldScopeToProf ? authUser.email : undefined,
      });
    }
  }

  async function handleClearStudents() {
    setStudents([]);
    if (authUser) {
      await deleteAllStudents();
    }
  }

  async function handleDeleteInstructor(instructor) {
    const id = instructor.id || instructor.email;
    if (!id) return;
    const profSubjects = subjects.filter(item => item.prof === id).map(item => item.code);
    setFacultyRecords(prev => prev.filter(record => record.id !== id));
    setInstructors(prev => prev.filter(record => record.id !== id && record.email !== id));
    setStudents(prev => prev.filter(student => student.prof !== id));
    setSubjects(prev => prev.filter(item => item.prof !== id));
    setBlocks(prev => prev.filter(block => block.prof !== id));
    setLogs(prev => prev.filter(log => log.prof !== id));
    if (profSubjects.length) {
      setGradeSheets(prev => prev.filter(sheet => !profSubjects.includes(sheet.subject)));
    }

    if (authUser) {
      await deleteStudentsByProf(id);
      await deleteSubjectsByProf(id);
      await deleteFacultyRecord(id);
    }
  }

  function handleCreateSubject(subject) {
    const normalized = String(subject || '').trim();
    if (!normalized) return;
    const prof = authUser?.email || curRole;
    if (subjects.some(item => item.code === normalized && item.prof === prof)) return;
    
    // Find the curriculum subject to get title, year, semester
    const currSubject = curriculumSubjects.find(cs => cs.code === normalized);
    const newSubject = { 
      code: normalized, 
      prof,
      title: currSubject?.title || '',
      year: currSubject?.year || '',
      semester: currSubject?.semester || '',
    };
    
    setSubjects(prev => [...prev, newSubject]);
    const defaultPeriods = ['Prelim', 'Midterm', 'Semi-Final', 'Final'];
    setGradeSheets(prev => {
      const updates = defaultPeriods
        .filter(period => !prev.find(sheet => sheet.subject === normalized && sheet.period === period))
        .map(period => ({
          subject: normalized,
          section: 'TBA',
          period,
          lastUpdated: null,
          status: 'Pending',
        }));
      return updates.length ? [...prev, ...updates] : prev;
    });
    if (authUser) {
      // Save subject to database
      insertSubject({ code: normalized, prof: authUser.email, title: currSubject?.title || '' }).catch(err => 
        console.warn('Failed to save subject to database:', err)
      );
      // Save grade sheets to database
      defaultPeriods.forEach(period => {
        insertGradeSheet({
          subject: normalized,
          section: 'TBA',
          period,
          last_updated: null,
          status: 'Pending',
        }).catch(err => console.warn('Failed to save grade sheet to database:', err));
      });
    }
  }

  async function handleDeleteSubject(subjectId, subjectCode) {
    if (!subjectCode) return;
    try {
      const prof = authUser?.email || curRole;
      // Delete by code and prof instead of ID
      const result = await deleteSubject({ code: subjectCode, prof });
      if (result?.error) {
        console.error('Delete subject error from DB:', result.error);
        return;
      }
      // Update local state
      setSubjects(prev => prev.filter(s => !(s.code === subjectCode && s.prof === prof)));
      setStudents(prev => prev.filter(s => s.subj !== subjectCode));
    } catch (err) {
      console.error('Delete subject exception:', err);
    }
  }

  async function handleDeleteStudent(studentId, subjectCode) {
    if (!studentId || !subjectCode) return;
    try {
      const prof = authUser?.email || curRole;
      const result = await deleteStudent({ id: studentId, subject: subjectCode, prof });
      if (result?.error) {
        console.error('Delete student error from DB:', result.error);
        return;
      }
      // Update local state
      setStudents(prev => prev.filter(s => !(s.id === studentId && s.subj === subjectCode)));
    } catch (err) {
      console.error('Delete student exception:', err);
    }
  }

  async function handleSavePeriodicalGrades({ periodKey, updates }) {
    if (!periodKey || !updates?.length) return;
    const now = new Date().toISOString();
    const nowLabel = nowStr();
    const prof = authUser?.email || curRole;
    const rd = ROLES[curRole];
    const subject = updates[0]?.subj || 'Subject';
    const periodLabel = periodKey === 'semi'
      ? 'Semi-Final'
      : `${periodKey.charAt(0).toUpperCase()}${periodKey.slice(1)}`;

    setStudents(prev => prev.map(student => {
      const update = updates.find(row => row.id === student.id && row.subj === student.subj);
      if (!update) return student;
      return {
        ...student,
        [periodKey]: update.grade,
        encoded_at: now,
        status: update.status || student.status || 'ok',
      };
    }));

    const newLog = {
      time: nowLabel,
      dot: 'g',
      desc: `${rd.name} saved ${subject} ${periodLabel} period grades (${updates.length} students)`,
      prof,
    };
    setLogs(prev => [newLog, ...prev]);

    if (authUser) {
      try {
        // Save all student grade updates to database
        await Promise.all(updates.map(update =>
          upsertStudent({
            id: update.id,
            name: update.name,
            subj: update.subj,
            prof,
            prelim: update.prelim ?? null,
            midterm: update.midterm ?? null,
            semi: update.semi ?? null,
            final: update.final ?? null,
            status: update.status || 'ok',
            upload_method: update.upload_method ?? 'Periodical',
            encoded_at: now,
            [periodKey]: update.grade,
          })
        ));

        // Save log entry to database
        await insertLog(newLog);

        // Refresh students from database to confirm persistence
        if (isActiveRef.current) {
          const { data: refreshedStudents } = await fetchStudents();
          if (refreshedStudents && isActiveRef.current) {
            const studentsData = Array.isArray(refreshedStudents) ? refreshedStudents : [];
            const instructorKey = authUser.email;
            const roleType = ROLES[curRole]?.type;
            const canViewAll = roleType === 'dean' || roleType === 'admin';
            if (canViewAll) {
              setStudents(studentsData);
            } else {
              setStudents(studentsData.filter(row => row.prof === instructorKey));
            }
          }
        }

        // Refresh grade sheets and logs for dean/admin
        if (isActiveRef.current && (ROLES[curRole]?.type === 'dean' || ROLES[curRole]?.type === 'admin')) {
          try {
            const [sheetsRes, logsRes] = await Promise.all([
              fetchGradeSheets(),
              fetchLogs(),
            ]);
            if (sheetsRes?.data && isActiveRef.current) {
              setGradeSheets(Array.isArray(sheetsRes.data) ? sheetsRes.data : []);
            }
            if (logsRes?.data && isActiveRef.current) {
              setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
            }
          } catch (err) {
            console.warn('Failed to refresh grade sheets/logs:', err);
          }
        }
      } catch (err) {
        console.error('Failed to save periodical grades:', err);
        throw err;
      }
    }
    return nowLabel;
  }

  async function handleImportCurriculum(rows) {
    if (!rows?.length) return { added: 0 };
    const normalized = rows
      .filter(row => row.code && row.title)
      .map(row => ({
        code: String(row.code).trim(),
        title: String(row.title).trim(),
        units: row.units === '' || row.units === null || row.units === undefined ? null : Number(row.units),
        program: row.program ? String(row.program).trim() : null,
        year: row.year ? String(row.year).trim() : null,
        semester: row.semester ? String(row.semester).trim() : null,
      }));

    if (!normalized.length) return { added: 0 };

    setCurriculumSubjects(prev => {
      const map = new Map(prev.map(item => [item.code, item]));
      normalized.forEach(item => {
        map.set(item.code, { ...map.get(item.code), ...item });
      });
      return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
    });

    if (authUser) {
      await upsertCurriculumSubjects(normalized);
    }

    return { added: normalized.length };
  }

  /* ---- Render current page ---- */
  function renderPage() {
  const profKey = authUser?.email || curRole;
  const props = { students, blocks, logs, subjects, gradeSheets, curriculumSubjects, curRole, profKey, program: instructorProgram, onRefresh: handleRefresh, refreshing };
  const academicProps = {
    facultyRecords,
    teachingLoads,
    curriculumSubjects,
    enrollmentRecords,
    gradeSheets,
  };
  const canViewDean = isDean;
  const canViewAdmin = isAdmin || isDean;

    switch (activePage) {
      // Dean pages
      case 'admindashboard': return isAdmin ? (
        <AdminDashboard
          facultyRecords={facultyRecords}
          blocks={blocks}
          logs={logs}
          onNavigate={handleNavigate}
        />
      ) : (
        <AccessDenied message="Admin access required." />
      );
      case 'dashboard':    return (canViewDean || isAdmin) ? (
        <Dashboard
          {...props}
          facultyRecords={facultyRecords}
          gradeSheets={gradeSheets}
          onClearStudents={handleClearStudents}
        />
      ) : (
        <AccessDenied message="Dean access required." />
      );
  case 'allgrades':    return (canViewDean || isAdmin) ? <AllGrades {...props} facultyRecords={facultyRecords} blocks={blocks} /> : (
        <AccessDenied message="Admin/Dean access required." />
      );
      case 'allstudents':  return (canViewDean || isAdmin) ? (
        <AllStudents
          {...props}
          logs={logs}
          onDeleteStudent={handleDeleteStudent}
        />
      ) : (
        <AccessDenied message="Admin/Dean access required." />
      );
      case 'ledger':       return canViewDean ? <Ledger {...props} /> : <MyChain {...props} />;
      case 'commits':      return (canViewDean || isAdmin) ? (
        <CommittedBlockchain blocks={blocks} facultyRecords={facultyRecords} curRole={curRole} />
      ) : (
        <AccessDenied message="Admin/Dean access required." />
      );
      case 'verify':       return <Verify {...props} />;
      case 'submissions':  return canViewDean ? <Submissions {...props} /> : <MySubmissions {...props} />;
      case 'instructors':  return canViewAdmin ? (
        <Instructors
          instructors={instructors}
          facultyRecords={facultyRecords}
          students={students}
          subjects={subjects}
          blocks={blocks}
          logs={logs}
          onDeleteInstructor={handleDeleteInstructor}
          onCreateInstructor={handleCreateAccount}
          onResetInstructorPassword={handleResetInstructorPassword}
          onUpdateInstructorRole={handleUpdateInstructorRole}
          onToggleInstructorStatus={(row) => {
            const status = row.recordStatus === 'Inactive' ? 'Active' : 'Inactive';
            const payload = {
              id: row.id,
              name: row.name || row.id,
              dept: row.dept || '',
              rank: 'Instructor',
              status,
            };
            upsertFacultyRecord(payload);
            setFacultyRecords(prev => prev.map(record => (record.id === row.id ? { ...record, status } : record)));
          }}
          allowCreate
        />
      ) : (
        <AccessDenied message="Admin access required." />
      );
      case 'facultyrecords': return canViewDean
        ? <FacultyRecords {...academicProps} />
        : <AccessDenied message="Dean access required." />;
      case 'siasdocs':       return canViewDean
        ? <SiasDocs {...academicProps} />
        : <AccessDenied message="Dean access required." />;
      case 'curriculum':     return (canViewDean || isAdmin || ROLES[curRole]?.type === 'instructor')
        ? <Curriculum
            curriculumSubjects={curriculumSubjects}
            onImportCurriculum={handleImportCurriculum}
            allowImport={canViewDean || isAdmin}
          />
        : <AccessDenied message="Dean access required." />;
      case 'periodical':     return canViewDean
        ? <PeriodicalGradeRecording {...props} profKey={profKey} isDeanView onSavePeriodicalGrades={handleSavePeriodicalGrades} />
        : <PeriodicalGradeRecording {...props} profKey={profKey} onSavePeriodicalGrades={handleSavePeriodicalGrades} />;
      case 'facultygrades':  return canViewDean
        ? <FacultyGradeRecord {...props} profKey={profKey} isDeanView />
        : <FacultyGradeRecord {...props} profKey={profKey} />;
      case 'enroll':         return (
        <EnrollStudent
          curRole={curRole}
          students={students}
          subjects={allSubjects}
          curriculumSubjects={curriculumSubjects}
          program={instructorProgram}
          initialSubject={enrollSubject}
          onEnroll={handleEnroll}
          onEnrollmentLogged={logEnrollmentActivity}
        />
      );

      // Instructor pages
      case 'subjects':      return (
        <MySubjects
          {...props}
          subjects={subjects}
          curriculumSubjects={curriculumSubjects}
          program={instructorProgram}
          onCreateSubject={handleCreateSubject}
          onDeleteSubject={handleDeleteSubject}
          onEnrollSubject={(subject) => {
            setEnrollSubject(subject);
            handleNavigate('enroll');
          }}
          onUploadSubject={(subject) => {
            setUploadSubject(subject);
            handleNavigate('upload');
          }}
          onOpenSubject={(subject) => {
            setActiveSubject(subject);
            handleNavigate('subjectdetail');
          }}
        />
      );
      case 'subjectdetail': return (
        <SubjectDetail
          {...props}
          subject={activeSubject}
          onEnrollSubject={(subject) => {
            setEnrollSubject(subject);
            handleNavigate('enroll');
          }}
          onUploadSubject={(subject) => {
            setUploadSubject(subject);
            handleNavigate('upload');
          }}
          onDeleteStudent={handleDeleteStudent}
        />
      );
      case 'mystudents':    return (
        <MyStudents {...props} onNavigate={handleNavigate} onDeleteStudent={handleDeleteStudent} allowDelete />
      );
      case 'settings':     return (
        <InstructorSettings
          profile={instructorProfile}
          programOptions={programOptions}
          saving={profileSaving}
          onSave={async ({ name }) => {
            if (!authUser?.email) return;
            setProfileSaving(true);
            try {
              const payload = {
                id: authUser.email,
                name,
                dept: instructorProfile?.dept || '',
                rank: instructorProfile?.rank || 'Instructor',
                status: instructorProfile?.status || 'Active',
              };
              
              // Update faculty record
              await upsertFacultyRecord(payload);
              
              // Update local faculty records state immediately
              setFacultyRecords(prev => {
                const exists = prev.find(record => record.id === payload.id);
                if (exists) {
                  return prev.map(record => (record.id === payload.id ? { ...record, ...payload } : record));
                }
                return [...prev, payload];
              });
              
              // Refresh data to ensure consistency
              if (isActiveRef.current) {
                await loadData();
              }
            } catch (err) {
              console.error('Settings save failed:', err);
            }
            setProfileSaving(false);
          }}
        />
      );
      case 'upload':        return (
        <Upload
          {...props}
          subjects={subjects}
          onCommit={handleCommit}
          initialSubject={uploadSubject}
          onEnrollSubject={(subject) => {
            setEnrollSubject(subject);
            handleNavigate('enroll');
          }}
        />
      );
  case 'mysubmissions': return <MySubmissions {...props} profKey={profKey} />;
  case 'mychain':       return <MyChain       {...props} profKey={profKey} />;
  case 'activitylog':   return <ActivityLog logs={logs} curRole={curRole} profKey={profKey} />;

      default:
        if (canViewAdmin) {
          return (
            <AdminDashboard
              facultyRecords={facultyRecords}
              blocks={blocks}
              logs={logs}
              onNavigate={handleNavigate}
            />
          );
        }
        if (canViewDean) {
          return <Dashboard {...props} facultyRecords={facultyRecords} gradeSheets={gradeSheets} onClearStudents={handleClearStudents} />;
        }
        return <MyStudents {...props} onNavigate={handleNavigate} onDeleteStudent={handleDeleteStudent} allowDelete />;
    }
  }

  if (showSplash) {
    return <Splash phase={splashPhase} />;
  }

  if (showLanding) {
    return <Landing onNavigate={handleNavigate} onLoginSuccess={() => {}} />;
  }

  if (showOnboarding) {
    return (
      <Onboarding
        role={curRole}
        onComplete={() => {
          if (onboardingKey) {
            localStorage.setItem(onboardingKey, 'true');
          }
          setShowOnboarding(false);
        }}
      />
    );
  }

  return (
    <div className="layout">
      <Sidebar
        curRole={curRole}
        program={instructorProgram}
        userName={profileName}
        avatarUrl={profileAvatar}
        onOpenProfile={() => setProfileModalOpen(true)}
        activePage={activePage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      <div className="main">
        {renderPage()}
      </div>
      <SuccessModal
        data={modal}
        onClose={() => setModal(null)}
        onViewLedger={() => { setModal(null); handleNavigate('ledger'); }}
      />
      <ProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={userProfile || { name: profileName, avatar_url: profileAvatar }}
        roleLabel={ROLES[curRole]?.role}
        program={ROLES[curRole]?.type === 'instructor' ? instructorProgram : ''}
        logs={logs.filter(entry => entry.prof === (authUser?.email || curRole))}
        saving={profileSaving}
        onSave={async ({ name, avatar_url, avatarFile }) => {
          if (!authUser?.email) return;
          setProfileSaving(true);
          let finalAvatarUrl = avatar_url;
          if (avatarFile) {
            const uploadedUrl = await uploadAvatar({
              file: avatarFile,
              userId: authUser.email,
              filename: 'avatar.jpg',
            });
            if (uploadedUrl) finalAvatarUrl = uploadedUrl;
          }
          const payload = {
            id: authUser.email,
            name,
            role: ROLES[curRole]?.type || 'instructor',
            avatar_url: finalAvatarUrl,
          };
          await upsertUserProfile(payload);
          await updateUserMetadata({ name, avatar_url: finalAvatarUrl });
          setUserProfile(payload);
          if (ROLES[curRole]?.type === 'instructor') {
            const recordPayload = {
              id: authUser.email,
              name,
              dept: instructorProfile?.dept || instructorProgram || 'Program',
              rank: instructorProfile?.rank || 'Instructor',
              status: instructorProfile?.status || 'Active',
            };
            await upsertFacultyRecord(recordPayload);
            setFacultyRecords(prev => {
              const exists = prev.find(record => record.id === recordPayload.id);
              if (exists) {
                return prev.map(record => (record.id === recordPayload.id ? { ...record, ...recordPayload } : record));
              }
              return [...prev, recordPayload];
            });
          }
          setProfileSaving(false);
        }}
        onUploadAvatar={async (file) => {
          if (!authUser?.email) return '';
          const url = await uploadAvatar({ file, userId: authUser.email });
          return url;
        }}
      />
    </div>
  );
}
