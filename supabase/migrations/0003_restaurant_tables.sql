-- Konobar Sprint 4: restaurant tables + QR tokens
-- Run after 0001_init_schema.sql and 0002_rls_policies.sql, in the SQL Editor.

create table public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null,
  number integer,
  table_token text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index restaurant_tables_restaurant_id_idx on public.restaurant_tables (restaurant_id);

-- Reusable trigger to keep updated_at current; app code never sets it directly.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger restaurant_tables_set_updated_at
before update on public.restaurant_tables
for each row
execute function public.set_updated_at();

-- table_token is generated in app code (crypto-random, not a DB default) so
-- the create-table server action fully controls its shape; it's just a
-- unique, unpredictable string as far as the schema is concerned.
