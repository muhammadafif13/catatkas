-- CatatKas: username sebagai identitas akun. Email tetap disimpan di auth.users
-- sebagai email internal, tetapi tidak lagi dipakai sebagai identitas login.

alter table public.profiles add column if not exists username text;

-- ---------------------------------------------------------------------------
-- Normalisasi username
-- ---------------------------------------------------------------------------

create or replace function public.normalize_username(p_value text)
returns text
language sql
immutable
set search_path = public
as $$
  select btrim(
    regexp_replace(
      regexp_replace(lower(coalesce(p_value, '')), '[^a-z0-9._]+', '.', 'g'),
      '\.{2,}',
      '.',
      'g'
    ),
    '.'
  );
$$;

-- ---------------------------------------------------------------------------
-- Backfill akun yang sudah ada: username diambil dari bagian lokal email.
-- Duplikat diberi akhiran .1, .2, dan seterusnya.
-- ---------------------------------------------------------------------------

do $$
declare
  v_row record;
  v_base text;
  v_candidate text;
  v_suffix integer;
begin
  for v_row in
    select id, email
    from public.profiles
    where username is null or btrim(username) = ''
  loop
    v_base := public.normalize_username(split_part(coalesce(v_row.email, ''), '@', 1));
    if length(v_base) < 3 then
      v_base := rpad(v_base, 3, '0');
    end if;
    if length(v_base) > 20 then
      v_base := rtrim(left(v_base, 20), '.');
    end if;

    v_candidate := v_base;
    v_suffix := 1;
    while exists (
      select 1
      from public.profiles
      where lower(username) = v_candidate
        and id <> v_row.id
    ) loop
      v_candidate := rtrim(left(v_base, 20 - length('.' || v_suffix::text)), '.') || '.' || v_suffix::text;
      v_suffix := v_suffix + 1;
    end loop;

    update public.profiles set username = v_candidate where id = v_row.id;
  end loop;
end $$;

alter table public.profiles alter column username set not null;

alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format
  check (username ~ '^[a-z0-9._]{3,20}$');

create unique index if not exists profiles_username_uidx
  on public.profiles (lower(username));

-- ---------------------------------------------------------------------------
-- Trigger pembuatan akun: simpan username dari metadata signup.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_username text;
begin
  v_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    split_part(coalesce(new.email, ''), '@', 1)
  );

  v_username := public.normalize_username(
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'username'), ''),
      split_part(coalesce(new.email, ''), '@', 1)
    )
  );
  if length(v_username) < 3 then
    v_username := rpad(v_username, 3, '0');
  end if;
  if length(v_username) > 20 then
    v_username := rtrim(left(v_username, 20), '.');
  end if;

  if not (v_username ~ '^[a-z0-9._]{3,20}$') then
    raise exception 'Username tidak valid.';
  end if;

  if exists (select 1 from public.profiles where lower(username) = v_username) then
    raise exception 'Username sudah digunakan.';
  end if;

  insert into public.profiles (id, email, full_name, username)
  values (new.id, coalesce(new.email, ''), v_name, v_username)
  on conflict (id) do nothing;

  perform public.seed_user_defaults(new.id);
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Cek ketersediaan username untuk form pendaftaran (bisa dipanggil anon).
-- ---------------------------------------------------------------------------

create or replace function public.is_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.normalize_username(p_username) ~ '^[a-z0-9._]{3,20}$'
    and not exists (
      select 1
      from public.profiles
      where lower(username) = public.normalize_username(p_username)
    );
$$;

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Lindungi username dari update client biasa.
-- ---------------------------------------------------------------------------

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(current_setting('catatkas.allow_profile_security_change', true), '') = 'on'
    or auth.role() = 'service_role'
    or public.is_admin()
  then
    return new;
  end if;

  new.role := old.role;
  new.is_suspended := old.is_suspended;
  new.created_at := old.created_at;
  new.username := old.username;

  if new.email is distinct from old.email
      and not exists (
        select 1
        from auth.users u
        where u.id = new.id
          and lower(u.email) = lower(new.email)
      )
    then
      new.email := old.email;
    end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Bootstrap admin menerima username atau email (kompatibel dengan deploy lama).
-- ---------------------------------------------------------------------------

create or replace function public.bootstrap_admin(p_identifier text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.profiles where role = 'admin') then
    raise exception 'Admin sudah ada. Hanya satu admin yang diizinkan.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where lower(username) = lower(trim(p_identifier))
       or lower(email) = lower(trim(p_identifier))
  ) then
    raise exception 'Akun dengan username/email tersebut belum terdaftar.';
  end if;

  perform set_config('catatkas.allow_profile_security_change', 'on', true);

  update public.profiles
  set role = 'admin'
  where (lower(username) = lower(trim(p_identifier))
      or lower(email) = lower(trim(p_identifier)))
    and role = 'user';
end;
$$;

-- ---------------------------------------------------------------------------
-- Ringkasan admin menyertakan username (return type berubah, bukan create-or-replace).
-- ---------------------------------------------------------------------------

drop function if exists public.admin_user_summaries();

create or replace function public.admin_user_summaries()
returns table (
  id uuid,
  username text,
  email text,
  full_name text,
  role text,
  is_suspended boolean,
  created_at timestamptz,
  last_seen_at timestamptz,
  transaction_count bigint,
  account_count bigint,
  last_transaction_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak.';
  end if;

  return query
  select
    p.id,
    p.username,
    p.email,
    p.full_name,
    p.role,
    p.is_suspended,
    p.created_at,
    p.last_seen_at,
    (select count(*) from public.transactions t where t.user_id = p.id)::bigint,
    (select count(*) from public.accounts a where a.user_id = p.id)::bigint,
    (select max(t.created_at) from public.transactions t where t.user_id = p.id)
  from public.profiles p
  order by p.created_at desc;
end;
$$;

grant execute on function public.admin_user_summaries() to authenticated;
grant execute on function public.normalize_username(text) to anon, authenticated;
