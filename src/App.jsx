/* ============================================================
   App.jsx — Root component
   Manages global state: role, page, students, blocks, logs
   ============================================================ */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import {
  ROLES,
  DEAN_NAV,
  PROF_NAV,
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
  insertAuditLog,
  fetchAuditPresence,
  upsertAuditPresence,
  deleteStudent,
  deleteAllStudents,
  insertSubject,
  insertGradeSheet,
  upsertGradeSheet,
  signInWithPassword,
  signOut,
  signUp,
  updateUserMetadata,
  fetchUserProfile,
  upsertUserProfile,
  uploadAvatar,
  upsertStudent,
  upsertFacultyRecord,
  deleteFacultyRecord,
  deleteSubjectsByProf,
  deleteStudentsByProf,
  deleteSubject,
  deleteGradeSheetsBySubject,
  deleteStudentsBySubject,
} from './lib/queries';

import Sidebar       from './components/Sidebar';
import SuccessModal  from './components/SuccessModal';
import Landing       from './components/Landing';
import CreateAccount from './components/CreateAccount';
import Onboarding    from './components/Onboarding';
import ProfileModal  from './components/ProfileModal';

// Dean pages
import Dashboard    from './components/pages/Dashboard';
import AllGrades    from './components/pages/AllGrades';
import AllStudents  from './components/pages/AllStudents';
import Ledger       from './components/pages/Ledger';
import Verify       from './components/pages/Verify';
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
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [curRole,    setCurRole]    = useState('dean');
  const [activePage, setActivePage] = useState('dashboard');
  const [students,   setStudents]   = useState(INITIAL_STUDENTS);
  const [blocks,     setBlocks]     = useState(INITIAL_BLOCKS);
  const [logs,       setLogs]       = useState(INITIAL_LOGS);
  const [auditLogs,  setAuditLogs]  = useState([]);
  const [auditPresence, setAuditPresence] = useState([]);
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
  const isDean = ROLES[curRole]?.type === 'dean';
  const onboardingKey = useMemo(() => (authUser?.id ? `onboarding_seen_${authUser.id}` : ''), [authUser?.id]);
  const [enrollSubject, setEnrollSubject] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');
  const [activeSubject, setActiveSubject] = useState('');
  const isActiveRef = useRef(true);
  const presenceTimerRef = useRef(null);

  const presenceKey = 'presenceStatus';

  function parseDeviceInfo(userAgent) {
    const ua = userAgent || '';
    if (ua.includes('iPhone') || ua.includes('iPad')) return { device: 'iOS Device', os: 'iOS' };
    if (ua.includes('Android')) return { device: 'Android Device', os: 'Android' };
    if (ua.includes('Windows')) return { device: 'Windows PC', os: 'Windows' };
    if (ua.includes('Mac')) return { device: 'Mac', os: 'macOS' };
    if (ua.includes('Linux')) return { device: 'Linux PC', os: 'Linux' };
    return { device: 'Unknown Device', os: 'Unknown OS' };
  }

  function savePresence(entry) {
    try {
      const stored = localStorage.getItem(presenceKey);
      const map = stored ? JSON.parse(stored) : {};
      map[entry.user] = entry;
      localStorage.setItem(presenceKey, JSON.stringify(map));
    } catch (e) {
      console.error('Failed to save presence state:', e);
    }
  }

  async function updatePresence(user, status = 'online') {
    if (!user) return;
    const ua = navigator.userAgent || '';
    let ipAddress = 'Unknown';
    try {
      const response = await fetch('https://api.ipify.org?format=json', { timeout: 5000 });
      const data = await response.json();
      ipAddress = data.ip || ipAddress;
    } catch (e) {
      ipAddress = 'Unavailable';
    }

    const { device, os } = parseDeviceInfo(ua);
    const payload = {
      user_id: user.email || user.id,
      last_seen: new Date().toISOString(),
      ip_address: ipAddress,
      user_agent: ua,
      device,
      os,
      status,
    };

    savePresence({
      user: payload.user_id,
      lastSeen: payload.last_seen,
      ipAddress: payload.ip_address,
      userAgent: payload.user_agent,
      device: payload.device,
      os: payload.os,
      status: payload.status,
    });

    if (isSupabaseConfigured) {
      await upsertAuditPresence(payload);
      const { data } = await fetchAuditPresence();
      setAuditPresence(data || []);
    }
  }

  const navIdsForRole = useCallback((role) => {
    const nav = ROLES[role]?.type === 'dean' ? DEAN_NAV : PROF_NAV;
    return nav.flatMap(section => section.items.map(item => item.id));
  }, []);

  const getDefaultPage = useCallback((role) => (ROLES[role]?.type === 'dean' ? 'dashboard' : 'mystudents'), []);

  const getPageStorageKey = useCallback((role, userId) => `active_page_${userId || role}`, []);

  const resolveStoredPage = useCallback((role, stored) => {
    if (!stored) return getDefaultPage(role);
    return navIdsForRole(role).includes(stored) ? stored : getDefaultPage(role);
  }, [getDefaultPage, navIdsForRole]);

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

  function shouldShowOnboarding(user) {
    if (!user?.id) return false;
    return !localStorage.getItem(`onboarding_seen_${user.id}`);
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
    localStorage.setItem('currentUserEmail', user.email || user.id);
    
    // Track this user as logged in
    setLastLoggedInUser(user.email || user.id);
    
    // Helper: Save audit log (both in-memory and localStorage)
    const saveAuditLog = (log) => {
      setAuditLogs(prev => [...prev, log]);
      
      // Also persist to localStorage for offline consistency
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
    fetch('https://api.ipify.org?format=json', { timeout: 5000 })
      .then(res => res.json())
      .then(async data => {
        const { device, os } = parseDeviceInfo(ua);
        const newAuditLog = {
          prof: user.email || user.id,
      user_id: user.email || user.id,
          userAgent: ua,
          action: 'Login',
          time: new Date().toISOString(),
          ipAddress: data.ip || 'Unable to fetch IP',
          device,
          os,
        };
        saveAuditLog(newAuditLog);
        if (isSupabaseConfigured) {
          await insertAuditLog({
            prof: newAuditLog.prof,
            user_id: newAuditLog.user,
            user_agent: newAuditLog.userAgent,
            action: 'Login',
            time: newAuditLog.time,
            ip_address: newAuditLog.ipAddress,
            device,
            os,
          });
        }
        await updatePresence(user, 'online');
      })
      .catch(async () => {
        const { device, os } = parseDeviceInfo(ua);
        const newAuditLog = {
          prof: user.email || user.id,
          user: user.email || user.id,
          userAgent: ua,
          action: 'Login',
          time: new Date().toISOString(),
          ipAddress: 'IP detection unavailable',
          device,
          os,
        };
        saveAuditLog(newAuditLog);
        if (isSupabaseConfigured) {
          await insertAuditLog({
            prof: newAuditLog.prof,
            user_id: newAuditLog.user,
            user_agent: newAuditLog.userAgent,
            action: 'Login',
            time: newAuditLog.time,
            ip_address: null,
            device,
            os,
          });
        }
        await updatePresence(user, 'online');
      });
  }

  function logEnrollmentActivity(enrollmentLog) {
    if (!enrollmentLog) return;
    
    // Save to both in-memory and localStorage
    setAuditLogs(prev => [...prev, enrollmentLog]);
    
    try {
      const stored = localStorage.getItem('auditLogs');
      const existing = stored ? JSON.parse(stored) : [];
      const isDuplicate = existing.some(l => l.prof === enrollmentLog.prof && l.time === enrollmentLog.time && l.action === enrollmentLog.action);
      if (!isDuplicate) {
        existing.push(enrollmentLog);
        localStorage.setItem('auditLogs', JSON.stringify(existing));
      }
    } catch (e) {
      console.error('Failed to save enrollment log to localStorage:', e);
    }

    if (isSupabaseConfigured) {
      insertAuditLog({
  prof: enrollmentLog.prof,
  user_id: enrollmentLog.user,
        user_agent: enrollmentLog.userAgent,
        action: enrollmentLog.action || 'Enrollment',
        time: enrollmentLog.time,
        ip_address: enrollmentLog.ipAddress || null,
        device: enrollmentLog.device || null,
        os: enrollmentLog.os || null,
      });
    }
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
        const role = sessionUser.user_metadata?.role === 'dean' ? 'dean' : 'instructor';
        setCurRole(role);
        const stored = localStorage.getItem(getPageStorageKey(role, sessionUser.email));
        setActivePage(resolveStoredPage(role, stored));
        setShowLanding(false);
        setShowOnboarding(shouldShowOnboarding(sessionUser));
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user || null;
      setAuthUser(sessionUser);
      if (sessionUser) {
        const role = sessionUser.user_metadata?.role === 'dean' ? 'dean' : 'instructor';
        setCurRole(role);
        const stored = localStorage.getItem(getPageStorageKey(role, sessionUser.email));
        setActivePage(resolveStoredPage(role, stored));
        setShowLanding(false);
        setShowOnboarding(shouldShowOnboarding(sessionUser));
        logDeviceLogin(sessionUser);
        updatePresence(sessionUser);
        if (presenceTimerRef.current) clearInterval(presenceTimerRef.current);
        presenceTimerRef.current = setInterval(() => updatePresence(sessionUser), 2 * 60 * 1000);
      } else {
        setShowLanding(true);
        setShowOnboarding(false);
      }
    });

    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
      if (presenceTimerRef.current) {
        clearInterval(presenceTimerRef.current);
        presenceTimerRef.current = null;
      }
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!authUser || showLanding) return;
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
    uploadMethod: row.uploadMethod ?? row.upload_method,
  }));
  const blocksData = normalize(blocksRes.data);
  const logsData = normalize(logsRes.data);
  const subjectsData = normalize(subjectsRes.data);

      // Keep an unfiltered copy of subjects for pages that need to show all subjects
      setAllSubjects(subjectsData);
      if (roleType === 'dean') {
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
      const hasProfile = facultyData.some(record => record.id === authUser.email);
      if (!hasProfile) setShowOnboarding(true);
    }
  }, [authUser, curRole, showLanding]);

  useEffect(() => {
    isActiveRef.current = true;
    loadData();
    return () => {
      isActiveRef.current = false;
    };
  }, [loadData]);

  useEffect(() => {
    if (!authUser || ROLES[curRole]?.type !== 'instructor') return;
    if (!instructorProfile?.dept) return;
    if (authUser.user_metadata?.program === instructorProfile.dept) return;
    updateUserMetadata({ program: instructorProfile.dept });
  }, [authUser, curRole, instructorProfile]);

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
    if (showCreateAccount) {
      return (
        <CreateAccount
          onCreateAccount={handleCreateAccount}
          onBack={() => setShowCreateAccount(false)}
          authError={authError}
          authLoading={authLoading}
        />
      );
    }
    return (
      <Landing
        onLogin={handleLogin}
        onOpenCreate={() => setShowCreateAccount(true)}
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
        programOptions={programOptions}
        profileSaving={profileSaving}
        profileDefaults={{ name: instructorProfile?.name || '', program: instructorProfile?.dept || '' }}
        onSaveProfile={async ({ name, program }) => {
          if (!authUser?.email) return;
          setProfileSaving(true);
          const payload = {
            id: authUser.email,
            name,
            dept: program,
            rank: 'Instructor',
            status: 'Active',
          };
          await upsertFacultyRecord(payload);
          await updateUserMetadata({ program });
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
          if (onboardingKey) localStorage.setItem(onboardingKey, 'true');
          setShowOnboarding(false);
        }}
        onSkip={() => {
          if (onboardingKey) localStorage.setItem(onboardingKey, 'true');
          setShowOnboarding(false);
        }}
      />
    );
  }

  async function handleLogin({ email, password }) {
    setAuthError('');
    setAuthLoading(true);
    const { data, error } = await signInWithPassword({ email, password });
    setAuthLoading(false);
    if (error) {
      setAuthError(formatAuthError(error));
      return;
    }
    setAuthUser(data.user || null);
    const role = data.user?.user_metadata?.role === 'dean' ? 'dean' : 'instructor';
    setCurRole(role);
  const stored = localStorage.getItem(getPageStorageKey(role, data.user?.email));
  setActivePage(resolveStoredPage(role, stored));
    setShowLanding(false);
    setShowCreateAccount(false);
    setShowOnboarding(shouldShowOnboarding(data.user));
  }

  async function handleCreateAccount({ email, password, role }) {
    setAuthError('');
    setAuthLoading(true);
    const { data, error } = await signUp({ email, password, role });
    setAuthLoading(false);
    if (error) {
      setAuthError(formatAuthError(error));
      return;
    }
    if (!data?.session?.user) {
      setAuthError('Account created, but no session was returned. This usually means email confirmation is enabled or the user is unconfirmed. Disable email confirmation and confirm/delete the user in Supabase → Authentication → Users, then sign in.');
      return;
    }
    setAuthUser(data.session.user);
    const createdRole = role === 'dean' ? 'dean' : 'instructor';
    setCurRole(createdRole);
  const stored = localStorage.getItem(getPageStorageKey(createdRole, data.session.user?.email));
  setActivePage(resolveStoredPage(createdRole, stored));
    setShowLanding(false);
    setShowCreateAccount(false);
    setShowOnboarding(shouldShowOnboarding(data.session.user));
  }

  async function handleLogout() {
    if (authUser) {
      const ua = navigator.userAgent || '';
      const { device, os } = parseDeviceInfo(ua);
      await insertAuditLog({
        prof: authUser.email || authUser.id,
        user_id: authUser.email || authUser.id,
        user_agent: ua,
        action: 'Logout',
        time: new Date().toISOString(),
        ip_address: null,
        device,
        os,
      });
      await updatePresence(authUser, 'offline');
    }
    await signOut();
    setShowLanding(true);
    setShowOnboarding(false);
    setAuthUser(null);
  }

  /* ---- Role switching ---- */
  function handleRoleChange(role) {
    if (authUser) return;
    setCurRole(role);
    const stored = localStorage.getItem(getPageStorageKey(role));
    setActivePage(resolveStoredPage(role, stored));
  }

  /* ---- Navigation ---- */
  function handleNavigate(page) {
    setActivePage(page);
    const key = getPageStorageKey(curRole, authUser?.email);
    localStorage.setItem(key, page);
  }

  async function handleDeleteSubject(subjectCode) {
    if (!subjectCode) return;
    const prof = authUser?.email || curRole;
    setSubjects(prev => prev.filter(item => !(item.code === subjectCode && item.prof === prof)));
    setAllSubjects(prev => prev.filter(item => !(item.code === subjectCode && item.prof === prof)));
    setStudents(prev => prev.filter(student => !(student.subj === subjectCode && student.prof === prof)));
    setGradeSheets(prev => prev.filter(sheet => sheet.subject !== subjectCode));
    if (activeSubject === subjectCode) setActiveSubject('');
    if (uploadSubject === subjectCode) setUploadSubject('');
    if (enrollSubject === subjectCode) setEnrollSubject('');

    if (authUser) {
      await deleteStudentsBySubject({ subject: subjectCode, prof });
      await deleteGradeSheetsBySubject({ subject: subjectCode });
      await deleteSubject({ code: subjectCode, prof });
    }
  }

  /* ---- Blockchain commit (from Upload page) ---- */
  function handleCommit({ subject, period, gradeValues }) {
    const rd      = ROLES[curRole];
    const hash    = genHash();
    const now     = nowStr();
    const profKey = authUser?.email || curRole;
    const myS     = students.filter(s => s.prof === profKey);
    const subjCode = subject.split('–')[0].trim();

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

    // Add new block
    const newBlock = {
      num: nextBlock, hash,
      prev: blocks[blocks.length - 1]?.hash || '0x0000...0000',
      time: now, prof: profKey,
      subj: subjCode, period, count: myS.length,
    };
    setBlocks(prev => [...prev, newBlock]);

    // Add log entry
    const newLog = {
      time: now, dot: 'g',
      desc: `${rd.name} committed ${subjCode} ${period} grades (${myS.length} students) — Block #${nextBlock}`,
      prof: profKey,
    };
    setLogs(prev => [newLog, ...prev]);

    const sheetKey = `${subjCode}-${period}`;
    setGradeSheets(prev => {
      const exists = prev.find(sheet => `${sheet.subject}-${sheet.period}` === sheetKey);
      const updated = {
        subject: subjCode,
        section: myS[0]?.section || 'TBA',
        period,
        lastUpdated: now,
        status: 'Submitted',
      };
      if (exists) {
        return prev.map(sheet => (`${sheet.subject}-${sheet.period}` === sheetKey ? { ...sheet, ...updated } : sheet));
      }
      return [...prev, updated];
    });

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
          upload_method: 'Uploaded (committed)',
        });
      });
      insertBlock(newBlock);
      insertLog(newLog);
      upsertGradeSheet({
        subject: subjCode,
        section: myS[0]?.section || 'TBA',
        period,
        last_updated: now,
        status: 'Submitted',
      });
    }
  }

  function handleEnroll({ students: studentsToEnroll, subject }) {
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
        uploadMethod: 'Enrolled',
      })),
    ]);

    if (authUser) {
      uniqueStudents.forEach(student => {
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
        });
      });
    }
    return { added: uniqueStudents.length, skipped: studentsToEnroll.length - uniqueStudents.length };
  }

  async function handleDeleteStudent(student) {
    const shouldScopeToProf = ROLES[curRole]?.type !== 'dean';
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
    const payload = typeof subject === 'string' ? { code: subject } : subject || {};
    const normalized = String(payload.code || '').trim();
    if (!normalized) return;
    const title = payload.title ? String(payload.title).trim() : null;
    const prof = authUser?.email || curRole;
    if (subjects.some(item => item.code === normalized && item.prof === prof)) return;
    setSubjects(prev => [...prev, {
      code: normalized,
      prof,
      title: title || undefined,
      program: payload.program || undefined,
      year: payload.year || undefined,
      semester: payload.semester || undefined,
    }]);
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
      insertSubject({ code: normalized, prof: authUser.email, title });
      defaultPeriods.forEach(period => {
        insertGradeSheet({
          subject: normalized,
          section: 'TBA',
          period,
          last_updated: null,
          status: 'Pending',
        });
      });
    }
  }

  function handleSavePeriodicalGrades({ periodKey, updates }) {
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
      updates.forEach(update => {
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
          upload_method: update.uploadMethod ?? update.upload_method ?? 'Periodical',
          encoded_at: now,
          [periodKey]: update.grade,
        });
      });
      insertLog(newLog);
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
  const props = { students, blocks, logs, subjects, gradeSheets, curRole, profKey, program: instructorProgram, onRefresh: handleRefresh, refreshing };
  const academicProps = {
    facultyRecords,
    teachingLoads,
    curriculumSubjects,
    enrollmentRecords,
    gradeSheets,
  };

    switch (activePage) {
      // Dean pages
      case 'dashboard':    return isDean ? (
        <Dashboard
          {...props}
          facultyRecords={facultyRecords}
          gradeSheets={gradeSheets}
          onClearStudents={handleClearStudents}
        />
      ) : (
        <MyStudents {...props} onNavigate={handleNavigate} onDeleteStudent={handleDeleteStudent} allowDelete />
      );
  case 'allgrades':    return isDean ? <AllGrades {...props} facultyRecords={facultyRecords} /> : (
        <MyStudents {...props} onNavigate={handleNavigate} onDeleteStudent={handleDeleteStudent} allowDelete />
      );
      case 'allstudents':  return isDean ? (
        <AllStudents
          {...props}
          logs={logs}
          onDeleteStudent={handleDeleteStudent}
        />
      ) : (
        <MyStudents {...props} onNavigate={handleNavigate} onDeleteStudent={handleDeleteStudent} allowDelete />
      );
      case 'ledger':       return isDean ? <Ledger {...props} /> : <MyChain {...props} />;
      case 'verify':       return <Verify {...props} />;
      case 'submissions':  return isDean ? <Submissions {...props} /> : <MySubmissions {...props} />;
      case 'instructors':  return isDean ? (
        <Instructors
          instructors={instructors}
          facultyRecords={facultyRecords}
          students={students}
          subjects={subjects}
          blocks={blocks}
          logs={logs}
          onDeleteInstructor={handleDeleteInstructor}
        />
      ) : (
        <MyStudents {...props} onNavigate={handleNavigate} onDeleteStudent={handleDeleteStudent} allowDelete />
      );
      case 'facultyrecords': return isDean
        ? <FacultyRecords {...academicProps} />
        : <MyStudents {...props} onNavigate={handleNavigate} onDeleteStudent={handleDeleteStudent} allowDelete />;
      case 'siasdocs':       return isDean
        ? <SiasDocs {...academicProps} />
        : <MyStudents {...props} onNavigate={handleNavigate} onDeleteStudent={handleDeleteStudent} allowDelete />;
      case 'curriculum':     return isDean
        ? <Curriculum curriculumSubjects={curriculumSubjects} onImportCurriculum={handleImportCurriculum} />
        : <MyStudents {...props} onNavigate={handleNavigate} onDeleteStudent={handleDeleteStudent} allowDelete />;
      case 'periodical':     return isDean
        ? <PeriodicalGradeRecording {...props} profKey={profKey} isDeanView onSavePeriodicalGrades={handleSavePeriodicalGrades} />
        : <PeriodicalGradeRecording {...props} profKey={profKey} onSavePeriodicalGrades={handleSavePeriodicalGrades} />;
      case 'facultygrades':  return isDean
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
          onSave={async ({ name, program }) => {
            if (!authUser?.email) return;
            setProfileSaving(true);
            const payload = {
              id: authUser.email,
              name,
              dept: program,
              rank: instructorProfile?.rank || 'Instructor',
              status: instructorProfile?.status || 'Active',
            };
            await upsertFacultyRecord(payload);
            await updateUserMetadata({ program });
            setFacultyRecords(prev => {
              const exists = prev.find(record => record.id === payload.id);
              if (exists) {
                return prev.map(record => (record.id === payload.id ? { ...record, ...payload } : record));
              }
              return [...prev, payload];
            });
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
  case 'activitylog':   return <ActivityLog logs={logs} auditLogs={auditLogs} setAuditLogs={setAuditLogs} curRole={curRole} profKey={profKey} />;

      default: return <Dashboard {...props} />;
    }
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
