-- MW — My Wear · order storage for Supabase
-- Run this once in the Supabase SQL editor, then set the two env vars
-- described in .env.example.

create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  created_at timestamptz not null default now(),
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled')),
  locale text not null default 'ar' check (locale in ('ar', 'en')),
  customer_name text not null,
  phone text not null,
  wilaya_code int not null,
  wilaya_ar text not null,
  wilaya_en text not null,
  commune text not null,
  address text not null,
  delivery text not null check (delivery in ('home', 'desk')),
  notes text,
  subtotal int not null,
  delivery_fee int not null,
  total int not null
);

create index if not exists orders_phone_idx on public.orders (phone);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

create table if not exists public.order_items (
  id bigserial primary key,
  order_number text not null references public.orders (number) on delete cascade,
  position int not null default 0,
  slug text not null,
  name_ar text not null,
  name_en text not null,
  type text not null,
  color_hex text not null,
  color_name_ar text not null,
  color_name_en text not null,
  size text not null,
  qty int not null check (qty between 1 and 20),
  unit_price int not null,
  line_total int not null,
  preview_front text,
  preview_back text,
  design_front text,
  design_back text
);

create index if not exists order_items_order_idx on public.order_items (order_number);

-- The app talks to these tables with the service role key from the server only.
-- No anon policies are created, so browsers cannot read or write orders directly.
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
