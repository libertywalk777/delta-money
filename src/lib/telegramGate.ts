import WebApp from '@twa-dev/sdk';
import { isSupabaseConfigured } from './supabase';

/**
 * Заглушка только при подключённом Supabase (прод в TG).
 * Без .env — локальный режим, браузер ок. Для dev с Supabase в Chrome: VITE_ALLOW_BROWSER_DEV=1
 */
export function mustOpenInTelegramMobile(): boolean {
  if (import.meta.env.VITE_ALLOW_BROWSER_DEV === '1') return false;
  if (!isSupabaseConfigured()) return false;

  const initData = WebApp.initData;
  if (!initData || initData.length === 0) return true;

  const p = WebApp.platform;
  // Десктопные приложения Telegram
  if (p === 'tdesktop' || p === 'macos') return true;

  return false;
}
