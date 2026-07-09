-- Konobar Sprint 4: RLS for restaurant_tables + public guest read access
-- Run after 0003_restaurant_tables.sql, in the same SQL Editor.

alter table public.restaurant_tables enable row level security;

-- SUPER_ADMIN sees/manages every table; OWNER/STAFF only see their own
-- restaurant's tables. Only SUPER_ADMIN and OWNER can write - STAFF is
-- read-only here (matches the STAFF scoping used on other tenant tables).
create policy restaurant_tables_select on public.restaurant_tables
for select
using (
  public.current_user_role() = 'SUPER_ADMIN'
  or restaurant_id = public.current_user_restaurant_id()
);

create policy restaurant_tables_insert on public.restaurant_tables
for insert
with check (
  public.current_user_role() = 'SUPER_ADMIN'
  or (
    public.current_user_role() = 'OWNER'
    and restaurant_id = public.current_user_restaurant_id()
  )
);

create policy restaurant_tables_update on public.restaurant_tables
for update
using (
  public.current_user_role() = 'SUPER_ADMIN'
  or (
    public.current_user_role() = 'OWNER'
    and restaurant_id = public.current_user_restaurant_id()
  )
)
with check (
  public.current_user_role() = 'SUPER_ADMIN'
  or (
    public.current_user_role() = 'OWNER'
    and restaurant_id = public.current_user_restaurant_id()
  )
);

create policy restaurant_tables_delete on public.restaurant_tables
for delete
using (
  public.current_user_role() = 'SUPER_ADMIN'
  or (
    public.current_user_role() = 'OWNER'
    and restaurant_id = public.current_user_restaurant_id()
  )
);

-- Guests scanning a QR code are unauthenticated (Postgres role `anon`), so
-- the tenant-scoped policies above don't apply to them at all. These two
-- policies are scoped `to anon` only - they don't affect the authenticated
-- policies above, and only expose what a guest already sees on a printed
-- QR code anyway: which restaurant/table it points to and whether it's live.
create policy restaurants_public_select on public.restaurants
for select
to anon
using (true);

create policy restaurant_tables_public_select on public.restaurant_tables
for select
to anon
using (true);
