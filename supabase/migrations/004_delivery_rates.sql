-- ==========================================================================
-- MW — My Wear · delivery prices (phase 4)
-- Run this after supabase/schema.sql, 002_admin_sessions.sql and
-- 003_order_integrity.sql:
--   Supabase dashboard → SQL Editor → paste → Run
-- Safe to run again: every statement is idempotent.
--
-- Algeria has 69 wilayas since Law 26-06 (2026); codes 59–69 are the eleven
-- new ones, run by their parent wilaya until 31 December 2026 at the latest.
--
-- The app treats this table as the source of truth for delivery prices. A
-- wilaya with no row falls back to the launch tariffs in src/lib/algeria.ts,
-- which are placeholders the owner must replace with the carrier's tariff.
-- ==========================================================================

create table if not exists public.delivery_rates (
  wilaya_code integer primary key
    check (wilaya_code between 1 and 69),
  home_fee integer not null
    check (home_fee between 0 and 100000),
  desk_fee integer not null
    check (desk_fee between 0 and 100000),
  updated_at timestamptz not null default now()
);

-- Keep updated_at honest even if a row is edited directly in SQL.
create or replace function public.touch_delivery_rates()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists delivery_rates_touch on public.delivery_rates;
create trigger delivery_rates_touch
  before update on public.delivery_rates
  for each row execute function public.touch_delivery_rates();

-- Prices are written only by the server with the service-role key: no policy
-- means anon and authenticated can neither read nor write this table.
alter table public.delivery_rates enable row level security;

-- The public checkout reads effective prices through /api/delivery-rates,
-- which runs on the server, so no anon policy is needed.
