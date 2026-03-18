import { useMemo } from 'react';
import WebApp from '@twa-dev/sdk';
import type { WebAppUser } from '@twa-dev/types';

export type TelegramUserInfo = WebAppUser & {
  allows_write_to_pm?: boolean;
  added_to_attachment_menu?: boolean;
};

/**
 * Данные пользователя из Telegram Mini App (initDataUnsafe.user).
 * Номер телефона Telegram в WebApp не отдаёт — только через отдельный запрос контакта у бота.
 */
export function useTelegramUser() {
  return useMemo(() => {
    const user = WebApp.initDataUnsafe?.user as TelegramUserInfo | undefined;
    const hasInitData = Boolean(WebApp.initData && WebApp.initData.length > 0);
    return {
      user: user ?? null,
      isInsideTelegram: hasInitData,
      platform: WebApp.platform,
    };
  }, []);
}

export function displayTelegramName(user: TelegramUserInfo): string {
  const parts = [user.first_name, user.last_name].filter(Boolean);
  return parts.join(' ').trim() || user.first_name;
}
