import {
  assertOnline,
  friendlyCloudError,
  getSupabase,
  isOnline,
} from '../lib/supabase';
import { adFromRow, adToRow } from '../services/mappers';

export function getAdImageUrl(path) {
  if (!path) return '';
  return getSupabase().storage.from('ad-creatives').getPublicUrl(path).data.publicUrl;
}

export async function getActiveAds() {
  if (!isOnline()) return [];
  const { data, error } = await getSupabase()
    .from('ads')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .order('created_at');
  if (error) throw new Error(friendlyCloudError(error));

  const now = Date.now();
  return (data || [])
    .map(adFromRow)
    .filter((ad) => {
      const startsAt = ad.startsAt ? new Date(ad.startsAt).getTime() : null;
      const endsAt = ad.endsAt ? new Date(ad.endsAt).getTime() : null;
      return (!startsAt || startsAt <= now) && (!endsAt || endsAt > now);
    });
}

export async function getAllAds() {
  const { data, error } = await getSupabase()
    .from('ads')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(friendlyCloudError(error));
  return (data || []).map(adFromRow);
}

export async function createAd(data) {
  assertOnline();
  const { data: row, error } = await getSupabase()
    .from('ads')
    .insert(adToRow(data))
    .select()
    .single();
  if (error) throw new Error(friendlyCloudError(error));
  return adFromRow(row);
}

export async function updateAd(id, data) {
  assertOnline();
  const { data: row, error } = await getSupabase()
    .from('ads')
    .update(adToRow(data))
    .eq('id', Number(id))
    .select()
    .single();
  if (error) throw new Error(friendlyCloudError(error));
  return adFromRow(row);
}

export async function deleteAd(id) {
  assertOnline();
  const { error } = await getSupabase().from('ads').delete().eq('id', Number(id));
  if (error) throw new Error(friendlyCloudError(error));
}

export async function uploadAdCreative(file) {
  assertOnline();
  const allowed = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const extension = allowed[file?.type];
  if (!extension) throw new Error('Gunakan gambar JPG, PNG, atau WebP.');
  if (file.size > 2 * 1024 * 1024) throw new Error('Ukuran gambar maksimal 2 MB.');

  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  const path = `${Date.now()}-${random}.${extension}`;
  const { error } = await getSupabase()
    .storage.from('ad-creatives')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(friendlyCloudError(error));
  return path;
}

export async function deleteAdCreative(path) {
  if (!path) return;
  await getSupabase().storage.from('ad-creatives').remove([path]);
}

export async function recordAdEvent(adId, event) {
  if (!isOnline()) return;
  await getSupabase().rpc('record_ad_event', { p_ad_id: Number(adId), p_event: event });
}

export async function getAdStats() {
  const { data, error } = await getSupabase().from('ad_daily_stats').select('*');
  if (error) throw new Error(friendlyCloudError(error));

  return (data || []).reduce((stats, row) => {
    const key = Number(row.ad_id);
    const current = stats.get(key) || { impressions: 0, clicks: 0 };
    current.impressions += Number(row.impressions) || 0;
    current.clicks += Number(row.clicks) || 0;
    stats.set(key, current);
    return stats;
  }, new Map());
}
