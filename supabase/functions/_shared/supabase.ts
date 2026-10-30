import { createClient } from 'npm:@supabase/supabase-js@2.57.0';

export function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    throw new Error('Konfigurasi Supabase belum lengkap.');
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getSupabaseUrl() {
  const url = Deno.env.get('SUPABASE_URL');
  if (!url) throw new Error('Konfigurasi Supabase belum lengkap.');
  return url;
}
