-- TiQly RLS baseline (review before applying in production)

-- EVENTS
alter table if exists public.events enable row level security;

create policy if not exists "events_read_all"
  on public.events for select
  using (true);

create policy if not exists "events_insert_organizer"
  on public.events for insert
  with check (auth.uid() = organizer_id);

create policy if not exists "events_update_organizer"
  on public.events for update
  using (auth.uid() = organizer_id)
  with check (auth.uid() = organizer_id);

-- TICKET TYPES (public read, organizer write)
alter table if exists public.ticket_types enable row level security;

create policy if not exists "ticket_types_read_all"
  on public.ticket_types for select
  using (true);

create policy if not exists "ticket_types_write_organizer"
  on public.ticket_types for insert
  with check (
    exists (
      select 1 from public.events e
      where e.id = ticket_types.event_id
        and e.organizer_id = auth.uid()
    )
  );

create policy if not exists "ticket_types_update_organizer"
  on public.ticket_types for update
  using (
    exists (
      select 1 from public.events e
      where e.id = ticket_types.event_id
        and e.organizer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = ticket_types.event_id
        and e.organizer_id = auth.uid()
    )
  );

-- TICKETS (no client-side inserts/updates; owners + organizers can read)
alter table if exists public.tickets enable row level security;

create policy if not exists "tickets_read_owner_or_organizer"
  on public.tickets for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.events e
      where e.id = tickets.event_id
        and e.organizer_id = auth.uid()
    )
  );

create policy if not exists "tickets_block_client_inserts"
  on public.tickets for insert
  with check (false);

create policy if not exists "tickets_block_client_updates"
  on public.tickets for update
  using (false)
  with check (false);

-- PLATFORM CONFIG (service role only)
alter table if exists public.platform_config enable row level security;

create policy if not exists "platform_config_service_only"
  on public.platform_config for select
  using (auth.role() = 'service_role');
