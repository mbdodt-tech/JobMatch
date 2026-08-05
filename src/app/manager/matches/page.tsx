'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2,
  Phone,
  Mail,
  Play,
  X,
  Heart,
  GraduationCap,
  FileText,
  ExternalLink,
  MapPin,
  Briefcase,
  Calendar,
  MessageCircle,
  HeartOff,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { resolveMediaUrl } from '@/lib/storage';
import Modal from '@/components/Modal';
import UnmatchDialog from '@/components/UnmatchDialog';
import type { Match, Profile, BehavioralStyle } from '@/lib/types/database';
import {
  BEHAVIORAL_STYLE_LABELS,
  BEHAVIORAL_STYLE_COLORS,
  BEHAVIORAL_STYLE_ICONS,
  educationLineLabels,
  youthEducationLabels,
  MANAGER_UNMATCH_REASONS,
} from '@/lib/types/database';

function StyleBadge({ style }: { style: BehavioralStyle }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
      style={{
        backgroundColor: `${BEHAVIORAL_STYLE_COLORS[style]}15`,
        borderColor: `${BEHAVIORAL_STYLE_COLORS[style]}30`,
        color: BEHAVIORAL_STYLE_COLORS[style],
      }}
    >
      {BEHAVIORAL_STYLE_ICONS[style]} {BEHAVIORAL_STYLE_LABELS[style]}
    </span>
  );
}

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

interface MatchWithStudent extends Match {
  student: Profile;
}

export default function ManagerMatchesPage() {
  const [matches, setMatches] = useState<MatchWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<MatchWithStudent | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [sheetCvUrl, setSheetCvUrl] = useState<string | null>(null);
  const [sheetVideoUrl, setSheetVideoUrl] = useState<string | null>(null);
  const [unreadByMatch, setUnreadByMatch] = useState<Record<string, number>>({});

  async function loadMatches() {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }

      // Get the store first
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('manager_id', user.id)
        .order('created_at')
        .limit(1)
        .maybeSingle();

      if (!store) return;

      // Get matches with student profiles
      const { data: matchData } = await supabase
        .from('matches')
        .select(`*, student:profiles!matches_student_id_fkey(*)`)
        .eq('store_id', store.id)
        .eq('status', 'active')
        .order('matched_at', { ascending: false });

      if (matchData) {
        setMatches(
          matchData
            .filter((m) => m.student)
            .map((m) => ({
              ...m,
              student: m.student as unknown as Profile,
            }))
        );

        if (matchData.length > 0) {
          const { data: unread } = await supabase
            .from('messages')
            .select('match_id')
            .in('match_id', matchData.map((m) => m.id))
            .neq('sender_id', user.id)
            .is('read_at', null);
          const counts: Record<string, number> = {};
          for (const row of (unread as { match_id: string }[]) ?? []) {
            counts[row.match_id] = (counts[row.match_id] ?? 0) + 1;
          }
          setUnreadByMatch(counts);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openVideo(url: string) {
    setVideoUrl(url);
    setShowVideoPlayer(true);
  }

  // Scroll-lock, Escape and focus handled by Modal (Radix Dialog).

  const [unmatchTarget, setUnmatchTarget] = useState<{ matchId: string; studentName: string } | null>(null);

  const performUnmatch = async (reason: string, note: string | null) => {
    if (!unmatchTarget) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('matches')
      .update({
        status: 'unmatched',
        unmatched_at: new Date().toISOString(),
        unmatched_by: user.id,
        unmatch_reason: reason,
        unmatch_note: note,
      })
      .eq('id', unmatchTarget.matchId);
    if (error) {
      console.error('Kunne ikke ophæve match:', error);
      return;
    }

    setMatches((prev) => prev.filter((m) => m.id !== unmatchTarget.matchId));
    setUnmatchTarget(null);
    setSelectedMatch(null);
  };

  useEffect(() => {
    resolveMediaUrl(selectedMatch?.student.cv_url, 'cv').then(setSheetCvUrl);
    resolveMediaUrl(selectedMatch?.student.video_pitch_url, 'video').then(setSheetVideoUrl);
  }, [selectedMatch?.student.cv_url, selectedMatch?.student.video_pitch_url]);

  if (loading) {
    return (
      <div className="bg-[#FAF7F1] flex items-center justify-center min-h-[100dvh]">
        <Loader2 className="w-8 h-8 text-[#0B6B60] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#FAF7F1] min-h-[100dvh]">
    <div className="max-w-md mx-auto px-4 pt-6 pb-8 safe-top">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-extrabold text-[#211F1A] tracking-tight">
          Dine matches
        </h1>
        <p className="text-[#6E6759] text-sm mt-1">
          {matches.length} {matches.length === 1 ? 'match' : 'matches'}
        </p>
      </motion.div>

      {matches.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#E1F2EF] flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-[#0B6B60]" />
          </div>
          <h2 className="text-lg font-bold text-[#211F1A] mb-2">
            Ingen matches endnu
          </h2>
          <p className="text-[#6E6759] text-sm">
            Swipe på interesserede elever for at oprette matches
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.08 },
            },
          }}
          className="grid grid-cols-2 gap-3"
        >
          {matches.map((match) => {
            const age = calculateAge(match.student.date_of_birth);
            return (
              <motion.div
                key={match.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedMatch(match)}
                  className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden varm-card-shadow text-left"
                >
                  {match.student.avatar_url ? (
                    <img
                      src={match.student.avatar_url}
                      alt={match.student.full_name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,#14A899_0%,#0E7C86_55%,#5D5FA8_100%)] flex items-center justify-center">
                      <span className="text-6xl font-extrabold text-white/25 select-none">
                        {match.student.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 card-scrim" />

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full bg-white/95 text-[#0B6B60] text-[10px] font-semibold">
                    <Heart className="w-3 h-3" />
                    Match
                  </div>

                  {(unreadByMatch[match.id] ?? 0) > 0 && (
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-full bg-rose-500/90 backdrop-blur-md text-white text-[10px] font-bold">
                      <MessageCircle className="w-3 h-3" aria-hidden="true" />
                      {unreadByMatch[match.id]}
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-3 min-w-0">
                    <p className="text-white font-bold truncate">
                      {match.student.full_name}
                      {age && (
                        <span className="font-medium text-white/80"> {age}</span>
                      )}
                    </p>
                    {educationLineLabels(match.student) && (
                      <p className="text-white/60 text-xs truncate mt-0.5">
                        {educationLineLabels(match.student)}
                      </p>
                    )}
                  </div>
                </motion.button>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Student detail sheet */}
      <Modal
        open={!!selectedMatch}
        onOpenChange={(o) => !o && setSelectedMatch(null)}
        title="Elevprofil"
        variant="sheet"
        contentClassName="max-h-[90dvh] overflow-y-auto bg-white rounded-t-3xl border-t border-[#EAE4D8]"
      >
        {selectedMatch && (
          <>
              <div className="sticky top-0 z-10 bg-white flex justify-center py-3 rounded-t-3xl">
                <div className="w-10 h-1 rounded-full bg-[#EAE4D8]" />
              </div>

              <div className="px-6 pb-8">
                {/* Close button */}
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setSelectedMatch(null)}
                    aria-label="Luk"
                    className="w-11 h-11 rounded-full bg-[#FAF7F1] flex items-center justify-center text-[#6E6759] hover:text-[#211F1A] transition-colors"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                {/* Avatar + name */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#E1F2EF] flex items-center justify-center shrink-0">
                    {selectedMatch.student.avatar_url ? (
                      <img
                        src={selectedMatch.student.avatar_url}
                        alt={selectedMatch.student.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-[#0B6B60]">
                        {selectedMatch.student.full_name?.charAt(0)?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-[#211F1A] truncate">
                      {selectedMatch.student.full_name}
                      {(() => {
                        const age = calculateAge(selectedMatch.student.date_of_birth);
                        return age ? <span className="text-base font-normal text-[#8B8471] ml-2">{age} år</span> : null;
                      })()}
                    </h2>
                    {educationLineLabels(selectedMatch.student) && (
                      <p className="text-[#6E6759] text-sm">
                        {educationLineLabels(selectedMatch.student)}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedMatch.student.primary_style && (
                        <StyleBadge style={selectedMatch.student.primary_style} />
                      )}
                      {selectedMatch.student.secondary_style && (
                        <StyleBadge style={selectedMatch.student.secondary_style} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Youth education */}
                {(selectedMatch.student.youth_education || selectedMatch.student.youth_education_school) && (
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-[#6E6759] mb-1.5">Uddannelse</h3>
                    <div className="flex items-start gap-3 text-[#211F1A] text-sm bg-[#FAF7F1] rounded-xl p-4 border border-[#EAE4D8]">
                      <GraduationCap className="w-4 h-4 text-[#4E50C4] shrink-0 mt-0.5" />
                      <div>
                        {youthEducationLabels(selectedMatch.student) && (
                          <p>{youthEducationLabels(selectedMatch.student)}</p>
                        )}
                        {selectedMatch.student.youth_education_school && (
                          <p className="text-[#6E6759] mt-0.5">{selectedMatch.student.youth_education_school}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Address */}
                {(selectedMatch.student.address || selectedMatch.student.city) && (
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-[#6E6759] mb-1.5">Adresse</h3>
                    <div className="flex items-start gap-3 text-[#211F1A] text-sm bg-[#FAF7F1] rounded-xl p-4 border border-[#EAE4D8]">
                      <MapPin className="w-4 h-4 text-[#0B6B60] shrink-0 mt-0.5" />
                      <span>
                        {selectedMatch.student.address}
                        {(selectedMatch.student.postal_code || selectedMatch.student.city) && ', '}
                        {selectedMatch.student.postal_code && `${selectedMatch.student.postal_code} `}
                        {selectedMatch.student.city}
                      </span>
                    </div>
                  </div>
                )}

                {/* Date of birth */}
                {selectedMatch.student.date_of_birth && (
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-[#6E6759] mb-1.5">Fødselsdato</h3>
                    <div className="flex items-center gap-3 text-[#211F1A] text-sm bg-[#FAF7F1] rounded-xl p-4 border border-[#EAE4D8]">
                      <Calendar className="w-4 h-4 text-[#0B6B60] shrink-0" />
                      <span>
                        {new Date(selectedMatch.student.date_of_birth).toLocaleDateString('da-DK', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Work experience */}
                {selectedMatch.student.work_experience && (
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-[#6E6759] mb-1.5">Erhvervserfaring</h3>
                    <div className="flex items-start gap-3 text-[#211F1A] text-sm bg-[#FAF7F1] rounded-xl p-4 border border-[#EAE4D8]">
                      <Briefcase className="w-4 h-4 text-[#0B6B60] shrink-0 mt-0.5" />
                      <p>{selectedMatch.student.work_experience}</p>
                    </div>
                  </div>
                )}

                {/* Video pitch */}
                {selectedMatch.student.video_pitch_url && (
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-[#6E6759] mb-1.5">Video-pitch</h3>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => sheetVideoUrl && openVideo(sheetVideoUrl)}
                      aria-label="Afspil video-pitch"
                      className="w-full relative rounded-xl overflow-hidden bg-[#FAF7F1] border border-[#EAE4D8] aspect-video flex items-center justify-center group"
                    >
                      {selectedMatch.student.video_thumbnail_url ? (
                        <img src={selectedMatch.student.video_thumbnail_url} alt="Video thumbnail" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[linear-gradient(135deg,#14A899_0%,#0E7C86_55%,#5D5FA8_100%)]" />
                      )}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 text-white ml-0.5" />
                        </div>
                      </div>
                    </motion.button>
                  </div>
                )}

                {/* CV */}
                {selectedMatch.student.cv_url && (
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-[#6E6759] mb-1.5">CV</h3>
                    <a
                      href={sheetCvUrl ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-disabled={!sheetCvUrl}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-[#EEEEFC] border border-[#DBDBF8] text-[#4E50C4] hover:bg-[#E3E3FA] transition-colors aria-disabled:opacity-50"
                    >
                      <FileText className="w-5 h-5" />
                      <span className="font-medium text-sm">Se elevens CV</span>
                      <ExternalLink className="w-4 h-4 ml-auto" />
                    </a>
                  </div>
                )}

                {/* Contact */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[#6E6759] mb-2">Kontaktoplysninger</h3>
                  <Link
                    href={`/manager/chat/${selectedMatch.id}`}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-[#0E8578] hover:bg-[#0B6B60] text-white transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" aria-hidden="true" />
                    <span className="font-semibold text-sm">Skriv til eleven</span>
                  </Link>
                  {selectedMatch.student.phone && (
                    <a
                      href={`tel:${selectedMatch.student.phone}`}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-[#E1F2EF] border border-[#C4E4DE] text-[#0B6B60] hover:bg-[#D3EAE5] transition-colors"
                    >
                      <Phone className="w-5 h-5" />
                      <span className="font-medium text-sm">Ring: {selectedMatch.student.phone}</span>
                    </a>
                  )}
                  {selectedMatch.student.email && (
                    <a
                      href={`mailto:${selectedMatch.student.email}`}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAF7F1] border border-[#EAE4D8] text-[#211F1A] hover:bg-[#F3EEE4] transition-colors"
                    >
                      <Mail className="w-5 h-5" />
                      <span className="font-medium text-sm">Email: {selectedMatch.student.email}</span>
                    </a>
                  )}
                  {!selectedMatch.student.phone && !selectedMatch.student.email && (
                    <p className="text-[#8B8471] text-sm p-3.5 rounded-xl bg-[#FAF7F1] border border-[#EAE4D8]">
                      Eleven har ikke delt kontaktoplysninger endnu
                    </p>
                  )}

                  <button
                    onClick={() =>
                      setUnmatchTarget({
                        matchId: selectedMatch.id,
                        studentName: selectedMatch.student.full_name || 'eleven',
                      })
                    }
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white border border-[#EAE4D8] text-[#8B8471] hover:text-[#B3412A] hover:border-[#B3412A]/30 transition-colors mt-4"
                  >
                    <HeartOff className="w-5 h-5" />
                    <span className="font-medium text-sm">Ophæv match</span>
                  </button>
                </div>
              </div>
          </>
        )}
      </Modal>

      {/* Unmatch dialog */}
      <UnmatchDialog
        open={!!unmatchTarget}
        onOpenChange={(o) => !o && setUnmatchTarget(null)}
        counterpartName={unmatchTarget?.studentName ?? 'eleven'}
        reasons={MANAGER_UNMATCH_REASONS}
        onConfirm={performUnmatch}
      />

      {/* Video player overlay */}
      <Modal
        open={showVideoPlayer && !!videoUrl}
        onOpenChange={(o) => !o && setShowVideoPlayer(false)}
        title="Video-pitch"
        variant="center"
        overlayClassName="z-[70] bg-black/90"
        contentClassName="w-full max-w-md aspect-[9/16]"
      >
        {showVideoPlayer && videoUrl && (
          <>
            <button
              onClick={() => setShowVideoPlayer(false)}
              aria-label="Luk video"
              className="absolute -top-12 right-0 w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
            <video src={videoUrl} controls autoPlay className="w-full h-full object-contain bg-black rounded-2xl" />
          </>
        )}
      </Modal>
    </div>
    </div>
  );
}
