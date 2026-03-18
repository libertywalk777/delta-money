import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
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

function cleanUsername(raw?: string) {
  if (!raw) return '';
  return raw.replace(/^@+/, '').trim();
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
  const username = cleanUsername(user.username);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card mb-4 overflow-hidden"
    >
      <div className="flex gap-4 items-center">
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

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-900 truncate">{name}</h2>
          {username ? (
            <a
              href={`https://t.me/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#007AFF] text-sm font-medium mt-0.5 block truncate"
            >
              @{username}
            </a>
          ) : (
            <p className="text-sm text-gray-400 mt-0.5">Ник не указан</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
