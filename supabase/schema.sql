-- RK/stats — Supabase schema
-- Run this in Supabase → SQL Editor (one time).

-- Players we record history for (auto-added when someone opens History).
create table if not exists tracked_players (
  tag text primary key,
  added_at timestamptz not null default now()
);

-- Periodic trophy snapshots (written by the hourly cron).
create table if not exists snapshots (
  id bigint generated always as identity primary key,
  tag text not null references tracked_players(tag) on delete cascade,
  captured_at timestamptz not null default now(),
  trophies int not null,
  highest_trophies int,
  exp_level int,
  brawlers_count int
);
create index if not exists snapshots_tag_time on snapshots (tag, captured_at);

-- Battle archive (so history survives past the API's last-25 window).
create table if not exists battles (
  tag text not null,
  battle_time text not null,
  mode text,
  map text,
  type text,
  result text,
  rank int,
  trophy_change int,
  raw jsonb,
  primary key (tag, battle_time)
);
create index if not exists battles_tag_time on battles (tag, battle_time desc);

-- These tables are written only by the server (service-role key), so
-- Row Level Security can stay enabled with no public policies.
alter table tracked_players enable row level security;
alter table snapshots enable row level security;
alter table battles enable row level security;
