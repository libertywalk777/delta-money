alter table public.user_settings
  add column if not exists phone text;

comment on column public.user_settings.phone is 'Номер из Telegram requestContact (E.164), опционально';
