import { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';

type Tier = 'hero-a' | 'hero-b' | 'mid' | 'dust';

type DollarSpec = {
  id: number;
  left: string;
  delay: number;
  duration: number;
  size: number;
  tier: Tier;
};

function makeDollars(): DollarSpec[] {
  const out: DollarSpec[] = [];
  let id = 0;

  for (let i = 0; i < 11; i++) {
    const s = i * 9341;
    out.push({
      id: id++,
      left: `${4 + (s % 92)}%`,
      delay: (s % 50) / 11,
      duration: 5.2 + (s % 35) / 10,
      size: 46 + (s % 28),
      tier: i % 2 === 0 ? 'hero-a' : 'hero-b',
    });
  }
  for (let i = 0; i < 16; i++) {
    const s = i * 6203;
    out.push({
      id: id++,
      left: `${3 + (s % 94)}%`,
      delay: (s % 40) / 9,
      duration: 3.4 + (s % 22) / 10,
      size: 26 + (s % 18),
      tier: 'mid',
    });
  }
  for (let i = 0; i < 26; i++) {
    const s = i * 4441;
    out.push({
      id: id++,
      left: `${2 + (s % 96)}%`,
      delay: (s % 35) / 8,
      duration: 2.3 + (s % 18) / 10,
      size: 13 + (s % 14),
      tier: 'dust',
    });
  }
  return out;
}

const wrapClass: Record<Tier, string> = {
  'hero-a': 'splash-dollar-wrap splash-dollar-wrap--hero-a',
  'hero-b': 'splash-dollar-wrap splash-dollar-wrap--hero-b',
  mid: 'splash-dollar-wrap splash-dollar-wrap--mid',
  dust: 'splash-dollar-wrap splash-dollar-wrap--dust',
};

type Props = {
  loadComplete: boolean;
  onFinished: () => void;
};

export function SplashScreen({ loadComplete, onFinished }: Props) {
  const dollars = useMemo(() => makeDollars(), []);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (loadComplete) {
      setProgress(100);
      const t = setTimeout(() => setExiting(true), 420);
      return () => clearTimeout(t);
    }
    const id = setInterval(() => {
      setProgress((p) => (p >= 80 ? 80 : p + 2 + Math.random() * 7));
    }, 130);
    return () => clearInterval(id);
  }, [loadComplete]);

  useEffect(() => {
    if (!exiting || finishedRef.current) return;
    const t = setTimeout(() => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinished();
    }, 520);
    return () => clearTimeout(t);
  }, [exiting, onFinished]);

  return (
    <motion.div
      className="fixed inset-0 z-[600] flex flex-col items-center justify-center overflow-hidden bg-[#fafafa]"
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Мягкое свечение по центру */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_45%,rgba(0,122,255,0.06)_0%,transparent_65%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_100%,rgba(212,175,55,0.04)_0%,transparent_55%)]"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        {dollars.map((d) => (
          <div
            key={d.id}
            className={wrapClass[d.tier]}
            style={{
              left: d.left,
              top: '-14vh',
              animationDelay: `${d.delay}s`,
              animationDuration: `${d.duration}s`,
            }}
          >
            <span
              className={
                d.tier === 'dust'
                  ? 'splash-dollar-dust-inner'
                  : d.tier === 'mid'
                    ? 'splash-dollar-gold splash-dollar-gold--soft'
                    : 'splash-dollar-gold'
              }
              style={{ fontSize: d.size }}
            >
              $
            </span>
          </div>
        ))}
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <h1 className="text-[2rem] font-bold tracking-tight text-gray-900 sm:text-[2.35rem]">
            <span className="text-gray-800">Delta </span>
            <span className="bg-gradient-to-r from-[#007AFF] via-[#2b8cff] to-[#0056b3] bg-clip-text text-transparent">
              Money
            </span>
          </h1>
          <p className="mt-2.5 text-sm font-medium tracking-wide text-gray-400">
            Загружаем ваши данные
          </p>
        </motion.div>

        <div className="mt-16 w-full max-w-[260px]">
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-200/90 shadow-inner">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#007AFF] via-[#3b9aff] to-[#5eb0ff]"
              initial={{ width: '0%' }}
              animate={{ width: `${Math.min(100, progress)}%` }}
              transition={{
                type: 'spring',
                stiffness: loadComplete ? 220 : 95,
                damping: loadComplete ? 26 : 32,
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
