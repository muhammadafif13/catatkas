import { errorResponse, handleOptions, json } from '../_shared/http.ts';
import { getServiceClient } from '../_shared/supabase.ts';
import { checkRateLimit, getClientIp, hashValue } from '../_shared/security.ts';
import { detectImageExtension, detectPdf, isAllowedProofMime } from '../_shared/files.ts';

const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function field(form: FormData, name: string) {
  return String(form.get(name) ?? '').trim();
}

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;

  if (request.method !== 'POST') {
    return errorResponse('Metode tidak didukung.', 405);
  }

  const client = getServiceClient();
  let storagePath: string | null = null;

  try {
    const form = await request.formData();
    const token = field(form, 'token');
    const payerName = field(form, 'payerName');
    const payerNote = field(form, 'payerNote');

    if (!UUID_PATTERN.test(token)) {
      return errorResponse('Token pesanan tidak valid.');
    }
    if (payerName.length < 2 || payerName.length > 100) {
      return errorResponse('Nama pengirim harus 2-100 karakter.');
    }
    if (payerNote.length > 500) {
      return errorResponse('Catatan maksimal 500 karakter.');
    }

    const proof = form.get('proof');
    if (!(proof instanceof File) || proof.size === 0) {
      return errorResponse('Bukti pembayaran wajib diunggah.');
    }
    if (proof.size > MAX_PROOF_BYTES) {
      return errorResponse('Ukuran bukti pembayaran maksimal 5 MB.');
    }
    if (!isAllowedProofMime(proof.type)) {
      return errorResponse('Format bukti harus JPG, PNG, WebP, atau PDF.');
    }

    const buffer = await proof.arrayBuffer();
    const imageExtension = detectImageExtension(buffer);
    const isPdf = detectPdf(buffer);

    if (!imageExtension && !isPdf) {
      return errorResponse('Isi file bukti tidak valid.');
    }

    const extension = imageExtension || 'pdf';
    const contentType = imageExtension ? IMAGE_TYPES[imageExtension] : 'application/pdf';

    const tokenHash = await hashValue(token);
    const ipHash = await hashValue(getClientIp(request));
    const [tokenAllowed, ipAllowed] = await Promise.all([
      checkRateLimit(client, `proof-token:${tokenHash}`, 10, 3600),
      checkRateLimit(client, `proof-ip:${ipHash}`, 20, 3600),
    ]);

    if (!tokenAllowed || !ipAllowed) {
      return json(
        { error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' },
        429,
        { 'Retry-After': '3600' },
      );
    }

    storagePath = `${token}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await client.storage
      .from('ad-payment-proofs')
      .upload(storagePath, new Blob([buffer], { type: contentType }), {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('proof upload', uploadError);
      return errorResponse('Gagal mengunggah bukti pembayaran.', 500);
    }

    const { data: status, error: rpcError } = await client.rpc('submit_public_ad_proof', {
      p_token: token,
      p_proof_path: storagePath,
      p_payer_name: payerName,
      p_payer_note: payerNote,
    });

    if (rpcError) {
      await client.storage.from('ad-payment-proofs').remove([storagePath]);
      return errorResponse(rpcError.message || 'Gagal mengirim bukti pembayaran.', 400);
    }

    return json({ ok: true, status: status || 'awaiting_review' });
  } catch (error) {
    console.error('public-ad-proof', error);
    if (storagePath) {
      await client.storage.from('ad-payment-proofs').remove([storagePath]);
    }
    return errorResponse('Terjadi kesalahan. Silakan coba lagi.', 500);
  }
});
