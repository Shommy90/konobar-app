-- Konobar Sprint 6: table sessions, orders, order items, service requests
-- Run after 0001-0007, in the SQL Editor.

create type public.table_session_status as enum ('ACTIVE', 'REQUESTED_BILL', 'CLOSED');
create type public.order_status as enum ('NEW', 'ACCEPTED', 'READY', 'DELIVERED', 'CANCELLED');
create type public.service_request_type as enum ('CALL_WAITER', 'REQUEST_BILL');
create type public.service_request_status as enum ('NEW', 'DONE');

create table public.table_sessions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  table_id uuid not null references public.restaurant_tables (id) on delete cascade,
  status public.table_session_status not null default 'ACTIVE',
  session_token text not null unique,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  last_activity_at timestamptz not null default now()
);

-- Only one ACTIVE session per table at a time - this is what makes the
-- guest page's "find-or-create" flow race-safe: two guests hitting the
-- QR link at the same instant can't both create a session, one insert
-- wins and the loser's app code re-fetches the winner's row.
create unique index table_sessions_one_active_per_table
on public.table_sessions (table_id)
where status = 'ACTIVE';

create index table_sessions_restaurant_id_idx on public.table_sessions (restaurant_id);
create index table_sessions_table_id_idx on public.table_sessions (table_id);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  table_id uuid not null references public.restaurant_tables (id) on delete cascade,
  table_session_id uuid not null references public.table_sessions (id) on delete cascade,
  status public.order_status not null default 'NEW',
  total_price numeric(10, 2) not null check (total_price >= 0),
  note text,
  created_at timestamptz not null default now()
);

create index orders_restaurant_id_idx on public.orders (restaurant_id);
create index orders_table_session_id_idx on public.orders (table_session_id);

-- product_name/product_price are snapshots taken at order time, not a
-- live join to menu_products - so a later price change or product
-- deletion never rewrites the guest's order history.
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.menu_products (id) on delete set null,
  product_name text not null,
  product_price numeric(10, 2) not null check (product_price >= 0),
  quantity integer not null default 1 check (quantity > 0),
  note text
);

create index order_items_order_id_idx on public.order_items (order_id);

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  table_id uuid not null references public.restaurant_tables (id) on delete cascade,
  table_session_id uuid not null references public.table_sessions (id) on delete cascade,
  type public.service_request_type not null,
  status public.service_request_status not null default 'NEW',
  created_at timestamptz not null default now()
);

create index service_requests_restaurant_id_idx on public.service_requests (restaurant_id);
create index service_requests_table_session_id_idx on public.service_requests (table_session_id);
