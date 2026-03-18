/**
 * Webhook бота: /start → приветствие + кнопка Web App «Меню».
 *
 * 1. Deploy: supabase functions deploy telegram-bot --no-verify-jwt
 * 2. Secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_MINI_APP_URL (https://… страницы мини-аппа)
 * 3. Опционально: TELEGRAM_WEBHOOK_SECRET — тот же secret_token в setWebhook
 * 4. setWebhook:
 *    https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<ref>.supabase.co/functions/v1/telegram-bot&secret_token=<SECRET>
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

function startBody(greeting: string) {
  return (
    `${greeting}\n\n` +
    `Delta Money — учёт инвестиций, портфеля и целей в одном месте.\n\n` +
    `Нажми кнопку ниже, чтобы открыть мини-приложение.\n\n` +
    `/start — показать это сообщение снова`
  );
}

serve(async (req) => {
  const secret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET');
  if (secret) {
    const sent = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (sent !== secret) {
      return new Response('forbidden', { status: 403 });
    }
  }

  if (req.method !== 'POST') {
    return new Response('ok');
  }

  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const miniAppUrl = Deno.env.get('TELEGRAM_MINI_APP_URL');
  if (!token || !miniAppUrl) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing secrets' }), {
      status: 500,
    });
  }

  try {
    const update = (await req.json()) as {
      message?: {
        chat: { id: number };
        text?: string;
        from?: { first_name?: string };
      };
    };

    const msg = update.message;
    if (!msg?.chat?.id) {
      return new Response(JSON.stringify({ ok: true }));
    }

    const text = (msg.text ?? '').trim();
    if (text.startsWith('/start')) {
      const name = msg.from?.first_name?.trim() || '';
      const greeting = name ? `👋 Привет, ${name}!` : '👋 Привет!';

      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: msg.chat.id,
          text: startBody(greeting),
          reply_markup: {
            keyboard: [
              [{ text: '📱 Открыть приложение', web_app: { url: miniAppUrl } }],
              [{ text: '📊 Меню', web_app: { url: miniAppUrl } }],
            ],
            resize_keyboard: true,
            is_persistent: true,
          },
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true }));
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
});
