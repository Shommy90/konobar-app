-- Konobar Sprint 2: Row Level Security
-- Run after 0001_init_schema.sql, in the same SQL Editor.

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.subscriptions enable row level security;

-- security definer functions read `profiles` bypassing RLS (they're owned by
-- the `postgres` role), which avoids infinite recursion when profiles' own
-- policies need to check the caller's role/restaurant_id.
create function public.current_user_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create function public.current_user_restaurant_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select restaurant_id from public.profiles where id = auth.uid()
$$;

-- profiles: a user can always read their own row; SUPER_ADMIN reads everyone;
-- OWNER/STAFF can read the other profiles in their own restaurant (for the
-- staff-management screens planned in a later sprint).
create policy profiles_select on public.profiles
for select
using (
  id = auth.uid()
  or public.current_user_role() = 'SUPER_ADMIN'
  or (
    public.current_user_role() in ('OWNER', 'STAFF')
    and restaurant_id = public.current_user_restaurant_id()
  )
);

-- Writes are SUPER_ADMIN-only for now. Self-service profile edits are left
-- out of this sprint since allowing a user to update their own row without a
-- trigger guard would let them rewrite their own role/restaurant_id.
create policy profiles_insert on public.profiles
for insert
with check (public.current_user_role() = 'SUPER_ADMIN');

create policy profiles_update on public.profiles
for update
using (public.current_user_role() = 'SUPER_ADMIN')
with check (public.current_user_role() = 'SUPER_ADMIN');

create policy profiles_delete on public.profiles
for delete
using (public.current_user_role() = 'SUPER_ADMIN');

-- restaurants: SUPER_ADMIN sees/manages all; OWNER/STAFF can only read their
-- own restaurant row. Writes are SUPER_ADMIN-only until the owner dashboard
-- (later sprint) needs to edit restaurant details.
create policy restaurants_select on public.restaurants
for select
using (
  public.current_user_role() = 'SUPER_ADMIN'
  or id = public.current_user_restaurant_id()
);

create policy restaurants_insert on public.restaurants
for insert
with check (public.current_user_role() = 'SUPER_ADMIN');

create policy restaurants_update on public.restaurants
for update
using (public.current_user_role() = 'SUPER_ADMIN')
with check (public.current_user_role() = 'SUPER_ADMIN');

create policy restaurants_delete on public.restaurants
for delete
using (public.current_user_role() = 'SUPER_ADMIN');

-- subscriptions: same shape as restaurants, scoped by restaurant_id.
create policy subscriptions_select on public.subscriptions
for select
using (
  public.current_user_role() = 'SUPER_ADMIN'
  or restaurant_id = public.current_user_restaurant_id()
);

create policy subscriptions_insert on public.subscriptions
for insert
with check (public.current_user_role() = 'SUPER_ADMIN');

create policy subscriptions_update on public.subscriptions
for update
using (public.current_user_role() = 'SUPER_ADMIN')
with check (public.current_user_role() = 'SUPER_ADMIN');

create policy subscriptions_delete on public.subscriptions
for delete
using (public.current_user_role() = 'SUPER_ADMIN');
