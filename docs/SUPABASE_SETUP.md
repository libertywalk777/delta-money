# Supabase + Telegram Mini App

## 1. Переменные

Скопируй `.env.example` → `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## 2. SQL

В **SQL Editor** по очереди:

1. Весь файл `supabase/migrations/001_init.sql`
2. Весь файл `supabase/migrations/002_telegram_auth_map.sql`

## 3. Anonymous выключить

**Authentication → Providers → Anonymous** — **выключить** (вход только через Telegram).

## 4. Edge Function `telegram-auth`

```bash
# из корня проекта, с установленным Supabase CLI
supabase link --project-ref ТВОЙ_REF
supabase secrets set TELEGRAM_BOT_TOKEN=токен_от_BotFather
supabase functions deploy telegram-auth --no-verify-jwt
```

Токен бота — тот же, что у мини-приложения в BotFather.

Функция проверяет подпись `initData` и выдаёт сессию Supabase (без анонимов): один Telegram-пользователь = один `auth.users`.

## 5. Разработка в браузере

С `.env` приложение открывается только из Telegram на телефоне. Для `npm run dev` в Chrome добавь в `.env`:

`VITE_ALLOW_BROWSER_DEV=1`
