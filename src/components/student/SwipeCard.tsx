'use client';

import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { MapPin, Users, Briefcase, FileText, ExternalLink, Heart, X } from 'lucide-react';
import type { Store } from '@/lib/types/database';
import { EDUCATION_LINE_LABELS as EDU_LABELS } from '@/lib/types/database';
import { safeExternalHref } from '@/lib/url';

interface SwipeCardProps {
  store: Store;
  onSwipe: (direction: 'left' | 'right') => void;
  isTop: boolean;
  index: number;
}

const SWIPE_THRESHOLD = 120;

export default function SwipeCard({ store, onSwipe, isTop, index }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
  const opacity = useTransform(x, [-300, -100, 0, 100, 300], [0.5, 1, 1, 1, 0.5]);

  // Overlay opacities
  const rejectOpacity = useTransform(x, [-150, -50, 0], [0.6, 0.2, 0]);
  const acceptOpacity = useTransform(x, [0, 50, 150], [0, 0.2, 0.6]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipe('right');
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipe('left');
    }
  };

  // Stack offset for cards behind
  const stackScale = 1 - index * 0.05;
  const stackY = index * 10;
  const stackOpacity = 1 - index * 0.2;

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        scale: stackScale,
        y: stackY,
        opacity: isTop ? opacity : stackOpacity,
        zIndex: 10 - index,
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={isTop ? handleDragEnd : undefined}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{
        scale: stackScale,
        opacity: isTop ? 1 : stackOpacity,
        y: stackY,
      }}
      exit={{
        x: x.get() > 0 ? 500 : -500,
        opacity: 0,
        rotate: x.get() > 0 ? 30 : -30,
        transition: { duration: 0.3 },
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Card */}
      <div className="relative h-full rounded-[28px] overflow-hidden bg-[#12121E] border border-white/10 shadow-2xl shadow-violet-500/10">
        {/* Full-bleed cover */}
        <div className="absolute inset-0">
          {store.cover_image_url ? (
            <img
              src={store.cover_image_url}
              alt={store.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-600/40 via-blue-600/25 to-[#0B0B14] flex items-center justify-center">
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="w-28 h-28 rounded-3xl object-contain bg-white/5 p-3 -translate-y-10"
                />
              ) : (
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center glow-violet -translate-y-10">
                  <Briefcase size={48} className="text-white" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scrim for readable text */}
        <div className="absolute inset-0 card-scrim" />

        {/* Distance chip */}
        {store.distance_km !== undefined && (
          <div className="absolute top-4 right-4 backdrop-blur-md bg-white/15 border border-white/20 rounded-full px-3 py-1 flex items-center gap-1">
            <MapPin size={12} className="text-white" />
            <span className="text-xs font-medium text-white">
              {store.distance_km.toFixed(1)} km
            </span>
          </div>
        )}

        {/* Info on scrim */}
        <div className="absolute inset-x-0 bottom-0 p-5 space-y-3">
          <div className="min-w-0">
            <h2 className="text-3xl font-extrabold text-white tracking-tight break-words">
              {store.name}
            </h2>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={14} className="text-white/70 shrink-0" />
              <span className="text-sm text-white/70 truncate">
                {store.city} {store.postal_code}
              </span>
            </div>
          </div>

          {store.description && (
            <p className="text-sm text-white/70 leading-relaxed line-clamp-2 break-words">
              {store.description}
            </p>
          )}

          {/* Chips: education lines + slots */}
          <div className="flex flex-wrap gap-2">
            {store.education_lines?.map((line) => (
              <span
                key={line}
                className="text-xs px-3 py-1 rounded-full backdrop-blur-md bg-white/15 border border-white/20 text-white font-medium"
              >
                {EDU_LABELS[line] || line}
              </span>
            ))}
            <span className="text-xs px-3 py-1 rounded-full backdrop-blur-md bg-white/15 border border-white/20 text-white font-medium flex items-center gap-1.5">
              <Users size={12} />
              {store.internship_slots} praktikpladser
            </span>
          </div>

          {/* Job description PDF link */}
          {store.job_description_url && (
            <a
              href={safeExternalHref(store.job_description_url)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 py-2 px-3 rounded-full backdrop-blur-md bg-white/15 border border-white/20 text-white text-xs font-medium hover:bg-white/25 transition-colors w-full min-w-0"
            >
              <FileText size={14} className="shrink-0" />
              <span className="truncate">Se jobbeskrivelse (PDF)</span>
              <ExternalLink size={11} className="ml-auto shrink-0" />
            </a>
          )}
        </div>

        {/* Swipe overlays */}
        {isTop && (
          <>
            {/* Reject overlay (red) */}
            <motion.div
              className="absolute inset-0 rounded-[28px] bg-rose-500/25 flex items-center justify-center pointer-events-none"
              style={{ opacity: rejectOpacity }}
            >
              <div className="rotate-[-20deg] border-4 border-rose-400 rounded-3xl p-5 bg-rose-500/20 backdrop-blur-sm glow-red">
                <X size={56} strokeWidth={3} className="text-rose-300" />
              </div>
            </motion.div>

            {/* Accept overlay (green) */}
            <motion.div
              className="absolute inset-0 rounded-[28px] bg-emerald-500/25 flex items-center justify-center pointer-events-none"
              style={{ opacity: acceptOpacity }}
            >
              <div className="rotate-[20deg] border-4 border-emerald-400 rounded-3xl p-5 bg-emerald-500/20 backdrop-blur-sm glow-green">
                <Heart size={56} strokeWidth={3} className="text-emerald-300 fill-emerald-300/40" />
              </div>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}
