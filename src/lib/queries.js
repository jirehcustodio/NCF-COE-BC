/* ============================================================
   queries.js — Supabase queries (CRUD wrappers)
   ============================================================ */
import { supabase } from './supabaseClient';

export async function signInWithPassword({ email, password }) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp({ email, password, role }) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role },
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function updateUserMetadata(payload) {
  return supabase.auth.updateUser({ data: payload });
}

export async function fetchUserProfile(id) {
  return supabase.from('user_profiles').select('*').eq('id', id).maybeSingle();
}

export async function upsertUserProfile(payload) {
  return supabase.from('user_profiles').upsert(payload).select('*');
}

export async function uploadAvatar({ file, userId, filename }) {
  const fileExt = (filename || file.name).split('.').pop();
  const fileName = filename || `${Date.now()}.${fileExt}`;
  const filePath = `avatars/${userId}/${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return data.publicUrl;
}

export async function fetchStudents() {
  return supabase.from('students').select('*').order('id', { ascending: true });
}

export async function upsertStudent(payload) {
  return supabase.from('students').upsert(payload).select('*');
}

export async function deleteStudent({ id, subject, prof }) {
  let query = supabase.from('students').delete().eq('id', id).eq('subj', subject);
  if (prof) query = query.eq('prof', prof);
  return query;
}

export async function deleteAllStudents() {
  return supabase.from('students').delete().neq('id', '');
}

export async function fetchBlocks() {
  return supabase.from('blocks').select('*').order('num', { ascending: false });
}

export async function insertBlock(payload) {
  return supabase.from('blocks').insert(payload).select('*');
}

export async function fetchLogs() {
  return supabase.from('logs').select('*').order('time', { ascending: false });
}

export async function insertLog(payload) {
  return supabase.from('logs').insert(payload).select('*');
}

export async function fetchInstructors() {
  return supabase.from('instructors').select('*').order('name', { ascending: true });
}

export async function fetchFacultyRecords() {
  return supabase.from('faculty_records').select('*').order('name', { ascending: true });
}

export async function upsertFacultyRecord(payload) {
  return supabase.from('faculty_records').upsert(payload).select('*');
}

export async function deleteFacultyRecord(id) {
  return supabase.from('faculty_records').delete().eq('id', id);
}

export async function fetchTeachingLoads() {
  return supabase.from('teaching_loads').select('*').order('faculty', { ascending: true });
}

export async function fetchCurriculumSubjects() {
  return supabase.from('curriculum_subjects').select('*').order('code', { ascending: true });
}

export async function upsertCurriculumSubjects(payload) {
  return supabase.from('curriculum_subjects').upsert(payload).select('*');
}

export async function fetchSections() {
  return supabase.from('sections').select('*').order('name', { ascending: true });
}

export async function upsertSection(payload) {
  return supabase.from('sections').upsert(payload).select('*');
}

export async function upsertSectionSubjects(payload) {
  return supabase.from('section_subjects').upsert(payload).select('*');
}

export async function upsertSectionStudents(payload) {
  return supabase.from('section_students').upsert(payload).select('*');
}

export async function fetchEnrollmentRecords() {
  return supabase.from('enrollment_records').select('*').order('name', { ascending: true });
}

export async function fetchGradeSheets() {
  return supabase.from('grade_sheets').select('*').order('last_updated', { ascending: false });
}

export async function insertGradeSheet(payload) {
  return supabase.from('grade_sheets').insert(payload).select('*');
}

export async function upsertGradeSheet(payload) {
  return supabase.from('grade_sheets').upsert(payload).select('*');
}

export async function fetchSubjects() {
  return supabase.from('subjects').select('*').order('code', { ascending: true });
}

export async function insertSubject(payload) {
  return supabase.from('subjects').insert(payload).select('*');
}

export async function deleteSubjectsByProf(prof) {
  return supabase.from('subjects').delete().eq('prof', prof);
}

export async function deleteStudentsByProf(prof) {
  return supabase.from('students').delete().eq('prof', prof);
}
