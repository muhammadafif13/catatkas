import { createClient } from 'npm:@supabase/supabase-js@2.57.0';
import { errorResponse, handleOptions, json } from '../_shared/http.ts';
import { getServiceClient, getSupabaseUrl } from '../_shared/supabase.ts';

Deno.serve(async (request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  if (request.method !== 'POST') {
    return errorResponse('Metode tidak diizinkan.', 405);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    return errorResponse('Sesi tidak ditemukan.', 401);
  }

  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!anonKey) {
    return errorResponse('Konfigurasi server belum lengkap.', 500);
  }

  // Identitas selalu diambil dari JWT, tidak pernah dari body request.
  const userClient = createClient(getSupabaseUrl(), anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) {
    return errorResponse('Sesi tidak valid.', 401);
  }

  const admin = getServiceClient();

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) {
    return errorResponse('Gagal memeriksa data akun.', 500);
  }
  if (profile?.role === 'admin') {
    return errorResponse('Akun admin tidak dapat dihapus dari aplikasi.', 403);
  }

  // Menghapus auth user ikut menghapus profiles dan seluruh data keuangan lewat ON DELETE CASCADE.
  const { error: deleteError } = await admin.auth.admin.deleteUser(authData.user.id);
  if (deleteError) {
    return errorResponse(`Gagal menghapus akun: ${deleteError.message}`, 500);
  }

  return json({ ok: true });
});
