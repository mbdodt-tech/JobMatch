'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, MapPin, Calendar, Sparkles, Heart, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Match, Store } from '@/lib/types/database';

interface MatchWithStore extends Match {
  store: Store;
}

export default function StudentMatches() {
  const [matches, setMatches] = useState<MatchWithStore[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchMatches() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('matches')
        .select(`*, store:stores(*)`)
        .eq('student_id', user.id)
        .eq('status', 'active')
        .order('matched_at', { ascending: false });

      setMatches((data as unknown as MatchWithStore[]) || []);
      setLoading(false);
    }
    fetchMatches();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    const diffD = Math.floor(diffH / 24);
    if (diffH < 1) return 'Lige nu';
    if (diffH < 24) return `${diffH}t siden`;
    if (diffD < 7) return `${diffD}d siden`;
    return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 max-w-md mx-auto">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#F8FAFC]">
          Matches 💜
        </h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          {matches.length > 0
            ? `Du har ${matches.length} match${matches.length !== 1 ? 'es' : ''}`
            : 'Dine matches vises her'}
        </p>
      </div>

      {/* Matches list */}
      <div className="max-w-md mx-auto px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Heart size={32} className="text-purple-400" />
            </motion.div>
            <p className="text-sm text-[#94A3B8]">Henter dine matches…</p>
          </div>
        ) : matches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Sparkles size={32} className="text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-[#F8FAFC]">
              Ingen matches endnu
            </h2>
            <p className="text-sm text-[#94A3B8] max-w-xs">
              Bliv ved med at swipe! Når en butik også swiper højre på dig, får du et match 💪
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="space-y-3"
          >
            <AnimatePresence>
              {matches.map((match) => (
                <motion.div
                  key={match.id}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.95 },
                    visible: { opacity: 1, y: 0, scale: 1 },
                  }}
                  className="group relative p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-green-500/20 hover:border-green-500/40 transition-all overflow-hidden"
                >
                  {/* Green accent glow */}
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-green-400 to-emerald-500" />

                  {/* Store info */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/20 flex items-center justify-center shrink-0">
                      <span className="text-xl">🏪</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#F8FAFC] truncate">
                        {match.store?.name || 'Butik'}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <MapPin size={12} className="text-[#64748B]" />
                        <span className="text-xs text-[#94A3B8]">
                          {match.store?.city || 'Ukendt'}, {match.store?.postal_code}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 rounded-full px-2.5 py-0.5 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-[10px] font-medium text-green-400 uppercase tracking-wider">Match</span>
                    </div>
                  </div>

                  {/* Matched date */}
                  <div className="flex items-center gap-1.5 mb-3 text-xs text-[#64748B]">
                    <Calendar size={12} />
                    <span>Matchet {formatDate(match.matched_at)}</span>
                  </div>

                  {/* Contact buttons */}
                  <div className="flex gap-2">
                    {match.store?.phone && (
                      <a
                        href={`tel:${match.store.phone}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors active:scale-[0.98]"
                      >
                        <Phone size={16} />
                        Ring op
                      </a>
                    )}
                    {match.store?.email && (
                      <a
                        href={`mailto:${match.store.email}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors active:scale-[0.98]"
                      >
                        <Mail size={16} />
                        Send mail
                      </a>
                    )}
                    {match.store?.website && (
                      <a
                        href={match.store.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-10 rounded-xl bg-white/5 border border-white/10 text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
