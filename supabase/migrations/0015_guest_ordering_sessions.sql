-- Konobar: rolling 2h/per-device table sessions, guest RPC surface
-- Run after 0001-0014 (0014 must already be committed - it adds the
-- 'EXPIRED' enum value this file relies on), in the SQL Editor.
--
-- Replaces the Sprint 6 "6h idle timeout, no device identity, broad
-- `to anon using (true)`" model with: a 2h window anchored to the last
-- successful order, one ACTIVE session per physical guest device (bound
-- via a random guest_device_token the browser generates and stores in
-- localStorage), and automatic takeover when a second device orders at
-- the same table. All anon access to table_sessions/orders/order_items/
-- service_requests writes now goes exclusively through the SECURITY
-- DEFINER RPCs below instead of direct `to anon` table policies - closes
-- the previous `table_sessions_public_update using (true) with check
-- (true))` hole (anyone with the anon key could flip any table's session
-- status before this).

-- ---------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------

alter table public.table_sessions
  add column guest_device_token text,
  add column last_order_at timestamptz,
  add column expires_at timestamptz,
  add column close_reason text
    check (close_reason in ('BILL_REQUESTED', 'TIMEOUT', 'REPLACED_BY_NEW_DEVICE', 'CLOSED_BY_STAFF'));

alter table public.table_sessions drop column last_activity_at;

-- Short-lived, single-use marker minted on every guest page load and
-- consumed by resolve_guest_session(). Doesn't prove a real QR scan (a
-- plain refresh mints one too - see AGENTS.md for the documented
-- limitation) but does stop an already-open, long-idle tab from
-- re-claiming/creating a session via some background retry without an
-- actual new page load.
create table public.table_scan_nonces (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.restaurant_tables (id) on delete cascade,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

-- RLS enabled with zero policies - only reachable through the SECURITY
-- DEFINER functions below, never via direct anon table access.
alter table public.table_scan_nonces enable row level security;

-- ---------------------------------------------------------------------
-- Drop the old broad anon policies from 0009_ordering_rls.sql. Guest
-- writes now happen exclusively through the RPCs below (which run as
-- SECURITY DEFINER and bypass RLS internally). Guest reads of orders/
-- order_items/service_requests (bill view, order status) are unchanged -
-- only table_sessions loses anon access entirely.
-- ---------------------------------------------------------------------

drop policy if exists table_sessions_public_select on public.table_sessions;
drop policy if exists table_sessions_public_insert on public.table_sessions;
drop policy if exists table_sessions_public_update on public.table_sessions;
drop policy if exists orders_public_insert on public.orders;
drop policy if exists order_items_public_insert on public.order_items;
drop policy if exists service_requests_public_insert on public.service_requests;

-- ---------------------------------------------------------------------
-- Guest RPC surface. Every function is SECURITY DEFINER with a pinned
-- search_path and every reference schema-qualified (neutralizes search-
-- path hijacking); EXECUTE is revoked from PUBLIC (Postgres' default) and
-- re-granted only to anon.
-- ---------------------------------------------------------------------

create or replace function public.issue_scan_nonce(p_table_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.table_scan_nonces (table_id) values (p_table_id)
  returning id into v_id;
  return v_id;
end;
$$;

-- Called once per real guest page load. Consumes the nonce; if this
-- device has any prior row at this table (any status), returns it as-is
-- and never creates another - this is what makes "must rescan" mean
-- something once a session has ended. Only creates a fresh session for a
-- device that has genuinely never been seen at this table before, and
-- only if no other device currently holds the table's ACTIVE session (a
-- different device's takeover happens later, atomically, at order time -
-- see place_guest_order).
create or replace function public.resolve_guest_session(
  p_nonce uuid,
  p_restaurant_id uuid,
  p_table_id uuid,
  p_guest_device_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_nonce_table_id uuid;
  v_mine public.table_sessions;
  v_active public.table_sessions;
begin
  if p_guest_device_token is null or length(trim(p_guest_device_token)) = 0 then
    raise exception 'SCAN_REQUIRED';
  end if;

  if not exists (
    select 1 from public.restaurant_tables t
    join public.restaurants r on r.id = t.restaurant_id
    where t.id = p_table_id
      and t.restaurant_id = p_restaurant_id
      and t.is_active
      and r.status <> 'DISABLED'
  ) then
    raise exception 'RESTAURANT_OR_TABLE_UNAVAILABLE';
  end if;

  update public.table_scan_nonces
    set used_at = v_now
    where id = p_nonce
      and used_at is null
      and created_at > v_now - interval '2 minutes'
      and table_id = p_table_id
    returning table_id into v_nonce_table_id;

  if v_nonce_table_id is null then
    raise exception 'SCAN_REQUIRED';
  end if;

  select * into v_mine
  from public.table_sessions
  where table_id = p_table_id and guest_device_token = p_guest_device_token
  order by opened_at desc
  limit 1;

  if found then
    if v_mine.status = 'ACTIVE' and v_mine.expires_at is not null and v_mine.expires_at < v_now then
      update public.table_sessions
        set status = 'EXPIRED', close_reason = 'TIMEOUT', closed_at = v_now
        where id = v_mine.id
        returning * into v_mine;
    end if;

    return jsonb_build_object(
      'state', case
        when v_mine.status = 'ACTIVE' then 'active'
        when v_mine.status = 'REQUESTED_BILL' then 'requested_bill'
        else 'ended'
      end,
      'session_id', v_mine.id,
      'session_token', v_mine.session_token,
      'expires_at', v_mine.expires_at,
      'close_reason', v_mine.close_reason
    );
  end if;

  -- Never seen this device at this table before. Serialize against
  -- concurrent first-visits/takeovers for this table before deciding.
  perform pg_advisory_xact_lock(hashtextextended('table_session:' || p_table_id::text, 0));

  select * into v_active
  from public.table_sessions
  where table_id = p_table_id and status = 'ACTIVE';

  if found then
    return jsonb_build_object('state', 'unclaimed');
  end if;

  insert into public.table_sessions (
    restaurant_id, table_id, status, session_token, guest_device_token, expires_at
  ) values (
    p_restaurant_id, p_table_id, 'ACTIVE', encode(gen_random_bytes(16), 'hex'),
    p_guest_device_token, v_now + interval '2 hours'
  )
  returning * into v_active;

  return jsonb_build_object(
    'state', 'active',
    'session_id', v_active.id,
    'session_token', v_active.session_token,
    'expires_at', v_active.expires_at,
    'close_reason', null
  );
end;
$$;

-- Lightweight read used by the guest page's ~15s poll loop to notice a
-- staff-side close/expiry without a page reload. No nonce, no creation.
create or replace function public.get_my_session(
  p_table_id uuid,
  p_guest_device_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_mine public.table_sessions;
begin
  if p_guest_device_token is null or length(trim(p_guest_device_token)) = 0 then
    return jsonb_build_object('state', 'unclaimed');
  end if;

  select * into v_mine
  from public.table_sessions
  where table_id = p_table_id and guest_device_token = p_guest_device_token
  order by opened_at desc
  limit 1;

  if not found then
    return jsonb_build_object('state', 'unclaimed');
  end if;

  if v_mine.status = 'ACTIVE' and v_mine.expires_at is not null and v_mine.expires_at < v_now then
    update public.table_sessions
      set status = 'EXPIRED', close_reason = 'TIMEOUT', closed_at = v_now
      where id = v_mine.id
      returning * into v_mine;
  end if;

  return jsonb_build_object(
    'state', case
      when v_mine.status = 'ACTIVE' then 'active'
      when v_mine.status = 'REQUESTED_BILL' then 'requested_bill'
      else 'ended'
    end,
    'session_id', v_mine.id,
    'session_token', v_mine.session_token,
    'expires_at', v_mine.expires_at,
    'close_reason', v_mine.close_reason
  );
end;
$$;

-- The one atomic order-submission function. Everything below happens in
-- a single transaction (the function body): a failed order never leaves
-- an old session closed without its replacement order actually created,
-- since any exception rolls the whole thing back.
create or replace function public.place_guest_order(
  p_restaurant_id uuid,
  p_table_id uuid,
  p_guest_device_token text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_active public.table_sessions;
  v_session public.table_sessions;
  v_has_history boolean;
  v_order_id uuid;
  v_total numeric(10, 2) := 0;
  v_resolved jsonb := '[]'::jsonb;
  v_item jsonb;
  v_product record;
  v_quantity integer;
  v_note text;
begin
  if p_guest_device_token is null or length(trim(p_guest_device_token)) = 0 then
    raise exception 'SESSION_INACTIVE';
  end if;

  if not exists (
    select 1 from public.restaurant_tables t
    join public.restaurants r on r.id = t.restaurant_id
    where t.id = p_table_id
      and t.restaurant_id = p_restaurant_id
      and t.is_active
      and r.status <> 'DISABLED'
  ) then
    raise exception 'RESTAURANT_OR_TABLE_UNAVAILABLE';
  end if;

  -- Serializes every order attempt for this table - the fix for the race
  -- where two concurrent callers could both see "no ACTIVE row" and both
  -- try to insert one, colliding on table_sessions_one_active_per_table.
  perform pg_advisory_xact_lock(hashtextextended('table_session:' || p_table_id::text, 0));

  select * into v_active
  from public.table_sessions
  where table_id = p_table_id and status = 'ACTIVE'
  for update;

  if found and v_active.expires_at is not null and v_active.expires_at < v_now then
    update public.table_sessions
      set status = 'EXPIRED', close_reason = 'TIMEOUT', closed_at = v_now
      where id = v_active.id;
    v_active := null;
  elsif not found then
    v_active := null;
  end if;

  if v_active is null then
    -- Either nothing was ever active here, or this device's own session
    -- just timed out. Only create fresh for a device with zero history
    -- at this table - a device that already had a session here (even a
    -- just-expired one) must rescan, never silently get a new one.
    select exists (
      select 1 from public.table_sessions
      where table_id = p_table_id and guest_device_token = p_guest_device_token
    ) into v_has_history;

    if v_has_history then
      raise exception 'SESSION_INACTIVE';
    end if;

    insert into public.table_sessions (
      restaurant_id, table_id, status, session_token, guest_device_token, expires_at
    ) values (
      p_restaurant_id, p_table_id, 'ACTIVE', encode(gen_random_bytes(16), 'hex'),
      p_guest_device_token, v_now + interval '2 hours'
    )
    returning * into v_session;
  elsif v_active.guest_device_token is distinct from p_guest_device_token then
    -- A different device holds the table's ACTIVE session - takeover,
    -- atomically with this order.
    update public.table_sessions
      set status = 'CLOSED', close_reason = 'REPLACED_BY_NEW_DEVICE', closed_at = v_now
      where id = v_active.id;

    insert into public.table_sessions (
      restaurant_id, table_id, status, session_token, guest_device_token, expires_at
    ) values (
      p_restaurant_id, p_table_id, 'ACTIVE', encode(gen_random_bytes(16), 'hex'),
      p_guest_device_token, v_now + interval '2 hours'
    )
    returning * into v_session;
  else
    v_session := v_active;
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select id, name, price into v_product
    from public.menu_products
    where id = (v_item ->> 'productId')::uuid
      and restaurant_id = p_restaurant_id
      and is_available = true;

    v_quantity := coalesce((v_item ->> 'quantity')::integer, 0);

    if v_product.id is not null and v_quantity > 0 then
      v_note := nullif(trim(both from (v_item ->> 'note')), '');
      v_resolved := v_resolved || jsonb_build_object(
        'product_id', v_product.id,
        'product_name', v_product.name,
        'product_price', v_product.price,
        'quantity', v_quantity,
        'note', v_note
      );
      v_total := v_total + (v_product.price * v_quantity);
    end if;
  end loop;

  if jsonb_array_length(v_resolved) = 0 then
    raise exception 'NO_ITEMS_AVAILABLE';
  end if;

  insert into public.orders (restaurant_id, table_id, table_session_id, total_price)
  values (p_restaurant_id, p_table_id, v_session.id, v_total)
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, product_name, product_price, quantity, note)
  select
    v_order_id,
    (item ->> 'product_id')::uuid,
    item ->> 'product_name',
    (item ->> 'product_price')::numeric,
    (item ->> 'quantity')::integer,
    item ->> 'note'
  from jsonb_array_elements(v_resolved) as item;

  update public.table_sessions
    set last_order_at = v_now, expires_at = v_now + interval '2 hours'
    where id = v_session.id;

  return jsonb_build_object(
    'state', 'active',
    'session_id', v_session.id,
    'session_token', v_session.session_token,
    'expires_at', v_now + interval '2 hours',
    'order_id', v_order_id
  );
end;
$$;

create or replace function public.request_guest_bill(
  p_session_id uuid,
  p_guest_device_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.table_sessions;
begin
  select * into v_session
  from public.table_sessions
  where id = p_session_id and guest_device_token = p_guest_device_token
  for update;

  if not found or v_session.status <> 'ACTIVE' then
    raise exception 'SESSION_INACTIVE';
  end if;

  update public.table_sessions
    set status = 'REQUESTED_BILL', close_reason = 'BILL_REQUESTED'
    where id = v_session.id;

  insert into public.service_requests (restaurant_id, table_id, table_session_id, type)
  values (v_session.restaurant_id, v_session.table_id, v_session.id, 'REQUEST_BILL');

  return jsonb_build_object(
    'state', 'requested_bill',
    'session_id', v_session.id,
    'session_token', v_session.session_token,
    'expires_at', v_session.expires_at
  );
end;
$$;

create or replace function public.guest_call_waiter(
  p_session_id uuid,
  p_guest_device_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.table_sessions;
begin
  select * into v_session
  from public.table_sessions
  where id = p_session_id and guest_device_token = p_guest_device_token;

  if not found or v_session.status not in ('ACTIVE', 'REQUESTED_BILL') then
    raise exception 'SESSION_INACTIVE';
  end if;

  insert into public.service_requests (restaurant_id, table_id, table_session_id, type)
  values (v_session.restaurant_id, v_session.table_id, v_session.id, 'CALL_WAITER');

  return jsonb_build_object('success', true);
end;
$$;

revoke execute on function public.issue_scan_nonce(uuid) from public;
revoke execute on function public.resolve_guest_session(uuid, uuid, uuid, text) from public;
revoke execute on function public.get_my_session(uuid, text) from public;
revoke execute on function public.place_guest_order(uuid, uuid, text, jsonb) from public;
revoke execute on function public.request_guest_bill(uuid, text) from public;
revoke execute on function public.guest_call_waiter(uuid, text) from public;

grant execute on function public.issue_scan_nonce(uuid) to anon;
grant execute on function public.resolve_guest_session(uuid, uuid, uuid, text) to anon;
grant execute on function public.get_my_session(uuid, text) to anon;
grant execute on function public.place_guest_order(uuid, uuid, text, jsonb) to anon;
grant execute on function public.request_guest_bill(uuid, text) to anon;
grant execute on function public.guest_call_waiter(uuid, text) to anon;
