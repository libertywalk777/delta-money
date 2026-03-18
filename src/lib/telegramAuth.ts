import WebApp from '@twa-dev/sdk';
import type { SupabaseClient } from '@supabase/supabase-js';

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
