import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
export const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const adsenseClient = String(import.meta.env.VITE_ADSENSE_CLIENT || '').trim();

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null;

export function getSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.',
    );
  }
  return supabase;
}

export function isOnline() {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

export function assertOnline() {
  if (!isOnline()) {
    throw new Error('Kamu sedang offline. Sambungkan internet untuk menyimpan perubahan.');
  }
}

export async function getCurrentUserId() {
  const client = getSupabase();
  const {
    data: { session },
    error,
  } = await client.auth.getSession();
  if (error) throw error;
  if (!session?.user?.id) throw new Error('Sesi login tidak ditemukan. Silakan masuk kembali.');
  return session.user.id;
}

export function friendlyCloudError(error) {
  if (!error) return 'Terjadi kesalahan. Coba lagi.';
  const message = String(error.message || error);
  if (/duplicate key|unique constraint/i.test(message)) {
    return 'Data yang sama sudah ada.';
  }
  if (/foreign key|violates foreign key/i.test(message)) {
    return 'Data ini masih dipakai oleh catatan lain.';
  }
  if (/JWT|session|not authenticated|row-level security/i.test(message)) {
    return 'Sesi tidak valid atau kamu tidak memiliki akses.';
  }
  if (/fetch|network|Failed to fetch|offline/i.test(message)) {
    return 'Koneksi bermasalah. Periksa internet lalu coba lagi.';
  }
  return message;
}
