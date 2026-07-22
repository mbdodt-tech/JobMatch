'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';
import { Briefcase, Phone, ArrowRight } from 'lucide-react';
import type { Store } from '@/lib/types/database';

interface MatchCelebrationProps {
  store: Store;
  visible: boolean;
  onViewContact: () => void;
  onContinue: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
}

function ConfettiParticles() {
  const reduceMotion = useReducedMotion();
  const colors = ['#7C3AED', '#3B82F6', '#10B981', '#F97316', '#EF4444', '#F59E0B'];

  const particles = useMemo<Particle[]>(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 8,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 2,
    })),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);

  if (reduceMotion) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          initial={{ y: p.y, opacity: 1, rotate: 0 }}
          animate={{
            y: '110vh',
            opacity: [1, 1, 0],
            rotate: Math.random() > 0.5 ? 720 : -720,
            x: (Math.random() - 0.5) * 200,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
}

export default function MatchCelebration({
  store,
  visible,
  onViewContact,
  onContinue,
}: MatchCelebrationProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Background overlay */}
          <div className="absolute inset-0 bg-[#05050A]/90 backdrop-blur-lg" />

          {/* Confetti */}
          <ConfettiParticles />

          {/* Content */}
          <motion.div
            className="relative z-10 flex flex-col items-center text-center px-8 max-w-sm"
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          >
            {/* Pulsing glow ring */}
            <motion.div
              className="relative mb-6"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 p-0.5 glow-green">
                <div className="w-full h-full rounded-3xl bg-[#12121E] flex items-center justify-center overflow-hidden">
                  {store.logo_url ? (
                    <img
                      src={store.logo_url}
                      alt={store.name}
                      className="w-full h-full object-contain p-3"
                    />
                  ) : (
                    <Briefcase size={40} className="text-emerald-400" />
                  )}
                </div>
              </div>

              {/* Glow */}
              <motion.div
                className="absolute inset-0 rounded-3xl bg-emerald-500/20 blur-xl -z-10"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            {/* Match text */}
            <motion.h1
              className="text-4xl font-extrabold tracking-tight gradient-text-emerald mb-2"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              Det er et match! 🎉
            </motion.h1>

            <p className="text-lg text-[#94A3B8] mb-2 font-medium">
              {store.name}
            </p>
            <p className="text-sm text-[#64748B] mb-8">
              {store.city} • {store.internship_slots} praktikpladser
            </p>

            {/* Buttons */}
            <div className="w-full space-y-3">
              <button
                onClick={onViewContact}
                className="w-full py-4 rounded-2xl btn-gradient-emerald text-white font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Phone size={18} />
                Se kontaktinfo
              </button>

              <button
                onClick={onContinue}
                className="w-full py-4 rounded-2xl glass text-[#94A3B8] font-medium text-base flex items-center justify-center gap-2 hover:bg-white/10 transition-colors active:scale-[0.98]"
              >
                Fortsæt
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
