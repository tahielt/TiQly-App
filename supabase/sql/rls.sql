-- TiQly RLS baseline (review before applying in production)

-- EVENTS
alter table if exists public.events enable row level security;

drop policy if exists "events_read_all" on public.events;
drop policy if exists "events_insert_organizer" on public.events;
drop policy if exists "events_insert_service_only" on public.events;
drop policy if exists "events_update_organizer" on public.events;

create policy "events_read_all"
  on public.events for select
  using (true);

create policy "events_insert_service_only"
  on public.events for insert
  with check (false);

create policy "events_update_organizer"
  on public.events for update
  using (auth.uid() = organizer_id)
  with check (auth.uid() = organizer_id);

-- TICKET TYPES
alter table if exists public.ticket_types enable row level security;

drop policy if exists "ticket_types_read_all" on public.ticket_types;
drop policy if exists "ticket_types_write_organizer" on public.ticket_types;
drop policy if exists "ticket_types_update_organizer" on public.ticket_types;
drop policy if exists "ticket_types_insert_service_only" on public.ticket_types;
drop policy if exists "ticket_types_update_service_only" on public.ticket_types;

create policy "ticket_types_read_all"
  on public.ticket_types for select
  using (true);

create policy "ticket_types_insert_service_only"
  on public.ticket_types for insert
  with check (false);

create policy "ticket_types_update_service_only"
  on public.ticket_types for update
  using (false)
  with check (false);

-- TICKETS
alter table if exists public.tickets enable row level security;

drop policy if exists "tickets_read_owner_or_organizer" on public.tickets;
drop policy if exists "tickets_block_client_inserts" on public.tickets;
drop policy if exists "tickets_block_client_updates" on public.tickets;

create policy "tickets_read_owner_or_organizer"
  on public.tickets for select
  using (
    auth.uid() = user_id
    or exists (
      select 1
        from public.events e
       where e.id = tickets.event_id
         and e.organizer_id = auth.uid()
    )
  );

create policy "tickets_block_client_inserts"
  on public.tickets for insert
  with check (false);

create policy "tickets_block_client_updates"
  on public.tickets for update
  using (false)
  with check (false);

-- TICKET LISTINGS
alter table if exists public.ticket_listings enable row level security;

drop policy if exists "ticket_listings_read_market_or_owned" on public.ticket_listings;
drop policy if exists "ticket_listings_block_client_inserts" on public.ticket_listings;
drop policy if exists "ticket_listings_block_client_updates" on public.ticket_listings;
drop policy if exists "ticket_listings_block_client_deletes" on public.ticket_listings;

create policy "ticket_listings_read_market_or_owned"
  on public.ticket_listings for select
  using (
    status = 'listed'
    or seller_id = auth.uid()
    or buyer_id = auth.uid()
  );

create policy "ticket_listings_block_client_inserts"
  on public.ticket_listings for insert
  with check (false);

create policy "ticket_listings_block_client_updates"
  on public.ticket_listings for update
  using (false)
  with check (false);

create policy "ticket_listings_block_client_deletes"
  on public.ticket_listings for delete
  using (false);

-- PLATFORM CONFIG
alter table if exists public.platform_config enable row level security;

drop policy if exists "platform_config_service_only" on public.platform_config;

create policy "platform_config_service_only"
  on public.platform_config for select
  using (auth.role() = 'service_role');
