-- Konobar Sprint 7: staff write access + Realtime for the tablet dashboard
-- Run after 0001-0009, in the SQL Editor.

-- 0009 only granted OWNER (and SUPER_ADMIN) write access to table_sessions/
-- orders/service_requests - STAFF was deliberately read-only until the
-- staff dashboard existed to use it. It exists now.

create policy orders_staff_update
on public.orders
for update
using (
  public.current_user_role() = 'STAFF'
  and restaurant_id = public.current_user_restaurant_id()
)
with check (
  public.current_user_role() = 'STAFF'
  and restaurant_id = public.current_user_restaurant_id()
);

create policy table_sessions_staff_update
on public.table_sessions
for update
using (
  public.current_user_role() = 'STAFF'
  and restaurant_id = public.current_user_restaurant_id()
)
with check (
  public.current_user_role() = 'STAFF'
  and restaurant_id = public.current_user_restaurant_id()
);

create policy service_requests_staff_update
on public.service_requests
for update
using (
  public.current_user_role() = 'STAFF'
  and restaurant_id = public.current_user_restaurant_id()
)
with check (
  public.current_user_role() = 'STAFF'
  and restaurant_id = public.current_user_restaurant_id()
);

-- Realtime: add orders and service_requests to the publication Supabase
-- Realtime streams from. Postgres Changes subscriptions still go through
-- RLS using the subscriber's own authenticated role, so STAFF/OWNER only
-- ever receive change events for rows their existing SELECT policies
-- already let them read - no separate "realtime" policy is needed.
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.service_requests;
