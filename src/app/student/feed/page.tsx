'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Heart, Loader2, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Store, Match } from '@/lib/types/database';
import SwipeCard from '@/components/student/SwipeCard';
import MatchCelebration from '@/components/student/MatchCelebration';

export default function StudentFeed() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchedStore, setMatchedStore] = useState<Store | null>(null);
  const [showMatch, setShowMatch] = useState(false);

  const supabase = createClient();

  // Fetch stores that haven't been swiped yet
  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Send students who haven't completed onboarding to the onboarding flow
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (profile && !profile.onboarding_completed) {
        router.replace('/student/onboarding');
        return;
      }

      // Get already swiped store IDs
      const { data: swipes } = await supabase
        .from('swipes')
        .select('store_id')
        .eq('profile_id', user.id);

      const swipedIds = swipes?.map((s) => s.store_id) || [];

      // Fetch active stores not yet swiped
      let query = supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (swipedIds.length > 0) {
        query = query.not('id', 'in', `(${swipedIds.join(',')})`);
      }

      const { data } = await query;
      setStores(data || []);
      setCurrentIndex(0);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    const store = stores[currentIndex];
    if (!store) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Record the swipe
    const { data: swipeData } = await supabase
      .from('swipes')
      .insert({
        profile_id: user.id,
        store_id: store.id,
        swiper_role: 'student',
        direction,
      })
      .select()
      .single();

    // Check for match if swiped right
    if (direction === 'right' && swipeData) {
      const { data: storeSwipe } = await supabase
        .from('swipes')
        .select('*')
        .eq('store_id', store.id)
        .eq('profile_id', store.manager_id)
        .eq('direction', 'right')
        .maybeSingle();

      if (storeSwipe) {
        // Create a match!
        await supabase.from('matches').insert({
          student_id: user.id,
          store_id: store.id,
          student_swipe_id: swipeData.id,
          store_swipe_id: storeSwipe.id,
          status: 'active',
        });

        setMatchedStore(store);
        setShowMatch(true);
      }
    }

    // Move to next card
    setCurrentIndex((prev) => prev + 1);
  };

  const visibleStores = stores.slice(currentIndex, currentIndex + 3);
  const isEmpty = currentIndex >= stores.length && !loading;

  return (
    <div className="min-h-dvh aurora-bg aurora-bg-subtle aurora-animated">
      {/* Header */}
      <div className="relative z-10 px-4 pt-6 pb-3 max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#F8FAFC]">
              <span className="gradient-text">Udforsk</span> 🔍
            </h1>
            <p className="text-sm text-[#64748B] truncate">
              Swipe for at finde din praktikplads
            </p>
          </div>
          <div className="flex items-center gap-1 glass rounded-full px-3 py-1.5 shrink-0">
            <Sparkles size={14} className="text-violet-400" />
            <span className="text-xs font-medium text-[#94A3B8]">
              {stores.length - currentIndex} tilbage
            </span>
          </div>
        </div>
      </div>

      {/* Card stack */}
      <div className="relative z-10 max-w-md mx-auto px-4">
        <div className="relative" style={{ height: 'calc(100dvh - 340px)', minHeight: 340 }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 size={36} className="text-violet-400 animate-spin" />
              <p className="text-[#94A3B8] text-sm">Henter virksomheder…</p>
            </div>
          ) : isEmpty ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full gap-4 text-center px-8"
            >
              <div className="text-6xl">🎯</div>
              <h2 className="text-xl font-bold text-[#F8FAFC]">
                Ingen flere lige nu
              </h2>
              <p className="text-sm text-[#94A3B8]">
                Du har set alle tilgængelige virksomheder. Kom tilbage senere for nye muligheder!
              </p>
              <button
                onClick={fetchStores}
                className="mt-4 px-6 py-3 rounded-2xl btn-gradient text-white font-semibold text-sm active:scale-[0.98]"
              >
                Opdater listen
              </button>
            </motion.div>
          ) : (
            <AnimatePresence>
              {visibleStores.map((store, i) => (
                <SwipeCard
                  key={store.id}
                  store={store}
                  onSwipe={handleSwipe}
                  isTop={i === 0}
                  index={i}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {!loading && !isEmpty && (
        <div className="relative z-10 max-w-md mx-auto px-4 py-4 flex items-center justify-center gap-6">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSwipe('left')}
            className="w-16 h-16 rounded-full glass ring-1 ring-rose-500/30 flex items-center justify-center shadow-lg hover:bg-rose-500/10 hover:ring-rose-500/50 transition-colors group"
          >
            <X
              size={28}
              className="text-rose-400 group-hover:text-rose-300 transition-colors"
            />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSwipe('right')}
            className="w-18 h-18 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 ring-1 ring-white/10 flex items-center justify-center glow-green hover:brightness-110 transition-all group"
          >
            <Heart
              size={32}
              className="text-white fill-white/30 transition-colors"
            />
          </motion.button>
        </div>
      )}

      {/* Match celebration */}
      {matchedStore && (
        <MatchCelebration
          store={matchedStore}
          visible={showMatch}
          onViewContact={() => {
            setShowMatch(false);
            window.location.href = '/student/matches';
          }}
          onContinue={() => setShowMatch(false)}
        />
      )}
    </div>
  );
}
