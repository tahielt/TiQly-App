-- ============================================================
-- TiQly · Migración 001 · Schema core
-- Fuente de verdad del dominio: organizaciones, eventos,
-- tipos de entrada con stock, órdenes con hold y tickets.
-- Pensado para un proyecto Supabase limpio (staging primero).
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- ENUMS ----------
create type public.event_status  as enum ('draft', 'published', 'cancelled', 'finished');
create type public.order_status  as enum ('pending', 'paid', 'expired', 'cancelled', 'refund_required', 'refunded');
create type public.ticket_status as enum ('active', 'used', 'transferred', 'listed', 'cancelled', 'refunded');
create type public.org_role      as enum ('owner', 'admin', 'scanner');

-- ---------- PROFILES ----------
-- Espejo público de auth.users. Se crea por trigger al registrarse.
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text,
  email      text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- ORGANIZATIONS ----------
create table public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique,
  owner_id   uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.organization_members (
  org_id     uuid not null references public.organizations (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       public.org_role not null default 'scanner',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- Credenciales de Mercado Pago del organizador (OAuth / split payments).
-- SIN políticas RLS de lectura: solo el service role (Edge Functions) accede.
create table public.organization_secrets (
  org_id           uuid primary key references public.organizations (id) on delete cascade,
  mp_user_id       text,
  mp_access_token  text,
  mp_refresh_token text,
  mp_token_expires timestamptz,
  updated_at       timestamptz not null default now()
);

-- ---------- EVENTS ----------
create table public.events (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id),
  created_by       uuid not null references public.profiles (id),
  title            text not null,
  description      text,
  category         text not null default 'Fiesta',
  status           public.event_status not null default 'draft',
  start_date       timestamptz not null,
  end_date         timestamptz,
  location_name    text,
  location_address text,
  location_lat     double precision,
  location_lng     double precision,
  cover_image      text,
  capacity         int check (capacity is null or capacity > 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index events_status_start_idx on public.events (status, start_date);
create index events_org_idx          on public.events (organization_id);
create index events_geo_idx          on public.events (location_lat, location_lng);

-- ---------- TICKET TYPES (tiers con stock) ----------
create table public.ticket_types (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  name          text not null,
  price         numeric(12,2) not null check (price >= 0),
  stock         int not null check (stock >= 0),
  sold          int not null default 0 check (sold >= 0),
  reserved      int not null default 0 check (reserved >= 0),
  max_per_order int not null default 6 check (max_per_order between 1 and 10),
  sales_start   timestamptz,
  sales_end     timestamptz,
  is_active     boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  -- Invariante central anti-sobreventa:
  constraint ticket_types_no_oversell check (sold + reserved <= stock)
);

create index ticket_types_event_idx on public.ticket_types (event_id);

-- ---------- ORDERS (una orden = un hold sobre un tier) ----------
create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id),
  event_id         uuid not null references public.events (id),
  ticket_type_id   uuid not null references public.ticket_types (id),
  quantity         int not null check (quantity between 1 and 10),
  unit_price       numeric(12,2) not null, -- snapshot del precio al momento del hold
  service_fee      numeric(12,2) not null, -- fee total de TiQly (snapshot)
  total            numeric(12,2) not null, -- lo que paga el comprador
  status           public.order_status not null default 'pending',
  expires_at       timestamptz not null,   -- vencimiento del hold
  mp_preference_id text,
  mp_payment_id    text unique,            -- idempotencia del webhook
  paid_at          timestamptz,
  created_at       timestamptz not null default now()
);

create index orders_user_idx    on public.orders (user_id, created_at desc);
create index orders_pending_idx on public.orders (ticket_type_id, status, expires_at)
  where status = 'pending';

-- ---------- TICKETS (se emiten SOLO al confirmar pago) ----------
create table public.tickets (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id),
  event_id          uuid not null references public.events (id),
  ticket_type_id    uuid not null references public.ticket_types (id),
  user_id           uuid not null references public.profiles (id),
  original_owner_id uuid not null references public.profiles (id),
  qr_code           text not null unique,  -- v1: hash opaco. v2: pasa a TOTP firmado.
  qr_secret         text,                  -- reservado para QR rotativo (fase Acceso)
  status            public.ticket_status not null default 'active',
  used_at           timestamptz,
  used_by           uuid references public.profiles (id),
  created_at        timestamptz not null default now()
);

create index tickets_user_idx  on public.tickets (user_id, created_at desc);
create index tickets_event_idx on public.tickets (event_id, status);

-- ---------- CONFIG DE PLATAFORMA ----------
create table public.platform_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.platform_config (key, value) values
  ('service_fee_rate',   '0.15'),  -- 15% al comprador
  ('hold_minutes',       '10'),    -- duración del hold
  ('founding_fee_rate',  '0.10');  -- promo founding partners (uso futuro)

-- updated_at automático en events
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();
