-- Konobar Sprint 5: RLS for menu_categories + menu_products
-- Run after 0005_menu_schema.sql, in the same SQL Editor.

alter table public.menu_categories enable row level security;
alter table public.menu_products enable row level security;

-- Tenant-scoped access, same shape as restaurant_tables (0004): SUPER_ADMIN
-- full access, OWNER read/write scoped to their own restaurant, STAFF
-- read-only.
create policy menu_categories_select on public.menu_categories
for select
using (
  public.current_user_role() = 'SUPER_ADMIN'
  or restaurant_id = public.current_user_restaurant_id()
);

create policy menu_categories_insert on public.menu_categories
for insert
with check (
  public.current_user_role() = 'SUPER_ADMIN'
  or (
    public.current_user_role() = 'OWNER'
    and restaurant_id = public.current_user_restaurant_id()
  )
);

create policy menu_categories_update on public.menu_categories
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

create policy menu_products_select on public.menu_products
for select
using (
  public.current_user_role() = 'SUPER_ADMIN'
  or restaurant_id = public.current_user_restaurant_id()
);

create policy menu_products_insert on public.menu_products
for insert
with check (
  public.current_user_role() = 'SUPER_ADMIN'
  or (
    public.current_user_role() = 'OWNER'
    and restaurant_id = public.current_user_restaurant_id()
  )
);

create policy menu_products_update on public.menu_products
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

-- Guests scanning a QR code are unauthenticated (`anon`). "Active
-- restaurant" here means not DISABLED - a TRIAL restaurant's menu must
-- stay visible to guests, matching the guest page's own validation
-- (0004/guest page only blocks on status = 'DISABLED').
create policy menu_categories_public_select on public.menu_categories
for select
to anon
using (
  is_active = true
  and exists (
    select 1 from public.restaurants r
    where r.id = menu_categories.restaurant_id
    and r.status <> 'DISABLED'
  )
);

create policy menu_products_public_select on public.menu_products
for select
to anon
using (
  is_available = true
  and exists (
    select 1 from public.restaurants r
    where r.id = menu_products.restaurant_id
    and r.status <> 'DISABLED'
  )
  and (
    category_id is null
    or exists (
      select 1 from public.menu_categories c
      where c.id = menu_products.category_id
      and c.is_active = true
    )
  )
);
