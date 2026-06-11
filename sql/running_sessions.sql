create table if not exists public.running_sessions (
  id bigserial primary key,
  user_id integer not null references public.users(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  date date not null,
  duration_seconds integer not null default 0,
  distance_meters numeric not null default 0,
  calories integer not null default 0,
  average_pace_seconds_per_km integer not null default 0,
  route jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists running_sessions_user_started_idx
  on public.running_sessions (user_id, started_at desc);

alter table public.running_sessions enable row level security;
