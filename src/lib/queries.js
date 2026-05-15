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

export async function fetchStudents() {
  return supabase.from('students').select('*').order('id', { ascending: true });
}

export async function upsertStudent(payload) {
  return supabase.from('students').upsert(payload).select('*');
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
