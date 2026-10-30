import {
  assertOnline,
  friendlyCloudError,
  getSupabase,
  supabaseAnonKey,
  supabaseUrl,
} from '../lib/supabase';
import {
  adOrderFromRow,
  adPackageFromRow,
  adPaymentSettingsFromRow,
} from '../services/mappers';

const FUNCTION_HEADERS = {
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${supabaseAnonKey}`,
};

async function readResponse(response) {
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    throw new Error(data?.error || `Permintaan gagal (${response.status}).`);
  }
  return data;
}

function functionUrl(name) {
  return `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/${name}`;
}

function adPackageToRow(data = {}) {
  return {
    name: String(data.name || '').trim(),
    description: String(data.description || '').trim(),
    placement: data.placement,
    duration_days: Number(data.durationDays) || 1,
    price_idr: Math.max(0, Math.round(Number(data.priceIdr) || 0)),
    priority: Number(data.priority) || 0,
    is_active: data.isActive !== false,
    sort_order: Number(data.sortOrder) || 0,
  };
}

export async function getPublicAdConfig() {
  const response = await fetch(functionUrl('public-ad-config'), {
    headers: FUNCTION_HEADERS,
  });
  const data = await readResponse(response);
  return {
    packages: (data?.packages || []).map(adPackageFromRow),
    payment: data?.payment || null,
    turnstileEnabled: Boolean(data?.turnstileEnabled),
  };
}

export async function submitPublicAd(data, creativeFile) {
  const body = new FormData();
  body.append('packageId', String(data.packageId));
  body.append('contactName', data.contactName);
  body.append('contactEmail', data.contactEmail);
  body.append('contactPhone', data.contactPhone);
  body.append('title', data.title);
  body.append('body', data.body || '');
  body.append('targetUrl', data.targetUrl);
  body.append('ctaLabel', data.ctaLabel || 'Kunjungi');
  body.append('paymentMethod', data.paymentMethod);
  body.append('terms', data.terms ? 'true' : 'false');
  body.append('turnstileToken', data.turnstileToken || '');
  body.append('_company', '');
  body.append('creative', creativeFile);

  const response = await fetch(functionUrl('public-ad-submit'), {
    method: 'POST',
    headers: FUNCTION_HEADERS,
    body,
  });
  return readResponse(response);
}

export async function getPublicAdStatus(token) {
  if (!token) throw new Error('Token pesanan tidak ditemukan.');
  const response = await fetch(
    `${functionUrl('public-ad-status')}?token=${encodeURIComponent(token)}`,
    { headers: FUNCTION_HEADERS },
  );
  return readResponse(response);
}

export async function submitPublicAdProof({ token, file, payerName, payerNote }) {
  const body = new FormData();
  body.append('token', token);
  body.append('payerName', payerName);
  body.append('payerNote', payerNote || '');
  body.append('proof', file);

  const response = await fetch(functionUrl('public-ad-proof'), {
    method: 'POST',
    headers: FUNCTION_HEADERS,
    body,
  });
  return readResponse(response);
}

export async function getAdminAdPackages() {
  assertOnline();
  const { data, error } = await getSupabase()
    .from('ad_packages')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('price_idr', { ascending: true });
  if (error) throw new Error(friendlyCloudError(error));
  return (data || []).map(adPackageFromRow);
}

export async function createAdminAdPackage(data) {
  assertOnline();
  const { data: row, error } = await getSupabase()
    .from('ad_packages')
    .insert(adPackageToRow(data))
    .select()
    .single();
  if (error) throw new Error(friendlyCloudError(error));
  return adPackageFromRow(row);
}

export async function updateAdminAdPackage(id, data) {
  assertOnline();
  const { data: row, error } = await getSupabase()
    .from('ad_packages')
    .update(adPackageToRow(data))
    .eq('id', Number(id))
    .select()
    .single();
  if (error) throw new Error(friendlyCloudError(error));
  return adPackageFromRow(row);
}

export async function deleteAdminAdPackage(id) {
  assertOnline();
  const { error } = await getSupabase().from('ad_packages').delete().eq('id', Number(id));
  if (error) throw new Error(friendlyCloudError(error));
}

export async function getAdminAdOrders() {
  assertOnline();
  const { data, error } = await getSupabase()
    .from('ad_orders')
    .select(
      '*, ads (id, title, body, image_path, target_url, cta_label, provider, placement, priority, is_active, starts_at, ends_at, source, package_id)',
    )
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw new Error(friendlyCloudError(error));
  return (data || []).map(adOrderFromRow);
}

export async function getAdminPaymentSettings() {
  assertOnline();
  const { data, error } = await getSupabase()
    .from('ad_payment_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw new Error(friendlyCloudError(error));
  return adPaymentSettingsFromRow(data);
}

export async function saveAdminPaymentSettings(data) {
  assertOnline();
  const { data: row, error } = await getSupabase()
    .from('ad_payment_settings')
    .update({
      bank_name: String(data.bankName || '').trim(),
      account_number: String(data.accountNumber || '').trim(),
      account_holder: String(data.accountHolder || '').trim(),
      instructions: String(data.instructions || '').trim(),
      accepting_orders: Boolean(data.acceptingOrders),
      qris_image_path: data.qrisImagePath || null,
      updated_by: data.updatedBy || null,
    })
    .eq('id', 1)
    .select()
    .single();
  if (error) throw new Error(friendlyCloudError(error));
  return adPaymentSettingsFromRow(row);
}

export async function uploadPaymentQris(file) {
  assertOnline();
  const allowed = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const extension = allowed[file?.type];
  if (!extension) throw new Error('Gunakan gambar QRIS JPG, PNG, atau WebP.');
  if (file.size > 2 * 1024 * 1024) throw new Error('Ukuran gambar QRIS maksimal 2 MB.');

  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  const path = `qris/${Date.now()}-${random}.${extension}`;
  const { error } = await getSupabase()
    .storage.from('ad-payment-assets')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(friendlyCloudError(error));
  return path;
}

export async function deletePaymentQris(path) {
  if (!path) return;
  await getSupabase().storage.from('ad-payment-assets').remove([path]);
}

export function getPaymentAssetUrl(path) {
  if (!path) return '';
  return getSupabase().storage.from('ad-payment-assets').getPublicUrl(path).data.publicUrl;
}

export async function getAdProofSignedUrl(path) {
  if (!path) throw new Error('Bukti pembayaran belum diunggah.');
  const { data, error } = await getSupabase()
    .storage.from('ad-payment-proofs')
    .createSignedUrl(path, 300);
  if (error) throw new Error(friendlyCloudError(error));
  return data.signedUrl;
}

export async function reviewAdOrder(orderId, action, note = '') {
  assertOnline();
  const { error } = await getSupabase().rpc('admin_review_ad_order', {
    p_order_id: Number(orderId),
    p_action: action,
    p_note: note,
  });
  if (error) throw new Error(friendlyCloudError(error));
}
