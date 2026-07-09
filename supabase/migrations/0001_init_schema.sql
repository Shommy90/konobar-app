-- Konobar Sprint 2: multi-tenant foundation (roles, restaurants, subscriptions)
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).

create extension if not exists pgcrypto;

create type public.user_role as enum ('SUPER_ADMIN', 'OWNER', 'STAFF');
create type public.restaurant_status as enum ('ACTIVE', 'DISABLED', 'TRIAL');

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  address text,
  status public.restaurant_status not null default 'TRIAL',
  created_at timestamptz not null default now()
);

-- SUPER_ADMIN rows have no restaurant; OWNER/STAFF must belong to exactly one.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null,
  restaurant_id uuid references public.restaurants (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint profiles_role_restaurant_check check (
    (role = 'SUPER_ADMIN' and restaurant_id is null)
    or (role in ('OWNER', 'STAFF') and restaurant_id is not null)
  )
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  plan text not null default 'trial',
  status text not null default 'trialing',
  price numeric(10, 2),
  trial_end timestamptz,
  created_at timestamptz not null default now()
);

create index profiles_restaurant_id_idx on public.profiles (restaurant_id);
create index subscriptions_restaurant_id_idx on public.subscriptions (restaurant_id);

-- Tables intentionally NOT created yet (next sprints): tables, qr_codes, menus,
-- products, orders, table_sessions. They will reference restaurants.id (uuid).
