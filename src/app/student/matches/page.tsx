'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Heart,
  ExternalLink,
  Clock,
  Loader2,
  Briefcase,
  X,
  FileText,
  GraduationCap,
  Users,
  ChevronDown,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { safeExternalHref } from '@/lib/url';
import Modal from '@/components/Modal';
import type { Match, Store, EducationLine } from '@/lib/types/database';
import { EDUCATION_LINE_LABELS } from '@/lib/types/database';

interface MatchWithStore extends Match {
  store: Store;
}

interface LikedStore {
  swipe_id: string;
  store: Store;
  swiped_at: string;
}

function StoreCardMedia({ store }: { store: Store | null }) {
  if (store?.cover_image_url) {
    return (
      <img
        src={store.cover_image_url}
        alt={store.name}
        className="absolute inset-0 w-full h-full object-cover"
      />
    );
  }
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 via-blue-600/20 to-[#0B0B14] flex items-center justify-center">
      {store?.logo_url ? (
        <img
          src={store.logo_url}
          alt={store.name}
          className="w-16 h-16 rounded-2xl object-contain bg-white/5 p-2 -translate-y-6"
        />
      ) : (
        <Briefcase size={36} className="text-white/30 -translate-y-6" />
      )}
    </div>
  );
}

export default function StudentMatches() {
  const [matches, setMatches] = useState<MatchWithStore[]>([]);
  const [liked, setLiked] = useState<LikedStore[]>([]);
  const [disliked, setDisliked] = useState<LikedStore[]>([]);
  const [showDisliked, setShowDisliked] = useState(false);
  const [selectedStore, setSelectedStore] = useState<{ store: Store; matched: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) { setLoading(false); window.location.href = '/login'; return; }

      const [matchesRes, swipesRes, leftSwipesRes] = await Promise.all([
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
        supabase
          .from('swipes')
          .select('id, store_id, created_at, store:stores(*)')
          .eq('profile_id', user.id)
          .eq('swiper_role', 'student')
          .eq('direction', 'left')
          .order('created_at', { ascending: false }),
      ]);

      const matchList = (matchesRes.data as unknown as MatchWithStore[]) || [];
      setMatches(matchList);

      type SwipeRow = { id: string; store_id: string; created_at: string; store: Store };
      const matchedStoreIds = new Set(matchList.map((m) => m.store_id));
      const likedList: LikedStore[] = ((swipesRes.data as unknown as SwipeRow[]) || [])
        .filter((s) => s.store && !matchedStoreIds.has(s.store_id))
        .map((s) => ({
          swipe_id: s.id,
          store: s.store,
          swiped_at: s.created_at,
        }));
      setLiked(likedList);

      const likedStoreIds = new Set(likedList.map((l) => l.store.id));
      const seenDisliked = new Set<string>();
      const dislikedList: LikedStore[] = ((leftSwipesRes.data as unknown as SwipeRow[]) || [])
        .filter((s) => {
          if (!s.store || matchedStoreIds.has(s.store_id) || likedStoreIds.has(s.store_id)) return false;
          if (seenDisliked.has(s.store_id)) return false;
          seenDisliked.add(s.store_id);
          return true;
        })
        .map((s) => ({
          swipe_id: s.id,
          store: s.store,
          swiped_at: s.created_at,
        }));
      setDisliked(dislikedList);

      setLoading(false);
    }
    fetchData();
  }, []);

  // Body scroll-lock, Escape and focus handling are provided by the Modal (Radix Dialog).

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
      <div className="min-h-dvh aurora-bg aurora-bg-subtle flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="text-violet-400 animate-spin" />
        <p className="text-sm text-[#94A3B8]">Henter dine matches...</p>
      </div>
    );
  }

  const isEmpty = matches.length === 0 && liked.length === 0;

  return (
    <div className="min-h-dvh aurora-bg aurora-bg-subtle pb-32">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 max-w-md mx-auto">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#F8FAFC]">
          <span className="gradient-text">Matches</span>
        </h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">
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
            <div className="w-20 h-20 rounded-full glass glow-violet flex items-center justify-center">
              <Sparkles size={32} className="text-violet-400" />
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
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                Matches ({matches.length})
              </h2>
            </div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
              className="grid grid-cols-2 gap-3"
            >
              <AnimatePresence>
                {matches.map((match) => (
                  <motion.div
                    key={match.id}
                    variants={{
                      hidden: { opacity: 0, y: 20, scale: 0.95 },
                      visible: { opacity: 1, y: 0, scale: 1 },
                    }}
                    onClick={() => match.store && setSelectedStore({ store: match.store, matched: true })}
                    className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-emerald-500/25 shadow-lg shadow-black/40 cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <StoreCardMedia store={match.store} />
                    <div className="absolute inset-0 card-scrim" />

                    {/* Match badge */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1 backdrop-blur-md bg-emerald-500/20 border border-emerald-400/30 rounded-full px-2.5 py-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-medium text-emerald-300 uppercase tracking-wider">
                        Match
                      </span>
                    </div>

                    {/* Bottom info */}
                    <div className="absolute inset-x-0 bottom-0 p-3 space-y-1.5">
                      <h3 className="font-bold text-white text-sm leading-snug truncate">
                        {match.store?.name || 'Butik'}
                      </h3>
                      <div className="flex items-center gap-1 min-w-0">
                        <MapPin size={10} className="text-white/60 shrink-0" />
                        <span className="text-[11px] text-white/60 truncate">
                          {match.store?.city || 'Ukendt'}, {match.store?.postal_code}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/50 truncate">
                        Matchet {formatDate(match.matched_at)}
                      </p>

                      <div className="flex items-center gap-1.5 pt-0.5">
                        {match.store?.phone && (
                          <a
                            href={`tel:${match.store.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-8 rounded-full backdrop-blur-md bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 hover:bg-emerald-500/35 transition-colors active:scale-95"
                            title="Ring op"
                          >
                            <Phone size={13} />
                          </a>
                        )}
                        {match.store?.email && (
                          <a
                            href={`mailto:${match.store.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-8 rounded-full backdrop-blur-md bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 hover:bg-blue-500/35 transition-colors active:scale-95"
                            title="Send mail"
                          >
                            <Mail size={13} />
                          </a>
                        )}
                        {match.store?.website && (
                          <a
                            href={safeExternalHref(match.store.website)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-8 rounded-full backdrop-blur-md bg-white/15 border border-white/20 flex items-center justify-center text-white/70 hover:bg-white/25 transition-colors active:scale-95"
                            title="Besøg website"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
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
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <h2 className="text-sm font-bold text-violet-400 uppercase tracking-wider">
                Interesseret i ({liked.length})
              </h2>
            </div>
            <p className="text-xs text-[#94A3B8] mb-3">
              Du har swipet højre — afventer at butikken swiper tilbage
            </p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
              className="grid grid-cols-2 gap-3"
            >
              <AnimatePresence>
                {liked.map((item) => (
                  <motion.div
                    key={item.swipe_id}
                    variants={{
                      hidden: { opacity: 0, y: 16, scale: 0.95 },
                      visible: { opacity: 1, y: 0, scale: 1 },
                    }}
                    onClick={() => setSelectedStore({ store: item.store, matched: false })}
                    className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-violet-500/20 shadow-lg shadow-black/40 cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <StoreCardMedia store={item.store} />
                    <div className="absolute inset-0 card-scrim" />

                    {/* Awaiting badge */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1 backdrop-blur-md bg-violet-500/20 border border-violet-400/30 rounded-full px-2.5 py-0.5">
                      <Clock size={10} className="text-violet-300" />
                      <span className="text-[10px] font-medium text-violet-300 uppercase tracking-wider">
                        Afventer
                      </span>
                    </div>

                    {/* Bottom info */}
                    <div className="absolute inset-x-0 bottom-0 p-3 space-y-1.5">
                      <h3 className="font-bold text-white text-sm leading-snug truncate">
                        {item.store?.name || 'Butik'}
                      </h3>
                      <div className="flex items-center gap-1 min-w-0">
                        <MapPin size={10} className="text-white/60 shrink-0" />
                        <span className="text-[11px] text-white/60 truncate">
                          {item.store?.city || 'Ukendt'}, {item.store?.postal_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-white/50">
                        <Heart size={10} className="text-violet-300 shrink-0" />
                        <span className="truncate">Liked {formatDate(item.swiped_at)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </section>
        )}

        {/* ── Disliked / passed section ── */}
        {disliked.length > 0 && (
          <section>
            <button
              onClick={() => setShowDisliked((v) => !v)}
              className="flex items-center gap-2 mb-3 w-full text-left"
            >
              <div className="w-2 h-2 rounded-full bg-slate-500" />
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Fravalgt ({disliked.length})
              </h2>
              <ChevronDown
                size={16}
                className={`text-slate-500 transition-transform ${showDisliked ? 'rotate-180' : ''}`}
              />
            </button>

            {showDisliked && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-3"
              >
                {disliked.map((item) => (
                  <div
                    key={item.swipe_id}
                    onClick={() => setSelectedStore({ store: item.store, matched: false })}
                    className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/10 shadow-lg shadow-black/40 cursor-pointer active:scale-[0.98] transition-transform opacity-70 hover:opacity-100"
                  >
                    <StoreCardMedia store={item.store} />
                    <div className="absolute inset-0 card-scrim" />

                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1 backdrop-blur-md bg-white/10 border border-white/15 rounded-full px-2.5 py-0.5">
                      <X size={10} className="text-slate-300" />
                      <span className="text-[10px] font-medium text-slate-300 uppercase tracking-wider">
                        Fravalgt
                      </span>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-3 space-y-1.5">
                      <h3 className="font-bold text-white text-sm leading-snug truncate">
                        {item.store?.name || 'Butik'}
                      </h3>
                      <div className="flex items-center gap-1 min-w-0">
                        <MapPin size={10} className="text-white/60 shrink-0" />
                        <span className="text-[11px] text-white/60 truncate">
                          {item.store?.city || 'Ukendt'}, {item.store?.postal_code}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/50 truncate">
                        Fravalgt {formatDate(item.swiped_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </section>
        )}
      </div>

      {/* ── Store detail bottom sheet ── */}
      <Modal
        open={!!selectedStore}
        onOpenChange={(o) => !o && setSelectedStore(null)}
        title="Butiksdetaljer"
        variant="sheet"
        contentClassName="max-h-[90dvh] overflow-y-auto bg-[#0E0E18] rounded-t-3xl border-t border-white/10"
      >
        {selectedStore && (
          <>
              <div className="sticky top-0 z-10 bg-[#0E0E18] flex justify-center py-3 rounded-t-3xl">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="px-6 pb-10">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setSelectedStore(null)}
                    aria-label="Luk"
                    className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                {/* Logo + name */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0">
                    {selectedStore.store.logo_url ? (
                      <img
                        src={selectedStore.store.logo_url}
                        alt={selectedStore.store.name}
                        className="w-full h-full object-contain bg-white/10 p-2"
                      />
                    ) : (
                      <Briefcase className="w-8 h-8 text-white/70" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-white truncate">
                      {selectedStore.store.name}
                    </h2>
                    <div className="flex items-center gap-1 text-[#94A3B8] text-sm mt-0.5">
                      <MapPin size={13} className="shrink-0" />
                      <span className="truncate">
                        {selectedStore.store.address}, {selectedStore.store.postal_code}{' '}
                        {selectedStore.store.city}
                      </span>
                    </div>
                    {selectedStore.matched && (
                      <div className="inline-flex items-center gap-1 mt-2 backdrop-blur-md bg-emerald-500/20 border border-emerald-400/30 rounded-full px-2.5 py-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-medium text-emerald-300 uppercase tracking-wider">
                          Match
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Job posting PDF — the main event */}
                {selectedStore.store.job_description_url && (
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-[#94A3B8] mb-1.5">Jobopslag</h3>
                    <a
                      href={safeExternalHref(selectedStore.store.job_description_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-violet-500/15 to-blue-500/15 border border-violet-500/30 text-violet-300 hover:from-violet-500/25 hover:to-blue-500/25 transition-colors"
                    >
                      <FileText className="w-5 h-5 shrink-0" />
                      <span className="font-semibold text-sm">Se jobopslag fra butikken</span>
                      <ExternalLink className="w-4 h-4 ml-auto shrink-0" />
                    </a>
                  </div>
                )}

                {/* Description */}
                {selectedStore.store.description && (
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-[#94A3B8] mb-1.5">Om butikken</h3>
                    <p className="text-white text-sm leading-relaxed bg-white/5 rounded-xl p-4 border border-white/5">
                      {selectedStore.store.description}
                    </p>
                  </div>
                )}

                {/* Education lines */}
                {selectedStore.store.education_lines?.length > 0 && (
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-[#94A3B8] mb-1.5">Uddannelseslinjer</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedStore.store.education_lines.map((line) => (
                        <span
                          key={line}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/15 border border-violet-500/30 text-violet-300"
                        >
                          <GraduationCap size={12} />
                          {EDUCATION_LINE_LABELS[line as EducationLine] || line}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Internship slots */}
                <div className="mb-5">
                  <h3 className="text-sm font-medium text-[#94A3B8] mb-1.5">Praktikpladser</h3>
                  <div className="flex items-center gap-3 text-white text-sm bg-white/5 rounded-xl p-4 border border-white/5">
                    <Users className="w-4 h-4 text-violet-400 shrink-0" />
                    <span>
                      {selectedStore.store.internship_slots || 1}{' '}
                      {(selectedStore.store.internship_slots || 1) === 1 ? 'plads' : 'pladser'}
                    </span>
                  </div>
                </div>

                {/* Contact — matches only */}
                {selectedStore.matched ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-[#94A3B8] mb-2">Kontakt</h3>
                    {selectedStore.store.phone && (
                      <a
                        href={`tel:${selectedStore.store.phone}`}
                        className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        <Phone className="w-5 h-5" />
                        <span className="font-medium text-sm">Ring: {selectedStore.store.phone}</span>
                      </a>
                    )}
                    {selectedStore.store.email && (
                      <a
                        href={`mailto:${selectedStore.store.email}`}
                        className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors"
                      >
                        <Mail className="w-5 h-5" />
                        <span className="font-medium text-sm">Email: {selectedStore.store.email}</span>
                      </a>
                    )}
                  </div>
                ) : (
                  selectedStore.store.website && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-[#94A3B8] mb-2">Links</h3>
                      <a
                        href={safeExternalHref(selectedStore.store.website)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors"
                      >
                        <ExternalLink className="w-5 h-5" />
                        <span className="font-medium text-sm">Besøg website</span>
                      </a>
                    </div>
                  )
                )}
              </div>
          </>
        )}
      </Modal>
    </div>
  );
}
