import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  DollarSign, 
  TrendingUp, 
  Trash2, 
  Wallet,
  Target,
  Receipt,
  HelpCircle,
  Star,
  Bell,
  Shield,
  Moon,
  Check
} from 'lucide-react';
import { useStore } from '../store';
import { CURRENCIES } from '../types';

interface SettingsItemProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  value?: string;
  onClick?: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}

function SettingsItem({ 
  icon, 
  iconBg, 
  title, 
  subtitle,
  value, 
  onClick, 
  showChevron = true,
  rightElement,
  destructive
}: SettingsItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-3 flex items-center gap-3 active:bg-gray-50 transition-colors"
    >
      <div className={`w-7 h-7 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <span className={`font-normal ${destructive ? 'text-red-500' : 'text-gray-900'}`}>
          {title}
        </span>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {rightElement}
      {value && (
        <span className="text-gray-400 text-sm">{value}</span>
      )}
      {showChevron && !rightElement && (
        <ChevronRight className="w-5 h-5 text-gray-300" />
      )}
    </button>
  );
}

function SettingsGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      {title && (
        <h3 className="text-xs font-normal text-gray-500 uppercase tracking-wide px-4 mb-2">
          {title}
        </h3>
      )}
      <div className="bg-white rounded-xl overflow-hidden divide-y divide-gray-100">
        {children}
      </div>
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange(!enabled);
      }}
      className={`w-12 h-7 rounded-full transition-colors relative ${
        enabled ? 'bg-green-500' : 'bg-gray-200'
      }`}
    >
      <motion.div
        className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm"
        animate={{ left: enabled ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

export function Settings() {
  const { 
    displayCurrency, 
    currencyRates,
    setDisplayCurrency,
    setCurrencyRate,
    clearAllData, 
    assets, 
    transactions, 
    goals,
    useCloud,
  } = useStore();
  
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showRatesEditor, setShowRatesEditor] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleRateChange = (currency: string, value: string) => {
    const rate = parseFloat(value) || 0;
    setCurrencyRate(currency, rate);
  };

  const currentCurrency = CURRENCIES.find(c => c.value === displayCurrency);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-24"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-3xl font-bold text-gray-900">Настройки</h1>
      </div>

      <div className="px-4 pt-4">
        {useCloud && (
          <SettingsGroup title="Синхронизация">
            <div className="px-4 py-3 text-sm text-gray-600">
              Данные сохраняются в Supabase (анонимная сессия на этом устройстве).
            </div>
          </SettingsGroup>
        )}

        {/* Основные */}
        <SettingsGroup title="Основные">
          <SettingsItem
            icon={<DollarSign className="w-4 h-4 text-white" />}
            iconBg="bg-green-500"
            title="Валюта"
            value={currentCurrency ? `${currentCurrency.symbol} ${currentCurrency.value}` : displayCurrency}
            onClick={() => setShowCurrencyPicker(true)}
          />
          <SettingsItem
            icon={<TrendingUp className="w-4 h-4 text-white" />}
            iconBg="bg-orange-500"
            title="Курсы валют"
            subtitle="Настроить курсы конвертации"
            onClick={() => setShowRatesEditor(true)}
          />
        </SettingsGroup>

        {/* Уведомления */}
        <SettingsGroup title="Уведомления">
          <SettingsItem
            icon={<Bell className="w-4 h-4 text-white" />}
            iconBg="bg-red-500"
            title="Push-уведомления"
            showChevron={false}
            rightElement={<Toggle enabled={notifications} onChange={setNotifications} />}
          />
        </SettingsGroup>

        {/* Внешний вид */}
        <SettingsGroup title="Внешний вид">
          <SettingsItem
            icon={<Moon className="w-4 h-4 text-white" />}
            iconBg="bg-indigo-500"
            title="Тёмная тема"
            showChevron={false}
            rightElement={<Toggle enabled={darkMode} onChange={setDarkMode} />}
          />
        </SettingsGroup>

        {/* Статистика */}
        <SettingsGroup title="Ваши данные">
          <div className="px-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Wallet className="w-6 h-6 text-blue-500" />
                </div>
                <div className="text-xl font-semibold text-gray-900">{assets.length}</div>
                <div className="text-xs text-gray-500">Активов</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Receipt className="w-6 h-6 text-purple-500" />
                </div>
                <div className="text-xl font-semibold text-gray-900">{transactions.length}</div>
                <div className="text-xs text-gray-500">Операций</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Target className="w-6 h-6 text-green-500" />
                </div>
                <div className="text-xl font-semibold text-gray-900">{goals.length}</div>
                <div className="text-xs text-gray-500">Целей</div>
              </div>
            </div>
          </div>
        </SettingsGroup>

        {/* О приложении */}
        <SettingsGroup title="О приложении">
          <SettingsItem
            icon={<HelpCircle className="w-4 h-4 text-white" />}
            iconBg="bg-gray-500"
            title="Помощь"
            onClick={() => {}}
          />
          <SettingsItem
            icon={<Shield className="w-4 h-4 text-white" />}
            iconBg="bg-gray-500"
            title="Политика конфиденциальности"
            onClick={() => {}}
          />
          <SettingsItem
            icon={<Star className="w-4 h-4 text-white" />}
            iconBg="bg-yellow-500"
            title="Оценить приложение"
            onClick={() => {}}
          />
        </SettingsGroup>

        {/* Опасная зона */}
        <SettingsGroup>
          <SettingsItem
            icon={<Trash2 className="w-4 h-4 text-white" />}
            iconBg="bg-red-500"
            title="Удалить все данные"
            showChevron={false}
            destructive
            onClick={() => {
              if (confirm('Удалить все данные? Это действие нельзя отменить.')) {
                clearAllData();
              }
            }}
          />
        </SettingsGroup>

        {/* Версия */}
        <p className="text-center text-gray-400 text-xs pb-4">
          Investment Tracker версия 1.0.0
        </p>
      </div>

      {/* Currency Picker Modal */}
      <AnimatePresence>
        {showCurrencyPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowCurrencyPicker(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[70vh] overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Выберите валюту</h2>
                <button
                  onClick={() => setShowCurrencyPicker(false)}
                  className="text-blue-500 font-medium"
                >
                  Готово
                </button>
              </div>
              <div className="overflow-y-auto max-h-[60vh]">
                {CURRENCIES.map(currency => (
                  <button
                    key={currency.value}
                    onClick={() => {
                      setDisplayCurrency(currency.value);
                      setShowCurrencyPicker(false);
                    }}
                    className="w-full px-4 py-3 flex items-center justify-between active:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl w-10 text-center">{currency.symbol}</span>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">{currency.value}</div>
                        <div className="text-sm text-gray-500">{currency.label}</div>
                      </div>
                    </div>
                    {displayCurrency === currency.value && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Rates Editor Modal */}
      <AnimatePresence>
        {showRatesEditor && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowRatesEditor(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Курсы валют</h2>
                <button
                  onClick={() => setShowRatesEditor(false)}
                  className="text-blue-500 font-medium"
                >
                  Готово
                </button>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-sm text-gray-500">
                  Укажите курс валют относительно 1 USD
                </p>
                {CURRENCIES.filter(c => c.value !== 'USD').map(currency => (
                  <div key={currency.value} className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-sm text-gray-600 mb-1 block">
                        {currency.label} ({currency.symbol})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          1 USD =
                        </span>
                        <input
                          type="number"
                          value={currencyRates[currency.value] || ''}
                          onChange={(e) => handleRateChange(currency.value, e.target.value)}
                          className="w-full pl-20 pr-16 py-3 bg-gray-100 rounded-xl text-right font-medium"
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                          {currency.value}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-8" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
