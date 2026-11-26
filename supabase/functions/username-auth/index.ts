import { createClient } from 'npm:@supabase/supabase-js@2.57.0';
import { errorResponse, handleOptions, json } from '../_shared/http.ts';
import { getServiceClient, getSupabaseUrl } from '../_shared/supabase.ts';

const USERNAME_PATTERN = /^[a-z0-9._]{3,20}$/;

function wrongCredentials() {
  return errorResponse('Username atau password salah.', 401);
}

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;

  if (request.method !== 'POST') {
    return errorResponse('Metode tidak didukung.', 405);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Permintaan tidak valid.');
  }

  const username = String(body?.username || '').trim().toLowerCase();
  const password = String(body?.password || '');
  if (!USERNAME_PATTERN.test(username) || !password) {
    return errorResponse('Username dan password wajib diisi.');
  }

  try {
    const service = getServiceClient();
    const { data: profile, error: profileError } = await service
      .from('profiles')
      .select('id, email, is_suspended')
      .eq('username', username)
      .maybeSingle();

    if (profileError) throw profileError;

    // Jangan beri tahu apakah username terdaftar atau tidak.
    if (!profile?.email || profile.is_suspended) return wrongCredentials();

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!anonKey) throw new Error('Konfigurasi Supabase belum lengkap.');

    const authClient = createClient(getSupabaseUrl(), anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await authClient.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (error || !data?.session) return wrongCredentials();

    return json(
      {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
      200,
      { 'Cache-Control': 'no-store, max-age=0' },
    );
  } catch (error) {
    console.error('username-auth', error);
    return errorResponse('Tidak dapat masuk. Coba lagi.', 500);
  }
});
