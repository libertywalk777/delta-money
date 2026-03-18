-- Связка Telegram user id ↔ Supabase auth user (для Edge Function telegram-auth)
create table if not exists public.telegram_auth_map (
  telegram_id bigint primary key,
  user_id uuid not null unique,
  created_at timestamptz not null default now()
);

alter table public.telegram_auth_map enable row level security;

-- Только service role (Edge Function) обходит RLS
comment on table public.telegram_auth_map is 'Служебная таблица для привязки Telegram ID к auth.users; пишет только Edge Function.';
