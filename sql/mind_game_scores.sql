create table if not exists public.mind_game_scores (
  id bigserial primary key,
  user_id integer not null references public.users(id) on delete cascade,
  game_key text not null,
  result text not null,
  score integer not null default 0,
  duration_seconds integer not null default 0,
  moves integer not null default 0,
  difficulty text not null default 'normal',
  metadata jsonb not null default '{}'::jsonb,
  played_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists mind_game_scores_user_game_played_idx
  on public.mind_game_scores (user_id, game_key, played_at desc);

alter table public.mind_game_scores enable row level security;
