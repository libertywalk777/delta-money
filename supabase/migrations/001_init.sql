-- Delta Money / Investment Tracker — схема для Supabase
-- Выполни в SQL Editor: https://supabase.com/dashboard/project/_/sql/new
-- Затем: Authentication → Providers → Anonymous → включить

create extension if not exists "pgcrypto";

-- Триггер: user_id = auth.uid() при вставке
create or replace function public.set_row_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$;

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('stock', 'deposit')),
  name text not null,
  ticker text,
  quantity numeric,
  buy_price numeric,
  current_price numeric,
  amount numeric,
  rate numeric,
  start_date text,
  end_date text,
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_id uuid references public.assets(id) on delete set null,
  asset_name text not null,
  type text not null check (type in ('buy', 'sell', 'deposit')),
  amount numeric not null,
  price numeric,
  currency text not null,
  date text not null,
  comment text
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric not null,
  current_amount numeric not null default 0,
  currency text not null,
  deadline text not null,
  color text not null,
  created_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_currency text not null default 'USD',
  currency_rates jsonb not null default '{"USD":1,"UZS":12500,"EUR":0.92,"RUB":90}'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger assets_set_user_id
  before insert on public.assets
  for each row execute procedure public.set_row_user_id();

create trigger transactions_set_user_id
  before insert on public.transactions
  for each row execute procedure public.set_row_user_id();

create trigger goals_set_user_id
  before insert on public.goals
  for each row execute procedure public.set_row_user_id();

create trigger user_settings_set_user_id
  before insert on public.user_settings
  for each row execute procedure public.set_row_user_id();

alter table public.assets enable row level security;
alter table public.transactions enable row level security;
alter table public.goals enable row level security;
alter table public.user_settings enable row level security;

create policy "assets_crud_own" on public.assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transactions_crud_own" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goals_crud_own" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "settings_select_own" on public.user_settings
  for select using (auth.uid() = user_id);

create policy "settings_insert_own" on public.user_settings
  for insert with check (auth.uid() = user_id);

create policy "settings_update_own" on public.user_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index assets_user_id_idx on public.assets(user_id);
create index transactions_user_id_idx on public.transactions(user_id);
create index goals_user_id_idx on public.goals(user_id);
