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

## 6. Edge Function `telegram-bot` (/start + кнопки мини-аппа)

Токен бота **только** в Secrets Supabase, **никогда** в `VITE_` и не в git.

```bash
supabase secrets set TELEGRAM_BOT_TOKEN=<токен>
supabase secrets set TELEGRAM_MINI_APP_URL=https://твой-хостинг/путь-к-index.html
# опционально защита webhook:
supabase secrets set TELEGRAM_WEBHOOK_SECRET=<случайная_строка>

supabase functions deploy telegram-bot --no-verify-jwt
```

**Webhook** (подставь свой URL функции и токен):

```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<project-ref>.supabase.co/functions/v1/telegram-bot&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

Если задал `TELEGRAM_WEBHOOK_SECRET`, тот же `secret_token` в URL обязателен.

**Важно:** если токен бота светили в чате/репозитории — в @BotFather сделай **Revoke** и заново положи новый токен только в Supabase Secrets.
