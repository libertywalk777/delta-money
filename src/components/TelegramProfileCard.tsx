import { motion } from 'framer-motion';
import { AtSign, Hash, Languages, Smartphone, Crown } from 'lucide-react';
import {
  useTelegramUser,
  displayTelegramName,
  type TelegramUserInfo,
} from '../hooks/useTelegramUser';

function initials(user: TelegramUserInfo) {
  const a = user.first_name?.[0] ?? '';
  const b = user.last_name?.[0] ?? '';
  return (a + b).toUpperCase() || '?';
}

export function TelegramProfileCard() {
  const { user, isInsideTelegram } = useTelegramUser();

  if (!isInsideTelegram || !user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-4 border border-dashed border-gray-200 bg-gray-50/80"
      >
        <p className="text-sm text-gray-600 text-center py-2">
          Откройте приложение в <strong>Telegram</strong>, чтобы отображался ваш профиль
        </p>
      </motion.div>
    );
  }

  const name = displayTelegramName(user);
  const lang = user.language_code?.toUpperCase() ?? '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card mb-4 overflow-hidden"
    >
      <div className="flex gap-4 items-start">
        <div className="relative flex-shrink-0">
          {user.photo_url ? (
            <img
              src={user.photo_url}
              alt=""
              className="w-16 h-16 rounded-2xl object-cover bg-gray-100 ring-2 ring-white shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white text-xl font-semibold shadow-sm">
              {initials(user)}
            </div>
          )}
          {user.is_premium && (
            <div
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow border-2 border-white"
              title="Telegram Premium"
            >
              <Crown size={12} className="text-amber-900" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <h2 className="text-lg font-bold text-gray-900 truncate">{name}</h2>
          {user.username ? (
            <a
              href={`https://t.me/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#007AFF] text-sm font-medium mt-0.5"
            >
              <AtSign size={14} className="opacity-80" />@{user.username}
            </a>
          ) : (
            <p className="text-sm text-gray-400 mt-0.5">Ник не указан</p>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 space-y-2.5">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Hash size={15} className="text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-400">Telegram ID</div>
            <div className="font-mono text-gray-900 tabular-nums">{user.id}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Languages size={15} className="text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-400">Язык интерфейса</div>
            <div className="text-gray-900">{lang}</div>
          </div>
        </div>

        <div className="flex items-start gap-3 text-sm">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Smartphone size={15} className="text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-400">Телефон</div>
            <div className="text-gray-500 text-sm leading-snug">
              В Mini App Telegram <strong>не передаёт</strong> номер телефона. Его можно
              запросить у бота отдельно (кнопка «Поделиться контактом»).
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
