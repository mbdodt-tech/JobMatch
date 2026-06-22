'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
  Heart,
  ExternalLink,
  Clock,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Match, Store } from '@/lib/types/database';

interface MatchWithStore extends Match {
  store: Store;
}

interface LikedStore {
  swipe_id: string;
  store: Store;
  swiped_at: string;
}

export default function StudentMatches() {
  const [matches, setMatches] = useState<MatchWithStore[]>([]);
  const [liked, setLiked] = useState<LikedStore[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [matchesRes, swipesRes] = await Promise.all([
        supabase
          .from('matches')
          .select('*, store:stores(*)')
          .eq('student_id', user.id)
          .eq('status', 'active')
          .order('matched_at', { ascending: false }),
        supabase
          .from('swipes')
          .select('id, store_id, created_at, store:stores(*)')
          .eq('profile_id', user.id)
          .eq('swiper_role', 'student')
          .eq('direction', 'right')
          .order('created_at', { ascending: false }),
      ]);

      const matchList = (matchesRes.data as unknown as MatchWithStore[]) || [];
      setMatches(matchList);

      const matchedStoreIds = new Set(matchList.map((m) => m.store_id));
      const likedList: LikedStore[] = ((swipesRes.data as unknown as { id: string; store_id: string; created_at: string; store: Store }[]) || [])
        .filter((s) => !matchedStoreIds.has(s.store_id))
        .map((s) => ({
          swipe_id: s.id,
          store: s.store,
          swiped_at: s.created_at,
        }));
      setLiked(likedList);

      setLoading(false);
    }
    fetchData();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="text-purple-400 animate-spin" />
        <p className="text-sm text-[#94A3B8]">Henter dine matches...</p>
      </div>
    );
  }

  const isEmpty = matches.length === 0 && liked.length === 0;

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-28">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 max-w-md mx-auto">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#F8FAFC]">
          Matches
        </h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          {matches.length > 0
            ? `${matches.length} match${matches.length !== 1 ? 'es' : ''} og ${liked.length} afventer`
            : 'Dine matches og likes vises her'}
        </p>
      </div>

      <div className="max-w-md mx-auto px-4 space-y-8">
        {/* Empty state */}
        {isEmpty && (
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
              Swipe til højre på butikker du er interesseret i. Når en butik også swiper på dig, får du et match!
            </p>
          </motion.div>
        )}

        {/* ── Matches section ── */}
        {matches.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <h2 className="text-sm font-bold text-green-400 uppercase tracking-wider">
                Matches ({matches.length})
              </h2>
            </div>

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
                    className="relative p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-green-500/20 hover:border-green-500/40 transition-all overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-green-400 to-emerald-500" />

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
                        <span className="text-[10px] font-medium text-green-400 uppercase tracking-wider">
                          Match
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mb-3 text-xs text-[#64748B]">
                      <Calendar size={12} />
                      <span>Matchet {formatDate(match.matched_at)}</span>
                    </div>

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
          </section>
        )}

        {/* ── Liked / awaiting section ── */}
        {liked.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <h2 className="text-sm font-bold text-purple-400 uppercase tracking-wider">
                Interesseret i ({liked.length})
              </h2>
            </div>
            <p className="text-xs text-[#64748B] mb-3">
              Du har swipet højre — afventer at butikken swiper tilbage
            </p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
              className="space-y-3"
            >
              <AnimatePresence>
                {liked.map((item) => (
                  <motion.div
                    key={item.swipe_id}
                    variants={{
                      hidden: { opacity: 0, y: 16, scale: 0.95 },
                      visible: { opacity: 1, y: 0, scale: 1 },
                    }}
                    className="relative p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-purple-500/15 hover:border-purple-500/30 transition-all overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500" />

                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-600/20 border border-purple-500/15 flex items-center justify-center shrink-0">
                        <Heart size={20} className="text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#F8FAFC] truncate">
                          {item.store?.name || 'Butik'}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <MapPin size={12} className="text-[#64748B]" />
                          <span className="text-xs text-[#94A3B8]">
                            {item.store?.city || 'Ukendt'}, {item.store?.postal_code}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-[#64748B]">
                          <Clock size={12} />
                          <span>Liked {formatDate(item.swiped_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 rounded-full px-2.5 py-0.5 shrink-0">
                        <Clock size={10} className="text-purple-400" />
                        <span className="text-[10px] font-medium text-purple-400 uppercase tracking-wider">
                          Afventer
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </section>
        )}
      </div>
    </div>
  );
}
