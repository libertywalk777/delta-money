# Деплой `telegram-bot` без глобального `supabase`

Если в терминале **`supabase: команда не найдена`** — используй CLI через проект.

## 0. Один раз: войти в Supabase

```bash
cd "/path/to/investment-tracker-mini-app"
npx supabase login
```

Откроется браузер — вставь **access token** из  
[Dashboard → Account → Access Tokens](https://supabase.com/dashboard/account/tokens).

## 1. Узнать `project-ref`

Из URL проекта: `https://supabase.com/dashboard/project/wzwgszqbxubsrqlrzsni`  
→ ref = **`wzwgszqbxubsrqlrzsni`** (у тебя может быть другой).

Или из `.env`: `VITE_SUPABASE_URL=https://ВАШ_REF.supabase.co` → **`ВАШ_REF`**.

## 2. Секреты (токен бота + URL мини-аппа)

```bash
npx supabase secrets set TELEGRAM_BOT_TOKEN="токен_от_BotFather" --project-ref ТВОЙ_REF
npx supabase secrets set TELEGRAM_MINI_APP_URL="https://твой-хост/index.html" --project-ref ТВОЙ_REF
```

Опционально защита webhook:

```bash
npx supabase secrets set TELEGRAM_WEBHOOK_SECRET="случайная_длинная_строка" --project-ref ТВОЙ_REF
```

## 3. Деплой функции

**Без `link`** (самый простой путь):

```bash
npx supabase functions deploy telegram-bot --no-verify-jwt --project-ref ТВОЙ_REF
```

Если хочешь через link (один раз):

```bash
npx supabase link --project-ref ТВОЙ_REF
npx supabase functions deploy telegram-bot --no-verify-jwt
```

## 4. Docker не обязателен

Флаг **`--use-api`** деплоит через API без локального Docker:

```bash
npx supabase functions deploy telegram-bot --no-verify-jwt --project-ref ТВОЙ_REF --use-api
```

## 5. Webhook в Telegram

После успешного деплоя URL функции:

`https://ТВОЙ_REF.supabase.co/functions/v1/telegram-bot`

```text
https://api.telegram.org/bot<ТОКЕН_БОТА>/setWebhook?url=https://ТВОЙ_REF.supabase.co/functions/v1/telegram-bot
```

Если задал `TELEGRAM_WEBHOOK_SECRET`, добавь в конец URL:

`&secret_token=ТА_ЖЕ_СТРОКА`

## NPM-скрипт в проекте

```bash
npm run deploy:telegram-bot -- --project-ref ТВОЙ_REF
```

(скрипт вызывает deploy с `--use-api` по умолчанию — см. `package.json`.)
