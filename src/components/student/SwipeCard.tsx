'use client';

import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { MapPin, Users, Briefcase, FileText, ExternalLink } from 'lucide-react';
import type { Store } from '@/lib/types/database';
import { EDUCATION_LINE_LABELS as EDU_LABELS } from '@/lib/types/database';

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
      <div className="relative h-full rounded-3xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl shadow-purple-500/10">
        {/* Cover image area */}
        <div className="relative h-48 bg-gradient-to-br from-purple-600/30 via-blue-500/20 to-cyan-400/10 flex items-center justify-center">
          {store.cover_image_url ? (
            <img
              src={store.cover_image_url}
              alt={store.name}
              className="w-full h-full object-cover"
            />
          ) : store.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.name}
              className="w-20 h-20 rounded-2xl object-contain"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Briefcase size={36} className="text-white" />
            </div>
          )}

          {/* Distance badge */}
          {store.distance_km !== undefined && (
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1">
              <MapPin size={12} className="text-purple-400" />
              <span className="text-xs font-medium text-white">
                {store.distance_km.toFixed(1)} km
              </span>
            </div>
          )}
        </div>

        {/* Info section */}
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-[#F8FAFC] tracking-tight">
              {store.name}
            </h2>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={14} className="text-[#94A3B8]" />
              <span className="text-sm text-[#94A3B8]">
                {store.city} {store.postal_code}
              </span>
            </div>
          </div>

          {store.description && (
            <p className="text-sm text-[#94A3B8] leading-relaxed line-clamp-3">
              {store.description}
            </p>
          )}

          {/* Education lines */}
          <div className="flex flex-wrap gap-2">
            {store.education_lines?.map((line) => (
              <span
                key={line}
                className="text-xs px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20 font-medium"
              >
                {EDU_LABELS[line] || line}
              </span>
            ))}
          </div>

          {/* Job description PDF link */}
          {store.job_description_url && (
            <a
              href={store.job_description_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 py-2 px-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors w-full"
            >
              <FileText size={14} />
              Se jobbeskrivelse (PDF)
              <ExternalLink size={11} className="ml-auto" />
            </a>
          )}

          {/* Internship slots */}
          <div className="flex items-center gap-2">
            <Users size={16} className="text-blue-400" />
            <span className="text-sm text-[#94A3B8]">
              {store.internship_slots} praktikpladser
            </span>
          </div>
        </div>

        {/* Swipe overlays */}
        {isTop && (
          <>
            {/* Reject overlay (red) */}
            <motion.div
              className="absolute inset-0 rounded-3xl bg-red-500/30 flex items-center justify-center pointer-events-none"
              style={{ opacity: rejectOpacity }}
            >
              <div className="text-6xl font-extrabold text-red-400 rotate-[-20deg] border-4 border-red-400 rounded-2xl px-6 py-2">
                NEJ
              </div>
            </motion.div>

            {/* Accept overlay (green) */}
            <motion.div
              className="absolute inset-0 rounded-3xl bg-green-500/30 flex items-center justify-center pointer-events-none"
              style={{ opacity: acceptOpacity }}
            >
              <div className="text-6xl font-extrabold text-green-400 rotate-[20deg] border-4 border-green-400 rounded-2xl px-6 py-2">
                JA!
              </div>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}
