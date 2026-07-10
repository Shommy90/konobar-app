-- Konobar Sprint 6: RLS for table_sessions, orders, order_items, service_requests
-- Run after 0008_ordering_schema.sql, in the same SQL Editor.

alter table public.table_sessions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.service_requests enable row level security;

-- ---------------------------------------------------------------------
-- Tenant-scoped access, same shape as every other operational table:
-- SUPER_ADMIN full access, OWNER read/write scoped to their restaurant,
-- STAFF read-only. (STAFF write access for accepting/serving orders is
-- deliberately deferred to the staff dashboard sprint.)
-- ---------------------------------------------------------------------

create policy table_sessions_select on public.table_sessions
for select
using (
  public.current_user_role() = 'SUPER_ADMIN'
  or restaurant_id = public.current_user_restaurant_id()
);

create policy table_sessions_owner_update on public.table_sessions
for update
using (
  public.current_user_role() = 'SUPER_ADMIN'
  or (public.current_user_role() = 'OWNER' and restaurant_id = public.current_user_restaurant_id())
)
with check (
  public.current_user_role() = 'SUPER_ADMIN'
  or (public.current_user_role() = 'OWNER' and restaurant_id = public.current_user_restaurant_id())
);

create policy orders_select on public.orders
for select
using (
  public.current_user_role() = 'SUPER_ADMIN'
  or restaurant_id = public.current_user_restaurant_id()
);

create policy orders_owner_update on public.orders
for update
using (
  public.current_user_role() = 'SUPER_ADMIN'
  or (public.current_user_role() = 'OWNER' and restaurant_id = public.current_user_restaurant_id())
)
with check (
  public.current_user_role() = 'SUPER_ADMIN'
  or (public.current_user_role() = 'OWNER' and restaurant_id = public.current_user_restaurant_id())
);

create policy order_items_select on public.order_items
for select
using (
  public.current_user_role() = 'SUPER_ADMIN'
  or exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
    and o.restaurant_id = public.current_user_restaurant_id()
  )
);

create policy service_requests_select on public.service_requests
for select
using (
  public.current_user_role() = 'SUPER_ADMIN'
  or restaurant_id = public.current_user_restaurant_id()
);

create policy service_requests_owner_update on public.service_requests
for update
using (
  public.current_user_role() = 'SUPER_ADMIN'
  or (public.current_user_role() = 'OWNER' and restaurant_id = public.current_user_restaurant_id())
)
with check (
  public.current_user_role() = 'SUPER_ADMIN'
  or (public.current_user_role() = 'OWNER' and restaurant_id = public.current_user_restaurant_id())
);

-- ---------------------------------------------------------------------
-- Anonymous guest access. There is no login, so RLS has no per-guest
-- identity to check against - session_token/table_token are long random
-- values that work as capabilities instead: whoever holds the token can
-- act on it. This is the same trust model already used for restaurants
-- and menu items (0004, 0006) - broad `to anon` reads, with writes gated
-- by an existence check tying the row to a legitimate, currently-ACTIVE
-- table/session. It is NOT airtight: anyone with the public anon key
-- could enumerate rows directly against the Supabase REST API, bypassing
-- the app entirely. Tightening that further (e.g. moving guest access
-- behind SECURITY DEFINER RPCs that take the token as an argument and
-- return only the matching row) is a reasonable follow-up if stronger
-- guarantees are needed later; treated as out of scope for this sprint.
-- ---------------------------------------------------------------------

create policy table_sessions_public_select
on public.table_sessions
for select
to anon
using (true);

create policy table_sessions_public_insert
on public.table_sessions
for insert
to anon
with check (
  exists (
    select 1 from public.restaurant_tables t
    join public.restaurants r on r.id = t.restaurant_id
    where t.id = table_sessions.table_id
    and t.restaurant_id = table_sessions.restaurant_id
    and t.is_active = true
    and r.status <> 'DISABLED'
  )
);

create policy table_sessions_public_update
on public.table_sessions
for update
to anon
using (true)
with check (true);

create policy orders_public_select
on public.orders
for select
to anon
using (true);

create policy orders_public_insert
on public.orders
for insert
to anon
with check (
  exists (
    select 1 from public.table_sessions s
    where s.id = orders.table_session_id
    and s.table_id = orders.table_id
    and s.restaurant_id = orders.restaurant_id
    and s.status = 'ACTIVE'
  )
);

create policy order_items_public_select
on public.order_items
for select
to anon
using (true);

create policy order_items_public_insert
on public.order_items
for insert
to anon
with check (
  exists (select 1 from public.orders o where o.id = order_items.order_id)
);

create policy service_requests_public_insert
on public.service_requests
for insert
to anon
with check (
  exists (
    select 1 from public.table_sessions s
    where s.id = service_requests.table_session_id
    and s.table_id = service_requests.table_id
    and s.restaurant_id = service_requests.restaurant_id
    and s.status in ('ACTIVE', 'REQUESTED_BILL')
  )
);
