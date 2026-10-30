create or replace function public.create_public_ad_order(
  p_ad_id bigint,
  p_package_id bigint,
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text,
  p_payment_method text,
  p_terms_accepted boolean
)
returns table (
  id bigint,
  order_code text,
  public_token uuid,
  total_amount bigint,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ad public.ads%rowtype;
  v_package public.ad_packages%rowtype;
  v_settings public.ad_payment_settings%rowtype;
  v_code integer;
  v_order_code text;
  v_total bigint;
  v_email text;
  v_attempt integer;
  v_order_id bigint;
  v_public_token uuid;
  v_order_total bigint;
  v_order_expires_at timestamptz;
begin
  if coalesce(p_terms_accepted, false) is not true then
    raise exception 'Ketentuan iklan harus disetujui.';
  end if;

  v_email := lower(trim(coalesce(p_contact_email, '')));
  if v_email = '' or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Email pengiklan tidak valid.';
  end if;
  if length(trim(coalesce(p_contact_name, ''))) < 2 then
    raise exception 'Nama pengiklan tidak valid.';
  end if;

  select * into v_package
  from public.ad_packages
  where ad_packages.id = p_package_id
    and ad_packages.is_active;

  if not found then
    raise exception 'Paket iklan tidak tersedia.';
  end if;

  select * into v_settings
  from public.ad_payment_settings
  where ad_payment_settings.id = 1;

  if not found or not v_settings.accepting_orders then
    raise exception 'Pemesanan iklan sedang ditutup.';
  end if;
  if p_payment_method = 'qris' and coalesce(v_settings.qris_image_path, '') = '' then
    raise exception 'QRIS belum tersedia.';
  end if;
  if p_payment_method = 'bank_transfer' and trim(v_settings.account_number) = '' then
    raise exception 'Rekening pembayaran belum tersedia.';
  end if;

  select * into v_ad
  from public.ads
  where ads.id = p_ad_id
    and ads.source = 'public'
    and ads.package_id = p_package_id
    and ads.is_active = false
  for update;

  if not found then
    raise exception 'Data iklan tidak ditemukan.';
  end if;

  if exists (
    select 1
    from public.ad_orders
    where ad_orders.ad_id = v_ad.id
      and ad_orders.status in ('awaiting_payment', 'awaiting_review', 'approved')
  ) then
    raise exception 'Iklan ini sudah memiliki pesanan aktif.';
  end if;

  update public.ad_orders
  set status = 'expired'
  where ad_orders.status = 'awaiting_payment'
    and ad_orders.expires_at <= now();

  for v_attempt in 1..20 loop
    v_code := 100 + floor(random() * 900)::integer;
    v_total := v_package.price_idr + v_code;
    v_order_code := 'AD-' || to_char(now(), 'YYMMDD') || '-' ||
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

    begin
      insert into public.ad_orders (
        order_code,
        ad_id,
        source,
        contact_name,
        contact_email,
        contact_phone,
        package_id,
        package_name,
        placement,
        duration_days,
        priority,
        base_amount,
        unique_code,
        total_amount,
        payment_method,
        status,
        terms_accepted_at,
        expires_at
      )
      values (
        v_order_code,
        v_ad.id,
        'public',
        trim(left(p_contact_name, 100)),
        v_email,
        trim(left(coalesce(p_contact_phone, ''), 40)),
        v_package.id,
        v_package.name,
        v_package.placement,
        v_package.duration_days,
        v_package.priority,
        v_package.price_idr,
        v_code,
        v_total,
        p_payment_method,
        'awaiting_payment',
        now(),
        now() + interval '24 hours'
      )
      returning ad_orders.id, ad_orders.public_token, ad_orders.total_amount,
        ad_orders.expires_at
      into v_order_id, v_public_token, v_order_total, v_order_expires_at;

      id := v_order_id;
      order_code := v_order_code;
      public_token := v_public_token;
      total_amount := v_order_total;
      expires_at := v_order_expires_at;
      return next;
      return;
    exception
      when unique_violation then
        v_order_code := null;
    end;
  end loop;

  raise exception 'Nomor pembayaran unik sedang tidak tersedia. Coba lagi.';
end;
$$;

revoke all on function public.create_public_ad_order(bigint, bigint, text, text, text, text, boolean) from public;
revoke all on function public.create_public_ad_order(bigint, bigint, text, text, text, text, boolean) from anon;
revoke all on function public.create_public_ad_order(bigint, bigint, text, text, text, text, boolean) from authenticated;
grant execute on function public.create_public_ad_order(bigint, bigint, text, text, text, text, boolean) to service_role;

drop policy if exists ad_orders_select on public.ad_orders;
create policy ad_orders_select on public.ad_orders
  for select to authenticated
  using (
    public.is_admin()
    or (
      advertiser_id = auth.uid()
      and public.is_active_user()
    )
  );
