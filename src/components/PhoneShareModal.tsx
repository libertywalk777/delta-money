import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, X } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import type { RequestContactResponse } from '@twa-dev/types';
import { useStore } from '../store';
import { getSupabase } from '../lib/supabase';
import * as db from '../lib/db';

const STORAGE_KEY = 'delta_phone_modal_later';

function extractPhone(response: RequestContactResponse | undefined): string | null {
  if (!response || response.status !== 'sent') return null;
  const c = response.responseUnsafe?.contact;
  return c?.phone_number?.trim() || null;
}

export function PhoneShareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const setPhoneInStore = (phone: string) => {
    useStore.setState({ phone });
  };

  const handleLater = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    onClose();
  };

  const handleSend = () => {
    setErr(null);
    setLoading(true);
    WebApp.requestContact((access, response) => {
      setLoading(false);
      if (!access) {
        setErr('Доступ не получен. Можно попробовать ещё раз позже.');
        return;
      }
      const phone = extractPhone(response);
      if (!phone) {
        setErr('Не удалось прочитать номер. Обновите Telegram и попробуйте снова.');
        return;
      }
      const supabase = getSupabase();
      void (async () => {
        try {
          await db.saveUserPhone(supabase, phone);
          setPhoneInStore(phone);
          try {
            (WebApp as { HapticFeedback?: { notificationOccurred: (t: string) => void } }).HapticFeedback?.notificationOccurred?.(
              'success'
            );
          } catch {
            /* */
          }
          onClose();
        } catch (e) {
          setErr(e instanceof Error ? e.message : 'Ошибка сохранения');
        }
      })();
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/45 z-[100]"
            onClick={loading ? undefined : handleLater}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-[24px] shadow-2xl px-5 pt-6 pb-8 max-w-md mx-auto safe-area-pb"
          >
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={handleLater}
                disabled={loading}
                className="p-2 -mr-2 text-gray-400 active:opacity-70"
                aria-label="Закрыть"
              >
                <X size={22} />
              </button>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-[#007AFF]/12 flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-7 h-7 text-[#007AFF]" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center mb-2">
              Поделитесь номером телефона
            </h2>
            <p className="text-sm text-gray-600 text-center leading-relaxed mb-6">
              Номер нужен для связи с вами и восстановления доступа. Он хранится только у нас и не
              публикуется.
            </p>
            {err && (
              <p className="text-sm text-red-600 text-center mb-4 px-2">{err}</p>
            )}
            <button
              type="button"
              disabled={loading}
              onClick={handleSend}
              className="w-full py-3.5 rounded-2xl bg-[#007AFF] text-white font-semibold text-base active:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Ожидание…' : 'Отправить номер'}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleLater}
              className="w-full mt-3 py-3 text-gray-500 text-sm font-medium active:opacity-70"
            >
              Позже
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function wasPhoneModalPostponed(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}
