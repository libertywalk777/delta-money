# Подключение Supabase

1. Скопируй `.env.example` → `.env`, укажи `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` (Project Settings → API).

2. В **SQL Editor** выполни весь файл `supabase/migrations/001_init.sql` (один раз).

3. **Authentication** → **Providers** → **Anonymous** → включить (Save).

Без шагов 2–3 приложение покажет предупреждение; без `.env` данные хранятся только локально в браузере.
