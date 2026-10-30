import { errorResponse, handleOptions, json } from '../_shared/http.ts';
import { getServiceClient } from '../_shared/supabase.ts';
import {
  checkRateLimit,
  getClientIp,
  hashValue,
  verifyTurnstile,
} from '../_shared/security.ts';
import { detectImageExtension } from '../_shared/files.ts';

const MAX_CREATIVE_BYTES = 2 * 1024 * 1024;
const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function field(form: FormData, name: string) {
  return String(form.get(name) ?? '').trim();
}

function isEmail(value: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

function normalizePhone(value: string) {
  return value.replace(/[\s().-]/g, '');
}

async function cleanup(client: ReturnType<typeof getServiceClient>, adId: number, path?: string) {
  if (path) {
    await client.storage.from('ad-creatives').remove([path]);
  }
  await client.from('ads').delete().eq('id', adId);
}

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;

  if (request.method !== 'POST') {
    return errorResponse('Metode tidak didukung.', 405);
  }

  let adId: number | null = null;
  let storagePath: string | null = null;
  const client = getServiceClient();

  try {
    const form = await request.formData();

    if (field(form, '_company')) {
      return errorResponse('Permintaan tidak valid.', 400);
    }

    const packageId = Number(field(form, 'packageId'));
    const contactName = field(form, 'contactName');
    const contactEmail = field(form, 'contactEmail').toLowerCase();
    const contactPhone = normalizePhone(field(form, 'contactPhone'));
    const title = field(form, 'title');
    const body = field(form, 'body');
    const targetUrl = field(form, 'targetUrl');
    const ctaLabel = field(form, 'ctaLabel') || 'Kunjungi';
    const paymentMethod = field(form, 'paymentMethod');
    const termsAccepted = field(form, 'terms') === 'true';
    const turnstileToken = field(form, 'turnstileToken') || null;

    if (!Number.isInteger(packageId) || packageId <= 0) {
      return errorResponse('Paket iklan tidak valid.');
    }
    if (contactName.length < 2 || contactName.length > 100) {
      return errorResponse('Nama pengiklan harus 2-100 karakter.');
    }
    if (!isEmail(contactEmail) || contactEmail.length > 254) {
      return errorResponse('Email pengiklan tidak valid.');
    }
    if (!/^\+?[0-9]{7,20}$/.test(contactPhone)) {
      return errorResponse('Nomor WhatsApp tidak valid.');
    }
    if (title.length < 3 || title.length > 80) {
      return errorResponse('Judul iklan harus 3-80 karakter.');
    }
    if (body.length > 280) {
      return errorResponse('Teks iklan maksimal 280 karakter.');
    }
    if (ctaLabel.length > 30) {
      return errorResponse('Label tombol maksimal 30 karakter.');
    }
    if (targetUrl.length < 8 || targetUrl.length > 500) {
      return errorResponse('URL tujuan tidak valid.');
    }
    try {
      const parsed = new URL(targetUrl);
      if (parsed.protocol !== 'https:') {
        return errorResponse('URL tujuan harus menggunakan https.');
      }
    } catch {
      return errorResponse('URL tujuan tidak valid.');
    }
    if (!['bank_transfer', 'qris'].includes(paymentMethod)) {
      return errorResponse('Metode pembayaran tidak valid.');
    }
    if (!termsAccepted) {
      return errorResponse('Ketentuan iklan harus disetujui.');
    }

    const creative = form.get('creative');
    if (!(creative instanceof File) || creative.size === 0) {
      return errorResponse('Gambar iklan wajib diunggah.');
    }
    if (creative.size > MAX_CREATIVE_BYTES) {
      return errorResponse('Ukuran gambar iklan maksimal 2 MB.');
    }

    const buffer = await creative.arrayBuffer();
    const extension = detectImageExtension(buffer);
    if (!extension) {
      return errorResponse('Format gambar harus JPG, PNG, atau WebP.');
    }

    if (!(await verifyTurnstile(request, turnstileToken))) {
      return errorResponse('Verifikasi keamanan gagal. Muat ulang halaman.', 400);
    }

    const ipHash = await hashValue(getClientIp(request));
    const emailHash = await hashValue(contactEmail);
    const [ipAllowed, emailAllowed] = await Promise.all([
      checkRateLimit(client, `submit-ip:${ipHash}`, 5, 3600),
      checkRateLimit(client, `submit-email:${emailHash}`, 8, 86400),
    ]);

    if (!ipAllowed || !emailAllowed) {
      return json(
        { error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' },
        429,
        { 'Retry-After': '3600' },
      );
    }

    const { data: adPackage, error: packageError } = await client
      .from('ad_packages')
      .select('id, name, placement, duration_days, price_idr, priority')
      .eq('id', packageId)
      .eq('is_active', true)
      .maybeSingle();

    if (packageError) throw packageError;
    if (!adPackage) {
      return errorResponse('Paket iklan tidak tersedia.');
    }

    const { data: settings, error: settingsError } = await client
      .from('ad_payment_settings')
      .select('accepting_orders, qris_image_path, account_number')
      .eq('id', 1)
      .maybeSingle();

    if (settingsError) throw settingsError;
    if (!settings?.accepting_orders) {
      return errorResponse('Pemesanan iklan sedang ditutup.');
    }
    if (paymentMethod === 'qris' && !settings.qris_image_path) {
      return errorResponse('QRIS belum tersedia.');
    }
    if (paymentMethod === 'bank_transfer' && !settings.account_number.trim()) {
      return errorResponse('Rekening pembayaran belum tersedia.');
    }

    const { data: ad, error: adError } = await client
      .from('ads')
      .insert({
        provider: 'sponsor',
        source: 'public',
        placement: adPackage.placement,
        title,
        body,
        target_url: targetUrl,
        cta_label: ctaLabel,
        is_active: false,
        priority: 0,
        package_id: adPackage.id,
        advertiser_id: null,
        created_by: null,
      })
      .select('id')
      .single();

    if (adError) throw adError;
    adId = Number(ad.id);

    const contentType = CONTENT_TYPES[extension];
    storagePath = `public/${adId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await client.storage
      .from('ad-creatives')
      .upload(storagePath, new Blob([buffer], { type: contentType }), {
        contentType,
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      await cleanup(client, adId);
      return errorResponse('Gagal mengunggah gambar iklan.', 500);
    }

    const { error: updateError } = await client
      .from('ads')
      .update({ image_path: storagePath })
      .eq('id', adId);

    if (updateError) {
      await cleanup(client, adId, storagePath);
      return errorResponse('Gagal menyimpan gambar iklan.', 500);
    }

    const { data: orderRows, error: orderError } = await client.rpc('create_public_ad_order', {
      p_ad_id: adId,
      p_package_id: adPackage.id,
      p_contact_name: contactName,
      p_contact_email: contactEmail,
      p_contact_phone: contactPhone,
      p_payment_method: paymentMethod,
      p_terms_accepted: true,
    });

    if (orderError) {
      await cleanup(client, adId, storagePath);
      return errorResponse(orderError.message || 'Gagal membuat pesanan.', 400);
    }

    const order = Array.isArray(orderRows) ? orderRows[0] : orderRows;
    if (!order) {
      return errorResponse('Gagal membuat pesanan.', 500);
    }

    return json({
      ok: true,
      order: {
        code: order.order_code,
        token: order.public_token,
        totalAmount: Number(order.total_amount),
        expiresAt: order.expires_at,
      },
    });
  } catch (error) {
    console.error('public-ad-submit', error);
    if (adId) {
      await cleanup(client, adId, storagePath || undefined);
    }
    return errorResponse('Terjadi kesalahan. Silakan coba lagi.', 500);
  }
});
