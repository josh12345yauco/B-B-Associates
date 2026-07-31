-- ============================================================
-- B&B Associates — analytics_events table
-- Run this ONCE in the Supabase SQL Editor
-- (Dashboard → your project → SQL Editor → New query → paste → Run)
-- ============================================================

create table if not exists public.analytics_events (
  id               bigint generated always as identity primary key,
  event_type       text not null,            -- 'pageview' | 'session' | 'click' | 'conversion' | 'location'
  conversion       text,                     -- 'call' | 'form' | 'estimator' | 'directions' | 'estimator_start' | null
  session_id       text,                     -- one browsing session
  visitor_id       text,                     -- one returning device/browser
  path             text,
  title            text,
  label            text,                     -- button/link text
  href             text,
  tag              text,
  duration_seconds integer,
  referrer         text,
  city             text,
  region           text,
  country          text,
  lat              double precision,
  lng              double precision,
  user_agent       text,
  created_at       timestamptz not null default now()
);

-- Fast filtering for the dashboard
create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_type_idx       on public.analytics_events (event_type);
create index if not exists analytics_events_conversion_idx  on public.analytics_events (conversion);

-- Row Level Security: allow the public site (anon key) to INSERT events
-- and allow the admin dashboard (anon key) to read them.
alter table public.analytics_events enable row level security;

drop policy if exists "anon can insert events" on public.analytics_events;
create policy "anon can insert events"
  on public.analytics_events for insert
  to anon
  with check (true);

drop policy if exists "anon can read events" on public.analytics_events;
create policy "anon can read events"
  on public.analytics_events for select
  to anon
  using (true);
