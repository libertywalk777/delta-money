import { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';

type DollarSpec = {
  id: number;
  left: string;
  delay: number;
  duration: number;
  size: number;
};

function makeDollars(count: number): DollarSpec[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = i * 7919;
    return {
      id: i,
      left: `${6 + (seed % 88)}%`,
      delay: (seed % 45) / 10,
      duration: 2.6 + (seed % 28) / 10,
      size: 15 + (seed % 20),
    };
  });
}

type Props = {
  loadComplete: boolean;
  onFinished: () => void;
};

export function SplashScreen({ loadComplete, onFinished }: Props) {
  const dollars = useMemo(() => makeDollars(32), []);
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
      className="fixed inset-0 z-[600] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#0f2847] via-[#0c2139] to-[#081828]"
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        {dollars.map((d) => (
          <span
            key={d.id}
            className="splash-dollar absolute font-semibold text-[#6bb6ff]/[0.24]"
            style={{
              left: d.left,
              top: '-10vh',
              fontSize: d.size,
              animationDelay: `${d.delay}s`,
              animationDuration: `${d.duration}s`,
            }}
          >
            $
          </span>
        ))}
      </div>

      <div className="relative z-10 flex w-full max-w-xs flex-col items-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <h1 className="text-[2rem] font-bold tracking-tight text-white sm:text-[2.25rem]">
            Delta Money
          </h1>
          <p className="mt-2 text-sm text-blue-200/50">Загружаем ваши данные</p>
        </motion.div>

        <div className="mt-14 w-full max-w-[240px]">
          <div className="h-[5px] overflow-hidden rounded-full bg-white/[0.07] ring-1 ring-white/[0.08]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#2563eb] via-[#3b82f6] to-[#7dd3fc]"
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
