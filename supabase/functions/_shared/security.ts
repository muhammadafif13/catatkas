import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.57.0';

function bytesToHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashValue(value: string) {
  const salt = Deno.env.get('RATE_LIMIT_SALT') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const data = new TextEncoder().encode(`${salt}:${value}`);
  return bytesToHex(await crypto.subtle.digest('SHA-256', data));
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || 'unknown';
}

export async function checkRateLimit(
  client: SupabaseClient,
  bucketKey: string,
  limit: number,
  windowSeconds: number,
) {
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const { count, error } = await client
    .from('ad_public_rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('bucket_key', bucketKey)
    .gte('created_at', since);

  if (error) throw new Error('Gagal memeriksa batas permintaan.');

  if ((count || 0) >= limit) return false;

  const { error: insertError } = await client
    .from('ad_public_rate_limits')
    .insert({ bucket_key: bucketKey });

  if (insertError) throw new Error('Gagal mencatat batas permintaan.');
  return true;
}

export async function verifyTurnstile(request: Request, token: string | null) {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  if (!secret) return true;
  if (!token) return false;

  const body = new FormData();
  body.set('secret', secret);
  body.set('response', token);
  body.set('remoteip', getClientIp(request));

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });

  if (!response.ok) return false;
  const result = await response.json();
  return result?.success === true;
}
