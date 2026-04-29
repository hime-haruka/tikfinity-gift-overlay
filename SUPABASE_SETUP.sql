create table if not exists overlay_client_states (
  client_id text primary key,
  state jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table overlay_client_states enable row level security;
