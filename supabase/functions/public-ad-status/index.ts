import { errorResponse, handleOptions, json } from '../_shared/http.ts';
import { getServiceClient } from '../_shared/supabase.ts';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function numberOrZero(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function derivePublicStatus(order: any) {
  if (order.status !== 'approved') return order.status;

  const ad = order.ads;
  if (!ad) return 'approved';

  const now = Date.now();
  if (ad.ends_at && new Date(ad.ends_at).getTime() <= now) return 'ended';
  if (!ad.is_active) return 'paused';
  if (ad.starts_at && new Date(ad.starts_at).getTime() > now) return 'scheduled';
  return 'active';
}

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;

  if (request.method !== 'GET') {
    return errorResponse('Metode tidak didukung.', 405);
  }

  const token = new URL(request.url).searchParams.get('token')?.trim() || '';
  if (!UUID_PATTERN.test(token)) {
    return errorResponse('Token pesanan tidak valid.');
  }

  try {
    const client = getServiceClient();
    const { data: order, error } = await client
      .from('ad_orders')
      .select(
        'id, order_code, public_token, status, base_amount, unique_code, total_amount, ' +
          'package_name, placement, duration_days, payment_method, proof_path, payer_name, ' +
          'payer_note, expires_at, submitted_at, reviewed_at, review_note, created_at, ad_id, ' +
          'ads (id, title, body, image_path, target_url, cta_label, placement, is_active, starts_at, ends_at)',
      )
      .eq('public_token', token)
      .maybeSingle();

    if (error) throw error;
    if (!order) {
      return json({ error: 'Pesanan tidak ditemukan.' }, 404);
    }

    let currentStatus = order.status;
    if (
      currentStatus === 'awaiting_payment' &&
      new Date(order.expires_at).getTime() <= Date.now()
    ) {
      const { error: expireError } = await client
        .from('ad_orders')
        .update({ status: 'expired' })
        .eq('id', order.id)
        .eq('status', 'awaiting_payment');

      if (expireError) throw expireError;
      order.status = 'expired';
      currentStatus = 'expired';
    }

    const [settingsResult, statsResult] = await Promise.all([
      client
        .from('ad_payment_settings')
        .select('bank_name, account_number, account_holder, qris_image_path, instructions, accepting_orders')
        .eq('id', 1)
        .maybeSingle(),
      client
        .from('ad_daily_stats')
        .select('impressions, clicks')
        .eq('ad_id', order.ad_id),
    ]);

    if (settingsResult.error) throw settingsResult.error;
    if (statsResult.error) throw statsResult.error;

    const settings = settingsResult.data;
    const totals = (statsResult.data || []).reduce(
      (accumulator, row) => ({
        impressions: accumulator.impressions + numberOrZero(row.impressions),
        clicks: accumulator.clicks + numberOrZero(row.clicks),
      }),
      { impressions: 0, clicks: 0 },
    );

    const qrisPath = settings?.qris_image_path || null;
    const ad = order.ads;
    const imagePath = ad?.image_path || null;
    const publicStatus = derivePublicStatus(order);
    const canSubmitProof =
      currentStatus === 'awaiting_payment' || currentStatus === 'awaiting_review';

    return json(
      {
        order: {
          code: order.order_code,
          status: currentStatus,
          publicStatus,
          baseAmount: Number(order.base_amount),
          uniqueCode: Number(order.unique_code),
          totalAmount: Number(order.total_amount),
          packageName: order.package_name,
          placement: order.placement,
          durationDays: order.duration_days,
          paymentMethod: order.payment_method,
          proofSubmitted: Boolean(order.proof_path),
          payerName: order.payer_name,
          createdAt: order.created_at,
          expiresAt: order.expires_at,
          submittedAt: order.submitted_at,
          reviewedAt: order.reviewed_at,
          reviewNote: order.review_note,
          canSubmitProof,
        },
        ad: ad
          ? {
              title: ad.title,
              body: ad.body,
              imagePath,
              targetUrl: ad.target_url,
              ctaLabel: ad.cta_label,
              startsAt: ad.starts_at,
              endsAt: ad.ends_at,
            }
          : null,
        payment: {
          bankName: settings?.bank_name || '',
          accountNumber: settings?.account_number || '',
          accountHolder: settings?.account_holder || '',
          qrisPath,
          instructions: settings?.instructions || '',
          acceptingOrders: Boolean(settings?.accepting_orders),
        },
        stats: {
          impressions: totals.impressions,
          clicks: totals.clicks,
        },
        serverNow: new Date().toISOString(),
      },
      200,
      {
        'Cache-Control': 'no-store, max-age=0',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    );
  } catch (error) {
    console.error('public-ad-status', error);
    return errorResponse('Status pesanan belum dapat dimuat.', 500);
  }
});
