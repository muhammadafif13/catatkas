import { handleOptions, json } from '../_shared/http.ts';
import { getServiceClient } from '../_shared/supabase.ts';

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;

  if (request.method !== 'GET') {
    return json({ error: 'Metode tidak didukung.' }, 405);
  }

  try {
    const client = getServiceClient();
    const [packagesResult, settingsResult] = await Promise.all([
      client
        .from('ad_packages')
        .select('id, name, description, placement, duration_days, price_idr, priority, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('price_idr', { ascending: true }),
      client
        .from('ad_payment_settings')
        .select('bank_name, account_number, account_holder, qris_image_path, instructions, accepting_orders')
        .eq('id', 1)
        .maybeSingle(),
    ]);

    if (packagesResult.error) throw packagesResult.error;
    if (settingsResult.error) throw settingsResult.error;

    const settings = settingsResult.data;
    const hasBank = Boolean(settings?.bank_name && settings?.account_number);
    const hasQris = Boolean(settings?.qris_image_path);
    const qrisPath = settings?.qris_image_path || null;

    return json(
      {
        packages: packagesResult.data || [],
        payment: {
          bankName: settings?.bank_name || '',
          accountNumber: settings?.account_number || '',
          accountHolder: settings?.account_holder || '',
          qrisPath,
          instructions: settings?.instructions || '',
          acceptingOrders: Boolean(settings?.accepting_orders && (hasBank || hasQris)),
          hasBank,
          hasQris,
        },
        turnstileEnabled: Boolean(Deno.env.get('TURNSTILE_SECRET_KEY')),
      },
      200,
      { 'Cache-Control': 'public, max-age=30' },
    );
  } catch (error) {
    console.error('public-ad-config', error);
    return json({ error: 'Konfigurasi iklan belum dapat dimuat.' }, 500);
  }
});
