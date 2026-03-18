import WebApp from '@twa-dev/sdk';
import type { SupabaseClient, User } from '@supabase/supabase-js';

function telegramIdFromSupabaseUser(user: User | null): number | null {
  if (!user) return null;
  const meta = user.user_metadata as { telegram_id?: number } | undefined;
  if (meta?.telegram_id != null && Number.isFinite(Number(meta.telegram_id))) {
    return Number(meta.telegram_id);
  }
  const m = user.email?.match(/^tg_(\d+)@/);
  if (m) return Number(m[1]);
  return null;
}

/**
 * Сессия в WebView может остаться от другого аккаунта Telegram — сбрасываем и входим заново.
 */
export async function ensureSupabaseMatchesTelegramUser(
  supabase: SupabaseClient
): Promise<void> {
  const tg = WebApp.initDataUnsafe?.user;
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!tg?.id) {
    if (!session?.user) await signInWithTelegram(supabase);
    return;
  }
  const currentTgId = tg.id;
  const sessionTgId = telegramIdFromSupabaseUser(session?.user ?? null);

  if (session?.user && sessionTgId === currentTgId) return;

  await supabase.auth.signOut({ scope: 'local' });
  await signInWithTelegram(supabase);
}

/**
 * Вход в Supabase по подписанному initData Telegram (Edge Function telegram-auth).
 */
export async function signInWithTelegram(supabase: SupabaseClient): Promise<void> {
  const initData = WebApp.initData;
  if (!initData) throw new Error('Нет initData Telegram');

  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const res = await fetch(`${url.replace(/\/$/, '')}/functions/v1/telegram-auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
    },
    body: JSON.stringify({ initData }),
  });

  const text = await res.text();
  let body: { email?: string; password?: string; error?: string };
  try {
    body = JSON.parse(text) as typeof body;
  } catch {
    throw new Error(text || `HTTP ${res.status}`);
  }

  if (!res.ok) {
    throw new Error(body.error || text || `HTTP ${res.status}`);
  }

  if (!body.email || !body.password) {
    throw new Error('Неверный ответ telegram-auth');
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });
  if (error) throw error;
}
