-- ============================================================
-- TiQly · Migración 002 · RLS + funciones atómicas
-- Principio: el dinero y el stock solo se mueven dentro de
-- funciones SECURITY DEFINER llamadas por Edge Functions
-- (service role). El cliente jamás inserta orders ni tickets.
-- ============================================================

-- ---------- HELPER: membresía de organización ----------
create or replace function public.is_org_member(p_org uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = p_org and m.user_id = p_user
  );
$$;

-- ---------- RLS ----------
alter table public.profiles             enable row level security;
alter table public.organizations        enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_secrets enable row level security; -- sin policies: solo service role
alter table public.events               enable row level security;
alter table public.ticket_types         enable row level security;
alter table public.orders               enable row level security;
alter table public.tickets              enable row level security;
alter table public.platform_config      enable row level security;

-- profiles: lectura autenticada (nombres/avatares), edición propia
create policy profiles_select on public.profiles
  for select to authenticated using (true);
create policy profiles_update on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- organizations: lectura pública de datos básicos; crear la propia; editar el owner
create policy orgs_select on public.organizations
  for select using (true);
create policy orgs_insert on public.organizations
  for insert to authenticated with check (owner_id = auth.uid());
create policy orgs_update on public.organizations
  for update to authenticated using (owner_id = auth.uid());

-- organization_members: ver y administrar solo miembros/owner-admin
create policy org_members_select on public.organization_members
  for select to authenticated using (public.is_org_member(org_id, auth.uid()));
create policy org_members_insert on public.organization_members
  for insert to authenticated with check (
    exists (
      select 1 from public.organization_members m
      where m.org_id = organization_members.org_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
    or exists ( -- bootstrap: el owner de la org se agrega a sí mismo
      select 1 from public.organizations o
      where o.id = organization_members.org_id and o.owner_id = auth.uid()
    )
  );
create policy org_members_delete on public.organization_members
  for delete to authenticated using (
    exists (
      select 1 from public.organization_members m
      where m.org_id = organization_members.org_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

-- events: el público ve publicados; la org ve y administra los suyos
create policy events_select_public on public.events
  for select using (status = 'published');
create policy events_select_org on public.events
  for select to authenticated using (public.is_org_member(organization_id, auth.uid()));
create policy events_insert on public.events
  for insert to authenticated with check (
    public.is_org_member(organization_id, auth.uid()) and created_by = auth.uid()
  );
create policy events_update on public.events
  for update to authenticated using (public.is_org_member(organization_id, auth.uid()));

-- ticket_types: visibles si el evento es visible; escritura solo la org
create policy ticket_types_select on public.ticket_types
  for select using (
    exists (
      select 1 from public.events e
      where e.id = ticket_types.event_id
        and (e.status = 'published' or public.is_org_member(e.organization_id, auth.uid()))
    )
  );
create policy ticket_types_write on public.ticket_types
  for all to authenticated using (
    exists (
      select 1 from public.events e
      where e.id = ticket_types.event_id
        and public.is_org_member(e.organization_id, auth.uid())
    )
  ) with check (
    exists (
      select 1 from public.events e
      where e.id = ticket_types.event_id
        and public.is_org_member(e.organization_id, auth.uid())
    )
  );

-- orders: el comprador solo LEE las suyas. Nada de insert/update directo.
create policy orders_select_own on public.orders
  for select to authenticated using (user_id = auth.uid());

-- tickets: los ve el dueño y el staff de la org del evento. Sin escritura directa.
create policy tickets_select_own on public.tickets
  for select to authenticated using (user_id = auth.uid());
create policy tickets_select_org on public.tickets
  for select to authenticated using (
    exists (
      select 1 from public.events e
      where e.id = tickets.event_id
        and public.is_org_member(e.organization_id, auth.uid())
    )
  );

-- platform_config: lectura pública (la app muestra el fee), escritura solo service role
create policy platform_config_select on public.platform_config
  for select using (true);

-- ============================================================
-- FUNCIONES ATÓMICAS
-- ============================================================

-- ---------- 1) CREATE ORDER WITH HOLD ----------
-- Lazy-release de holds vencidos + lock del tier + hold atómico +
-- precio calculado server-side. Llamada por la Edge Function create-order.
create or replace function public.create_order_with_hold(
  p_user_id        uuid,
  p_ticket_type_id uuid,
  p_quantity       int
) returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tt        record;
  v_fee_rate  numeric;
  v_hold_min  int;
  v_released  int;
  v_unit      numeric(12,2);
  v_fee       numeric(12,2);
  v_total     numeric(12,2);
  v_order     public.orders;
begin
  if p_quantity is null or p_quantity < 1 then
    raise exception 'INVALID_QUANTITY';
  end if;

  -- 1. Liberar holds vencidos de este tier (limpieza perezosa)
  with expired as (
    update public.orders
       set status = 'expired'
     where ticket_type_id = p_ticket_type_id
       and status = 'pending'
       and expires_at < now()
    returning quantity
  )
  select coalesce(sum(quantity), 0) into v_released from expired;

  if v_released > 0 then
    update public.ticket_types
       set reserved = greatest(reserved - v_released, 0)
     where id = p_ticket_type_id;
  end if;

  -- 2. Lockear el tier y validar evento/ventana de venta
  select tt.id, tt.event_id, tt.price, tt.stock, tt.sold, tt.reserved,
         tt.max_per_order, tt.sales_start, tt.sales_end, tt.is_active,
         e.status as event_status
    into v_tt
    from public.ticket_types tt
    join public.events e on e.id = tt.event_id
   where tt.id = p_ticket_type_id
     for update of tt;

  if not found                          then raise exception 'TICKET_TYPE_NOT_FOUND'; end if;
  if v_tt.event_status <> 'published'   then raise exception 'EVENT_NOT_ON_SALE';     end if;
  if not v_tt.is_active                 then raise exception 'TICKET_TYPE_INACTIVE';  end if;
  if v_tt.sales_start is not null and now() < v_tt.sales_start
                                        then raise exception 'SALES_NOT_STARTED';     end if;
  if v_tt.sales_end is not null and now() > v_tt.sales_end
                                        then raise exception 'SALES_ENDED';           end if;
  if p_quantity > v_tt.max_per_order    then raise exception 'MAX_PER_ORDER_EXCEEDED';end if;

  -- 3. Hold atómico (la fila ya está lockeada; la condición es doble seguro)
  update public.ticket_types
     set reserved = reserved + p_quantity
   where id = p_ticket_type_id
     and (stock - sold - reserved) >= p_quantity;

  if not found then raise exception 'OUT_OF_STOCK'; end if;

  -- 4. Precio y fee: SIEMPRE desde la base, jamás del cliente
  select (value #>> '{}')::numeric into v_fee_rate
    from public.platform_config where key = 'service_fee_rate';
  select (value #>> '{}')::int into v_hold_min
    from public.platform_config where key = 'hold_minutes';

  v_fee_rate := coalesce(v_fee_rate, 0.15);
  v_hold_min := coalesce(v_hold_min, 10);

  v_unit  := v_tt.price;
  v_fee   := round(v_unit * p_quantity * v_fee_rate, 2);
  v_total := round(v_unit * p_quantity, 2) + v_fee;

  insert into public.orders
    (user_id, event_id, ticket_type_id, quantity,
     unit_price, service_fee, total, status, expires_at)
  values
    (p_user_id, v_tt.event_id, p_ticket_type_id, p_quantity,
     v_unit, v_fee, v_total, 'pending', now() + make_interval(mins => v_hold_min))
  returning * into v_order;

  return v_order;
end;
$$;

-- ---------- 2) CONFIRM ORDER PAID ----------
-- Idempotente por mp_payment_id. Convierte hold en venta y emite tickets.
-- Maneja el pago tardío (orden expirada que igual se pagó).
create or replace function public.confirm_order_paid(
  p_order_id      uuid,
  p_mp_payment_id text
) returns setof public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  i int;
begin
  -- Idempotencia: si este pago ya se procesó, devolver los tickets existentes
  if exists (select 1 from public.orders where mp_payment_id = p_mp_payment_id) then
    return query
      select t.* from public.tickets t
      join public.orders o on o.id = t.order_id
      where o.mp_payment_id = p_mp_payment_id;
    return;
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;

  if v_order.status = 'paid' then
    return query select * from public.tickets where order_id = p_order_id;
    return;
  end if;

  if v_order.status = 'expired' then
    -- Pago tardío: intentar retomar stock; si no hay, marcar para reembolso
    update public.ticket_types
       set reserved = reserved + v_order.quantity
     where id = v_order.ticket_type_id
       and (stock - sold - reserved) >= v_order.quantity;
    if not found then
      update public.orders
         set status = 'refund_required', mp_payment_id = p_mp_payment_id
       where id = p_order_id;
      raise exception 'PAID_AFTER_EXPIRY_NO_STOCK';
    end if;
  elsif v_order.status <> 'pending' then
    raise exception 'ORDER_NOT_PAYABLE';
  end if;

  update public.orders
     set status = 'paid', mp_payment_id = p_mp_payment_id, paid_at = now()
   where id = p_order_id;

  update public.ticket_types
     set reserved = greatest(reserved - v_order.quantity, 0),
         sold     = sold + v_order.quantity
   where id = v_order.ticket_type_id;

  for i in 1 .. v_order.quantity loop
    insert into public.tickets
      (order_id, event_id, ticket_type_id, user_id, original_owner_id, qr_code, status)
    values
      (v_order.id, v_order.event_id, v_order.ticket_type_id,
       v_order.user_id, v_order.user_id,
       encode(digest(gen_random_uuid()::text || clock_timestamp()::text, 'sha256'), 'hex'),
       'active');
  end loop;

  return query select * from public.tickets where order_id = p_order_id;
end;
$$;

-- ---------- 3) RELEASE ORDER ----------
-- Para pagos rechazados/cancelados desde el webhook.
create or replace function public.release_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.status <> 'pending' then return; end if;

  update public.orders set status = 'cancelled' where id = p_order_id;
  update public.ticket_types
     set reserved = greatest(reserved - v_order.quantity, 0)
   where id = v_order.ticket_type_id;
end;
$$;

-- ---------- 4) RELEASE EXPIRED HOLDS (cron global) ----------
-- Programar con pg_cron cada minuto (Dashboard → Integrations → Cron):
--   select cron.schedule('release-holds', '* * * * *',
--     $cron$ select public.release_expired_holds() $cron$);
create or replace function public.release_expired_holds()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int := 0;
  r record;
begin
  for r in
    with expired as (
      update public.orders
         set status = 'expired'
       where status = 'pending' and expires_at < now()
      returning ticket_type_id, quantity
    )
    select ticket_type_id, sum(quantity) as qty
      from expired group by ticket_type_id
  loop
    update public.ticket_types
       set reserved = greatest(reserved - r.qty, 0)
     where id = r.ticket_type_id;
    v_total := v_total + r.qty;
  end loop;
  return v_total;
end;
$$;

-- ---------- 5) VALIDATE TICKET (puerta) ----------
-- Un solo UPDATE atómico: imposible el doble ingreso con dos scanners.
-- Exige que quien escanea sea staff de la organización del evento.
create or replace function public.validate_ticket(
  p_qr_code text,
  p_scanner uuid
) returns table (
  ok          boolean,
  reason      text,
  ticket_id   uuid,
  event_id    uuid,
  holder_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_t record;
begin
  update public.tickets t
     set status = 'used', used_at = now(), used_by = p_scanner
    from public.events e
   where t.qr_code = p_qr_code
     and t.status  = 'active'
     and e.id      = t.event_id
     and public.is_org_member(e.organization_id, p_scanner)
  returning t.id, t.event_id, t.user_id into v_t;

  if found then
    return query
      select true, 'OK', v_t.id, v_t.event_id, p.name
        from public.profiles p where p.id = v_t.user_id;
    return;
  end if;

  -- Diagnóstico del rechazo (sin tocar nada)
  select t.id, t.event_id, t.status as tstatus, e.organization_id
    into v_t
    from public.tickets t
    join public.events e on e.id = t.event_id
   where t.qr_code = p_qr_code;

  if not found then
    return query select false, 'NOT_FOUND', null::uuid, null::uuid, null::text;
  elsif not public.is_org_member(v_t.organization_id, p_scanner) then
    return query select false, 'NOT_STAFF', v_t.id, v_t.event_id, null::text;
  else
    return query select false, upper(v_t.tstatus::text), v_t.id, v_t.event_id, null::text;
  end if;
end;
$$;

-- ---------- Permisos de ejecución ----------
-- Las funciones de dinero/stock las llama SOLO el service role.
revoke execute on function public.create_order_with_hold(uuid, uuid, int) from public, anon, authenticated;
revoke execute on function public.confirm_order_paid(uuid, text)          from public, anon, authenticated;
revoke execute on function public.release_order(uuid)                     from public, anon, authenticated;
revoke execute on function public.release_expired_holds()                 from public, anon, authenticated;

-- service_role (Edge Functions) necesita el grant explícito tras el revoke de PUBLIC
grant execute on function public.create_order_with_hold(uuid, uuid, int) to service_role;
grant execute on function public.confirm_order_paid(uuid, text)          to service_role;
grant execute on function public.release_order(uuid)                     to service_role;
grant execute on function public.release_expired_holds()                 to service_role;

-- validate_ticket sí puede llamarla el staff autenticado desde la app:
-- la verificación de membresía está dentro de la función.
grant execute on function public.validate_ticket(text, uuid) to authenticated;
grant execute on function public.validate_ticket(text, uuid) to service_role;
