import { motion } from 'framer-motion';
import { Smartphone, Send } from 'lucide-react';

export function OpenInTelegramGate() {
  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center px-8 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-sm"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-[#007AFF]/12 flex items-center justify-center">
          <Smartphone className="w-10 h-10 text-[#007AFF]" strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-3 leading-snug">
          Откройте, пожалуйста, на телефоне в Telegram
        </h1>
        <p className="text-gray-600 text-sm leading-relaxed mb-8">
          Это мини-приложение доступно только внутри Telegram на смартфоне. Зайдите в бота с
          телефона и откройте приложение оттуда.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Send size={16} className="text-[#007AFF]" />
          <span>Telegram → ваш бот → меню / кнопка приложения</span>
        </div>
      </motion.div>
    </div>
  );
}
