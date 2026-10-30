import { createClient } from 'npm:@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isValidUuid(value: unknown) {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return json({ error: 'Metode tidak diizinkan.' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = request.headers.get('Authorization');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Konfigurasi server belum lengkap.' }, 500);
  }
  if (!authorization) {
    return json({ error: 'Sesi tidak ditemukan.' }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) {
    return json({ error: 'Sesi tidak valid.' }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, role, is_suspended')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) {
    return json({ error: 'Gagal memeriksa hak akses.' }, 500);
  }
  if (!profile || profile.role !== 'admin' || profile.is_suspended) {
    return json({ error: 'Akses admin diperlukan.' }, 403);
  }

  let payload: { action?: string; userId?: string };
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Body permintaan tidak valid.' }, 400);
  }

  const { action, userId } = payload;
  if (!['suspend', 'activate', 'delete'].includes(String(action))) {
    return json({ error: 'Aksi tidak dikenal.' }, 400);
  }
  if (!isValidUuid(userId)) {
    return json({ error: 'User ID tidak valid.' }, 400);
  }
  if (userId === authData.user.id) {
    return json({ error: 'Admin tidak dapat mengubah akunnya sendiri dari panel ini.' }, 400);
  }

  if (action === 'suspend' || action === 'activate') {
    const suspended = action === 'suspend';
    const { error: profileUpdateError } = await adminClient
      .from('profiles')
      .update({ is_suspended: suspended })
      .eq('id', userId);

    if (profileUpdateError) {
      return json({ error: profileUpdateError.message }, 500);
    }

    const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: suspended ? '876000h' : 'none',
    });

    if (authUpdateError) {
      return json({ error: authUpdateError.message }, 500);
    }
  }

  if (action === 'delete') {
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      return json({ error: deleteError.message }, 500);
    }
  }

  await adminClient.from('admin_audit_log').insert({
    actor_id: authData.user.id,
    target_user_id: userId,
    action,
    metadata: {},
  });

  return json({ ok: true });
});
