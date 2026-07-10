-- Konobar Sprint 5: menu categories + products
-- Run after 0001-0004, in the SQL Editor.

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menu_products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  category_id uuid references public.menu_categories (id) on delete set null,
  name text not null,
  description text,
  price numeric(10, 2) not null,
  image_url text,
  is_available boolean not null default true,
  is_popular boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index menu_categories_restaurant_id_idx on public.menu_categories (restaurant_id);
create index menu_products_restaurant_id_idx on public.menu_products (restaurant_id);
create index menu_products_category_id_idx on public.menu_products (category_id);

-- Reuses the set_updated_at() trigger function created in 0003.
create trigger menu_categories_set_updated_at
before update on public.menu_categories
for each row
execute function public.set_updated_at();

create trigger menu_products_set_updated_at
before update on public.menu_products
for each row
execute function public.set_updated_at();

-- A product's category (when set) must belong to the same restaurant as the
-- product itself - RLS scopes each table independently by restaurant_id, so
-- without this a write could leave category_id pointing at another tenant's
-- category even though restaurant_id was correctly the caller's own.
create function public.check_menu_product_category_restaurant()
returns trigger
language plpgsql
as $$
begin
  if new.category_id is not null then
    if not exists (
      select 1 from public.menu_categories
      where id = new.category_id and restaurant_id = new.restaurant_id
    ) then
      raise exception 'category_id must belong to the same restaurant as the product';
    end if;
  end if;
  return new;
end;
$$;

create trigger menu_products_check_category
before insert or update on public.menu_products
for each row
execute function public.check_menu_product_category_restaurant();
