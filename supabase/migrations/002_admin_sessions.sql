-- MW — My Wear · admin session revocation
-- Run this after supabase/schema.sql so logout invalidates the cookie on every
-- server instance and every Next.js bundle. Without it, logout is local to the
-- Node process (fine for local development, not for multi-instance hosting).

create table if not exists public.admin_revoked_sessions (
  jti text primary key,
  revoked_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists admin_revoked_sessions_expires_idx
  on public.admin_revoked_sessions (expires_at);

-- The table is touched only by the server with the service role key.
alter table public.admin_revoked_sessions enable row level security;

-- Optional: remove expired rows automatically instead of on each logout.
-- (The app also deletes them opportunistically.)
comment on table public.admin_revoked_sessions is
  'Admin session ids revoked by logout, kept until the session would expire anyway.';
