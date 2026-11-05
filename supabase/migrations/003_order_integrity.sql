-- ==========================================================================
-- MW — My Wear · order integrity (phase 3)
-- Run this after supabase/schema.sql and 002_admin_sessions.sql:
--   Supabase dashboard → SQL Editor → paste → Run
-- Safe to run again: every statement is idempotent.
-- ==========================================================================

-- 1. Idempotency -----------------------------------------------------------
-- One checkout attempt can only ever create one order, even when the request
-- is retried, double-clicked, or handled by two server instances at once.
alter table public.orders add column if not exists idempotency_key text;

create unique index if not exists orders_idempotency_key_uidx
  on public.orders (idempotency_key)
  where idempotency_key is not null;

-- 2. Status history --------------------------------------------------------
create table if not exists public.order_status_history (
  id bigserial primary key,
  order_number text not null references public.orders (number) on delete cascade,
  from_status text,
  to_status text not null,
  changed_at timestamptz not null default now(),
  source text not null default 'admin'
);

create index if not exists order_status_history_order_idx
  on public.order_status_history (order_number, changed_at desc);

alter table public.order_status_history enable row level security;

-- 3. Status transition guard ----------------------------------------------
-- Mirrors STATUS_TRANSITIONS in src/lib/order-status.ts. Enforced in the
-- database so a bug (or a direct SQL update) cannot skip the workflow.
create or replace function public.guard_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed text[];
begin
  if new.status = old.status then
    return new;
  end if;

  allowed := case old.status
    when 'new'           then array['confirmed', 'cancelled']
    when 'confirmed'     then array['in_production', 'shipped', 'cancelled']
    when 'in_production' then array['shipped', 'cancelled']
    when 'shipped'       then array['delivered', 'cancelled']
    else array[]::text[]            -- delivered / cancelled are terminal
  end;

  if not (new.status = any (allowed)) then
    raise exception 'invalid_status_transition:%->%', old.status, new.status
      using errcode = '23514';
  end if;

  insert into public.order_status_history (order_number, from_status, to_status)
  values (new.number, old.status, new.status);

  return new;
end;
$$;

drop trigger if exists orders_guard_status on public.orders;
create trigger orders_guard_status
  before update of status on public.orders
  for each row execute function public.guard_order_status();

-- 4. Atomic order creation -------------------------------------------------
-- Order row + item rows + initial history row in one transaction. If anything
-- fails, nothing is written: no more "order without items".
--
-- Returns { number, replayed }. When the same idempotency key arrives twice,
-- the second call returns the first order's number and writes nothing.
create or replace function public.create_order(
  p_order jsonb,
  p_items jsonb,
  p_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_number text := nullif(p_order ->> 'number', '');
  v_existing public.orders%rowtype;
  v_key text := nullif(p_key, '');
  v_attempt int := 0;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'create_order: items are required' using errcode = '22023';
  end if;

  if v_number is null or v_number !~ '^MW-[A-Z0-9]{5,12}$' then
    raise exception 'create_order: bad order number' using errcode = '22023';
  end if;

  if v_key is not null and v_key !~ '^[A-Za-z0-9_-]{16,64}$' then
    v_key := null;
  end if;

  -- Replay: same checkout attempt, same order.
  if v_key is not null then
    select * into v_existing from public.orders where idempotency_key = v_key;
    if found then
      return jsonb_build_object('number', v_existing.number, 'replayed', true);
    end if;
  end if;

  loop
    v_attempt := v_attempt + 1;

    begin
      insert into public.orders (
        number, created_at, status, locale,
        customer_name, phone, wilaya_code, wilaya_ar, wilaya_en,
        commune, address, delivery, notes,
        subtotal, delivery_fee, total, idempotency_key
      ) values (
        v_number,
        coalesce((p_order ->> 'created_at')::timestamptz, now()),
        'new',
        coalesce(nullif(p_order ->> 'locale', ''), 'ar'),
        p_order ->> 'customer_name',
        p_order ->> 'phone',
        (p_order ->> 'wilaya_code')::int,
        p_order ->> 'wilaya_ar',
        p_order ->> 'wilaya_en',
        p_order ->> 'commune',
        p_order ->> 'address',
        p_order ->> 'delivery',
        nullif(p_order ->> 'notes', ''),
        (p_order ->> 'subtotal')::int,
        (p_order ->> 'delivery_fee')::int,
        (p_order ->> 'total')::int,
        v_key
      );

      insert into public.order_items (
        order_number, position, slug, name_ar, name_en, type, color_hex,
        color_name_ar, color_name_en, size, qty, unit_price, line_total,
        preview_front, preview_back, design_front, design_back
      )
      select
        v_number,
        coalesce((item ->> 'position')::int, ord - 1),
        item ->> 'slug',
        item ->> 'name_ar',
        item ->> 'name_en',
        item ->> 'type',
        item ->> 'color_hex',
        item ->> 'color_name_ar',
        item ->> 'color_name_en',
        item ->> 'size',
        (item ->> 'qty')::int,
        (item ->> 'unit_price')::int,
        (item ->> 'line_total')::int,
        nullif(item ->> 'preview_front', ''),
        nullif(item ->> 'preview_back', ''),
        nullif(item ->> 'design_front', ''),
        nullif(item ->> 'design_back', '')
      from jsonb_array_elements(p_items) with ordinality as t(item, ord);

      insert into public.order_status_history (order_number, from_status, to_status)
      values (v_number, null, 'new');

      return jsonb_build_object('number', v_number, 'replayed', false);

    exception
      when unique_violation then
        -- Two requests with the same key raced: return the winner.
        if v_key is not null then
          select * into v_existing from public.orders where idempotency_key = v_key;
          if found then
            return jsonb_build_object('number', v_existing.number, 'replayed', true);
          end if;
        end if;

        -- Order number collision: retry with a fresh number.
        if v_attempt >= 5 then
          raise exception 'create_order: could not allocate an order number';
        end if;
        v_number := 'MW-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    end;
  end loop;
end;
$$;

-- Only the server (service role) may create orders this way.
revoke all on function public.create_order(jsonb, jsonb, text) from public;
grant execute on function public.create_order(jsonb, jsonb, text) to service_role;

revoke all on function public.guard_order_status() from public;

comment on function public.create_order(jsonb, jsonb, text) is
  'Atomic order + items insert with idempotency. Called by the Next.js server only.';
