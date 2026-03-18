import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Briefcase, 
  Target, 
  BarChart3,
  Settings
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Portfolio } from './components/Portfolio';
import { Goals } from './components/Goals';
import { Analytics } from './components/Analytics';
import { Settings as SettingsPage } from './components/Settings';
import { useStore } from './store';
import { isSupabaseConfigured } from './lib/supabase';

type Tab = 'dashboard' | 'portfolio' | 'goals' | 'analytics' | 'settings';

const tabs = [
  { id: 'dashboard' as Tab, label: 'Главная', icon: Home },
  { id: 'portfolio' as Tab, label: 'Портфель', icon: Briefcase },
  { id: 'goals' as Tab, label: 'Цели', icon: Target },
  { id: 'analytics' as Tab, label: 'Аналитика', icon: BarChart3 },
  { id: 'settings' as Tab, label: 'Ещё', icon: Settings },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isLoaded, setIsLoaded] = useState(false);
  const [pillPosition, setPillPosition] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const navRef = useRef<HTMLDivElement>(null);

  const initialized = useStore((s) => s.initialized);
  const initError = useStore((s) => s.initError);
  const bootstrap = useStore((s) => s.bootstrap);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      void bootstrap();
    }
  }, [bootstrap]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Точное позиционирование pill под иконкой
  useEffect(() => {
    const updatePillPosition = () => {
      const activeIndex = tabs.findIndex(t => t.id === activeTab);
      const activeTabEl = tabRefs.current[activeIndex];
      const navEl = navRef.current;
      
      if (activeTabEl && navEl) {
        const tabRect = activeTabEl.getBoundingClientRect();
        const navRect = navEl.getBoundingClientRect();
        
        // Размер pill - 52px (под иконку)
        const pillWidth = 52;
        const tabCenter = tabRect.left + tabRect.width / 2 - navRect.left;
        
        setPillPosition({
          left: tabCenter - pillWidth / 2,
          width: pillWidth,
        });
      }
    };

    updatePillPosition();
    window.addEventListener('resize', updatePillPosition);
    return () => window.removeEventListener('resize', updatePillPosition);
  }, [activeTab, isLoaded]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'portfolio':
        return <Portfolio />;
      case 'goals':
        return <Goals />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  if (isSupabaseConfigured() && !initialized) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-10 h-10 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 text-sm text-center">Загрузка данных…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {initError && (
        <div className="mx-4 mt-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm">
          <strong>Облако:</strong> {initError}
          <p className="mt-2 text-xs text-amber-800">
            Выполни SQL из <code className="bg-amber-100 px-1 rounded">supabase/migrations/001_init.sql</code> в Supabase
            → SQL Editor. Включи <strong>Anonymous</strong> в Authentication → Providers.
          </p>
        </div>
      )}
      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.main
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="pb-28"
        >
          {renderContent()}
        </motion.main>
      </AnimatePresence>

      {/* iOS 26 Style Floating Tab Bar */}
      <motion.nav 
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-2"
        initial={{ y: 100 }}
        animate={{ y: isLoaded ? 0 : 100 }}
        transition={{ type: "spring", damping: 28, stiffness: 300, delay: 0.1 }}
      >
        <div 
          ref={navRef}
          className="relative bg-white/80 backdrop-blur-xl rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-white/60 mx-auto max-w-md overflow-hidden"
        >
          {/* Animated Background Pill - точно под иконкой */}
          <motion.div
            className="absolute top-2 bottom-2 bg-[#007AFF]/12 rounded-full pointer-events-none"
            animate={{
              left: pillPosition.left,
              width: pillPosition.width,
            }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 280,
              mass: 0.6
            }}
          />

          <div className="flex items-center justify-around h-16 relative">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  ref={(el) => { tabRefs.current[index] = el; }}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative flex flex-col items-center justify-center flex-1 h-full z-10 outline-none"
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: "spring", damping: 15, stiffness: 500 }}
                >
                  {/* Icon Container with iOS 26 Zoom Effect */}
                  <motion.div
                    className="relative"
                    animate={{
                      scale: isActive ? 1.4 : 1,
                      y: isActive ? -3 : 0,
                    }}
                    transition={{ 
                      type: "spring", 
                      damping: 12, 
                      stiffness: 350,
                      mass: 0.5
                    }}
                  >
                    {/* Wiggle animation on select */}
                    <motion.div
                      animate={isActive ? {
                        rotate: [0, -10, 12, -8, 5, 0],
                      } : { rotate: 0 }}
                      transition={{
                        duration: 0.5,
                        ease: "easeOut"
                      }}
                    >
                      <motion.div
                        animate={{
                          color: isActive ? '#007AFF' : '#8E8E93',
                        }}
                        transition={{ duration: 0.15 }}
                      >
                        <Icon 
                          size={24} 
                          strokeWidth={isActive ? 2.4 : 1.6}
                          className="transition-all duration-150"
                        />
                      </motion.div>
                    </motion.div>
                    
                    {/* Glow Effect - усиленный */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 bg-[#007AFF]/25 rounded-full blur-xl"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 2.5 }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{ 
                            type: "spring",
                            damping: 15,
                            stiffness: 200
                          }}
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                  
                  {/* Label */}
                  <motion.span 
                    className="text-[10px] mt-1"
                    animate={{
                      color: isActive ? '#007AFF' : '#8E8E93',
                      scale: isActive ? 1.08 : 1,
                      opacity: isActive ? 1 : 0.7,
                      fontWeight: isActive ? 600 : 500,
                      y: isActive ? 1 : 0,
                    }}
                    transition={{ 
                      type: "spring", 
                      damping: 18, 
                      stiffness: 280 
                    }}
                  >
                    {tab.label}
                  </motion.span>
                </motion.button>
              );
            })}
          </div>
        </div>
        
        {/* Home Indicator */}
        <div className="flex justify-center mt-2">
          <div className="w-32 h-1 bg-black/20 rounded-full" />
        </div>
      </motion.nav>
    </div>
  );
}
