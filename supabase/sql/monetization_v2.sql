create extension if not exists pgcrypto;

alter table if exists public.events
  add column if not exists publish_fee_applied numeric(12,2) not null default 0,
  add column if not exists publish_billing_mode text not null default 'included',
  add column if not exists published_events_this_month integer not null default 0;

alter table if exists public.tickets
  add column if not exists base_price numeric(12,2) not null default 0,
  add column if not exists platform_fee numeric(12,2) not null default 0,
  add column if not exists sale_channel text not null default 'primary';

create table if not exists public.ticket_listings (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  seller_id uuid not null,
  buyer_id uuid,
  event_id uuid not null references public.events(id) on delete cascade,
  original_price numeric(12,2) not null default 0,
  asking_price numeric(12,2) not null default 0,
  platform_fee numeric(12,2) not null default 0,
  seller_receives numeric(12,2) not null default 0,
  buyer_pays numeric(12,2) not null default 0,
  status text not null default 'listed',
  expires_at timestamptz,
  sold_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.ticket_listings
  add column if not exists original_price numeric(12,2) not null default 0,
  add column if not exists platform_fee numeric(12,2) not null default 0,
  add column if not exists seller_receives numeric(12,2) not null default 0,
  add column if not exists buyer_pays numeric(12,2) not null default 0,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create unique index if not exists ticket_listings_one_open_listing_per_ticket_idx
  on public.ticket_listings(ticket_id)
  where status = 'listed';

insert into public.platform_config(key, value)
values
  ('primary_fee_pct', '15'),
  ('resale_fee_pct', '12'),
  ('publish_fee', '2500')
on conflict (key) do nothing;

create or replace function public.round_money(p_value numeric)
returns numeric
language sql
immutable
as $$
  select round(coalesce(p_value, 0)::numeric, 2);
$$;

create or replace function public.normalize_platform_pct(p_value numeric, p_default numeric)
returns numeric
language plpgsql
immutable
as $$
begin
  if p_value is null then
    return p_default;
  end if;

  if p_value < 0 then
    return 0;
  end if;

  if p_value > 1 then
    return p_value / 100;
  end if;

  return p_value;
end;
$$;

create or replace function public.platform_config_raw(p_keys text[], p_default numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
  v_value text;
begin
  foreach v_key in array p_keys loop
    select value::text
      into v_value
      from public.platform_config
     where key = v_key
     limit 1;

    if v_value is null then
      continue;
    end if;

    begin
      return trim(v_value)::numeric;
    exception when others then
      continue;
    end;
  end loop;

  return p_default;
end;
$$;

create or replace function public.get_platform_config_public()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_primary_fee numeric := public.normalize_platform_pct(public.platform_config_raw(array['primary_fee_pct', 'primary_platform_fee_percentage'], 15), 0.15);
  v_resale_fee numeric := public.normalize_platform_pct(public.platform_config_raw(array['resale_fee_pct', 'resale_buyer_fee_percentage'], 12), 0.12);
  v_publish_fee numeric := public.round_money(public.platform_config_raw(array['publish_fee'], 2500));
begin
  return jsonb_build_object(
    'primary_fee_pct', v_primary_fee,
    'resale_fee_pct', v_resale_fee,
    'publish_fee', v_publish_fee,
    'publish_fee_threshold', 25
  );
end;
$$;

grant execute on function public.get_platform_config_public() to anon, authenticated;

create or replace function public.purchase_ticket_atomic(
  p_user_id uuid,
  p_event_id uuid,
  p_ticket_type_id uuid default null,
  p_quantity integer default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quantity integer := greatest(coalesce(p_quantity, 1), 1);
  v_event record;
  v_ticket_type record;
  v_unit_base_price numeric(12,2) := 0;
  v_fee_rate numeric := public.normalize_platform_pct(public.platform_config_raw(array['primary_fee_pct', 'primary_platform_fee_percentage'], 15), 0.15);
  v_unit_fee numeric(12,2);
  v_unit_final numeric(12,2);
  v_total_base numeric(12,2);
  v_total_fee numeric(12,2);
  v_total_final numeric(12,2);
  v_tickets jsonb := '[]'::jsonb;
begin
  select e.id, e.title, e.organizer_id, e.price, e.status
    into v_event
    from public.events e
   where e.id = p_event_id
   for update;

  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  if coalesce(v_event.status, 'published') <> 'published' then
    raise exception 'EVENT_NOT_PUBLISHED';
  end if;

  if p_ticket_type_id is not null then
    update public.ticket_types
       set available = coalesce(available, quantity) - v_quantity
     where id = p_ticket_type_id
       and event_id = p_event_id
       and coalesce(available, quantity, 0) >= v_quantity
     returning id, name, price, quantity, available
      into v_ticket_type;

    if not found then
      raise exception 'INSUFFICIENT_STOCK';
    end if;

    v_unit_base_price := coalesce(v_ticket_type.price, 0);
  else
    v_unit_base_price := coalesce(v_event.price, 0);
  end if;

  if v_unit_base_price < 0 then
    raise exception 'INVALID_BASE_PRICE';
  end if;

  v_unit_fee := public.round_money(v_unit_base_price * v_fee_rate);
  v_unit_final := public.round_money(v_unit_base_price + v_unit_fee);
  v_total_base := public.round_money(v_unit_base_price * v_quantity);
  v_total_fee := public.round_money(v_unit_fee * v_quantity);
  v_total_final := public.round_money(v_unit_final * v_quantity);

  with generated as (
    select
      gen_random_uuid() as ticket_id,
      md5(gen_random_uuid()::text || ':' || p_user_id::text || ':' || p_event_id::text || ':' || clock_timestamp()::text || ':' || gs::text) as qr_code
    from generate_series(1, v_quantity) as gs
  ),
  inserted as (
    insert into public.tickets (
      id,
      event_id,
      user_id,
      ticket_type_id,
      qr_code,
      status,
      price_paid,
      base_price,
      platform_fee,
      sale_channel,
      original_owner_id,
      purchase_date
    )
    select
      ticket_id,
      p_event_id,
      p_user_id,
      p_ticket_type_id,
      qr_code,
      'active',
      v_unit_final,
      v_unit_base_price,
      v_unit_fee,
      'primary',
      p_user_id,
      timezone('utc', now())
    from generated
    returning id, ticket_type_id, price_paid, base_price, platform_fee, purchase_date, qr_code, created_at
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'ticketTypeId', ticket_type_id,
        'pricePaid', price_paid,
        'basePrice', base_price,
        'platformFee', platform_fee,
        'purchaseDate', purchase_date,
        'qrCode', qr_code,
        'createdAt', created_at
      )
    ),
    '[]'::jsonb
  )
    into v_tickets
    from inserted;

  return jsonb_build_object(
    'tickets', v_tickets,
    'ticket', coalesce(v_tickets->0, '{}'::jsonb),
    'pricing', jsonb_build_object(
      'unitBasePrice', v_unit_base_price,
      'unitFeeAmount', v_unit_fee,
      'unitFinalAmount', v_unit_final,
      'baseAmount', v_total_base,
      'feeAmount', v_total_fee,
      'finalAmount', v_total_final,
      'feePercentage', v_fee_rate
    ),
    'ticketType', jsonb_build_object(
      'id', p_ticket_type_id,
      'name', coalesce(v_ticket_type.name, 'General')
    )
  );
end;
$$;

create or replace function public.create_resale_listing_atomic(
  p_ticket_id uuid,
  p_seller_id uuid,
  p_asking_price numeric,
  p_expires_in_days integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket record;
  v_listing record;
  v_fee_rate numeric := public.normalize_platform_pct(public.platform_config_raw(array['resale_fee_pct', 'resale_buyer_fee_percentage'], 12), 0.12);
  v_platform_fee numeric(12,2);
  v_buyer_pays numeric(12,2);
  v_expires_at timestamptz;
begin
  if coalesce(p_asking_price, 0) <= 0 then
    raise exception 'INVALID_ASKING_PRICE';
  end if;

  select
    t.id,
    t.event_id,
    t.user_id,
    t.price_paid,
    t.base_price,
    t.status,
    t.used_at,
    t.ticket_type_id
  into v_ticket
  from public.tickets t
  where t.id = p_ticket_id
  for update;

  if not found then
    raise exception 'TICKET_NOT_FOUND';
  end if;

  if v_ticket.user_id <> p_seller_id then
    raise exception 'NOT_TICKET_OWNER';
  end if;

  if v_ticket.status <> 'active' then
    raise exception 'TICKET_NOT_ACTIVE';
  end if;

  if v_ticket.used_at is not null then
    raise exception 'TICKET_ALREADY_USED';
  end if;

  if exists (
    select 1
      from public.ticket_listings l
     where l.ticket_id = p_ticket_id
       and l.status = 'listed'
  ) then
    raise exception 'LISTING_ALREADY_EXISTS';
  end if;

  v_platform_fee := public.round_money(p_asking_price * v_fee_rate);
  v_buyer_pays := public.round_money(p_asking_price + v_platform_fee);
  v_expires_at := timezone('utc', now()) + make_interval(days => greatest(coalesce(p_expires_in_days, 30), 1));

  insert into public.ticket_listings (
    ticket_id,
    seller_id,
    event_id,
    original_price,
    asking_price,
    platform_fee,
    seller_receives,
    buyer_pays,
    status,
    expires_at,
    updated_at
  ) values (
    p_ticket_id,
    p_seller_id,
    v_ticket.event_id,
    coalesce(v_ticket.base_price, v_ticket.price_paid, 0),
    public.round_money(p_asking_price),
    v_platform_fee,
    public.round_money(p_asking_price),
    v_buyer_pays,
    'listed',
    v_expires_at,
    timezone('utc', now())
  )
  returning * into v_listing;

  update public.tickets
     set status = 'listed'
   where id = p_ticket_id;

  return jsonb_build_object(
    'listing', jsonb_build_object(
      'id', v_listing.id,
      'ticketId', v_listing.ticket_id,
      'sellerId', v_listing.seller_id,
      'eventId', v_listing.event_id,
      'originalPrice', v_listing.original_price,
      'askingPrice', v_listing.asking_price,
      'platformFee', v_listing.platform_fee,
      'sellerReceives', v_listing.seller_receives,
      'buyerPays', v_listing.buyer_pays,
      'status', v_listing.status,
      'expiresAt', v_listing.expires_at,
      'createdAt', v_listing.created_at
    ),
    'pricing', jsonb_build_object(
      'feePercentage', v_fee_rate,
      'platformFee', v_listing.platform_fee,
      'sellerReceives', v_listing.seller_receives,
      'buyerPays', v_listing.buyer_pays
    )
  );
end;
$$;

create or replace function public.purchase_resale_atomic(
  p_listing_id uuid,
  p_buyer_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing record;
  v_updated_ticket record;
  v_new_qr text;
begin
  select *
    into v_listing
    from public.ticket_listings l
   where l.id = p_listing_id
   for update;

  if not found or v_listing.status <> 'listed' then
    raise exception 'LISTING_NOT_AVAILABLE';
  end if;

  if v_listing.seller_id = p_buyer_id then
    raise exception 'CANNOT_BUY_OWN_LISTING';
  end if;

  v_new_qr := md5(gen_random_uuid()::text || ':' || p_buyer_id::text || ':' || v_listing.event_id::text || ':' || clock_timestamp()::text);

  update public.tickets
     set user_id = p_buyer_id,
         qr_code = v_new_qr,
         status = 'active',
         price_paid = v_listing.buyer_pays,
         base_price = v_listing.asking_price,
         platform_fee = v_listing.platform_fee,
         sale_channel = 'resale',
         purchase_date = timezone('utc', now())
   where id = v_listing.ticket_id
     and status = 'listed'
  returning id, event_id, ticket_type_id, price_paid, base_price, platform_fee, purchase_date, qr_code, created_at, original_owner_id
    into v_updated_ticket;

  if not found then
    raise exception 'TICKET_NOT_TRANSFERABLE';
  end if;

  update public.ticket_listings
     set status = 'sold',
         buyer_id = p_buyer_id,
         sold_at = timezone('utc', now()),
         updated_at = timezone('utc', now())
   where id = p_listing_id;

  return jsonb_build_object(
    'ticket', jsonb_build_object(
      'id', v_updated_ticket.id,
      'eventId', v_updated_ticket.event_id,
      'ticketTypeId', v_updated_ticket.ticket_type_id,
      'pricePaid', v_updated_ticket.price_paid,
      'basePrice', v_updated_ticket.base_price,
      'platformFee', v_updated_ticket.platform_fee,
      'purchaseDate', v_updated_ticket.purchase_date,
      'qrCode', v_updated_ticket.qr_code,
      'createdAt', v_updated_ticket.created_at,
      'originalOwnerId', v_updated_ticket.original_owner_id
    ),
    'pricing', jsonb_build_object(
      'askingPrice', v_listing.asking_price,
      'platformFee', v_listing.platform_fee,
      'sellerReceives', v_listing.seller_receives,
      'buyerPays', v_listing.buyer_pays
    ),
    'listing', jsonb_build_object(
      'id', v_listing.id,
      'status', 'sold'
    )
  );
end;
$$;

create or replace function public.cancel_resale_listing_atomic(
  p_listing_id uuid,
  p_seller_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing record;
begin
  select *
    into v_listing
    from public.ticket_listings l
   where l.id = p_listing_id
   for update;

  if not found or v_listing.status <> 'listed' then
    raise exception 'LISTING_NOT_CANCELABLE';
  end if;

  if v_listing.seller_id <> p_seller_id then
    raise exception 'NOT_LISTING_OWNER';
  end if;

  update public.ticket_listings
     set status = 'cancelled',
         updated_at = timezone('utc', now())
   where id = p_listing_id;

  update public.tickets
     set status = 'active'
   where id = v_listing.ticket_id;

  return jsonb_build_object(
    'success', true,
    'ticketId', v_listing.ticket_id,
    'listingId', p_listing_id
  );
end;
$$;

grant execute on function public.create_resale_listing_atomic(uuid, uuid, numeric, integer) to authenticated;
grant execute on function public.purchase_resale_atomic(uuid, uuid) to authenticated;
grant execute on function public.cancel_resale_listing_atomic(uuid, uuid) to authenticated;
