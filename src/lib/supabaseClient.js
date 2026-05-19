/* ============================================================
   supabaseClient.js — Supabase client setup (CRA)
   ============================================================ */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn('Supabase env vars missing. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({
          order: async () => ({ data: [], error: null }),
          eq: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
        order: async () => ({ data: [], error: null }),
        insert: async () => ({ data: [], error: null }),
        upsert: async () => ({ data: [], error: null }),
      }),
    };
