'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { resolveMediaUrl } from '@/lib/storage';
import type { Match, Profile, BehavioralStyle } from '@/lib/types/database';
import {
  BEHAVIORAL_STYLE_LABELS,
  BEHAVIORAL_STYLE_COLORS,
  BEHAVIORAL_STYLE_ICONS,
  EDUCATION_LINE_LABELS,
  YOUTH_EDUCATION_LABELS,
} from '@/lib/types/database';
import type { EducationLine, YouthEducationType } from '@/lib/types/database';

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

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { setLoading(false); window.location.href = '/login'; return; }

    // Get the store first
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('manager_id', user.id)
      .single();

    if (!store) {
      setLoading(false);
      return;
    }

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
    }
    setLoading(false);
  }

  function openVideo(url: string) {
    setVideoUrl(url);
    setShowVideoPlayer(true);
  }

  useEffect(() => {
    if (selectedMatch) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedMatch]);

  useEffect(() => {
    resolveMediaUrl(selectedMatch?.student.cv_url, 'cv').then(setSheetCvUrl);
    resolveMediaUrl(selectedMatch?.student.video_pitch_url, 'video').then(setSheetVideoUrl);
  }, [selectedMatch?.student.cv_url, selectedMatch?.student.video_pitch_url]);

  if (loading) {
    return (
      <div className="aurora-bg aurora-bg-subtle flex items-center justify-center min-h-[100dvh]">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="aurora-bg aurora-bg-subtle min-h-[100dvh]">
    <div className="max-w-md mx-auto px-4 pt-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Dine <span className="gradient-text-emerald">matches</span>
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {matches.length} {matches.length === 1 ? 'match' : 'matches'}
        </p>
      </motion.div>

      {matches.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">
            Ingen matches endnu
          </h2>
          <p className="text-text-secondary text-sm">
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
                  className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden border border-white/10 shadow-xl text-left"
                >
                  {match.student.avatar_url ? (
                    <img
                      src={match.student.avatar_url}
                      alt={match.student.full_name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
                      <span className="text-6xl font-extrabold text-white/25 select-none">
                        {match.student.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 card-scrim" />

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-semibold glow-green">
                    <Heart className="w-3 h-3" />
                    Match
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-3 min-w-0">
                    <p className="text-white font-bold truncate">
                      {match.student.full_name}
                      {age && (
                        <span className="font-medium text-white/80"> {age}</span>
                      )}
                    </p>
                    {match.student.education_line && (
                      <p className="text-white/60 text-xs capitalize truncate mt-0.5">
                        {match.student.education_line.replace(/_/g, ' ')}
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
      <AnimatePresence>
        {selectedMatch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedMatch(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 max-h-[90vh] bg-[#0E0E18] rounded-t-3xl border-t border-white/10 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 bg-[#0E0E18] flex justify-center py-3 rounded-t-3xl">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="px-6 pb-8">
                {/* Close button */}
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setSelectedMatch(null)}
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-muted hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Avatar + name */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0">
                    {selectedMatch.student.avatar_url ? (
                      <img
                        src={selectedMatch.student.avatar_url}
                        alt={selectedMatch.student.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-white">
                        {selectedMatch.student.full_name?.charAt(0)?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-white truncate">
                      {selectedMatch.student.full_name}
                      {(() => {
                        const age = calculateAge(selectedMatch.student.date_of_birth);
                        return age ? <span className="text-base font-normal text-white/60 ml-2">{age} år</span> : null;
                      })()}
                    </h2>
                    {selectedMatch.student.education_line && (
                      <p className="text-text-secondary text-sm">
                        {EDUCATION_LINE_LABELS[selectedMatch.student.education_line as EducationLine] ||
                          selectedMatch.student.education_line.replace(/_/g, ' ')}
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
                    <h3 className="text-sm font-medium text-text-secondary mb-1.5">Uddannelse</h3>
                    <div className="flex items-start gap-3 text-white text-sm bg-white/5 rounded-xl p-4 border border-white/10">
                      <GraduationCap className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                      <div>
                        {selectedMatch.student.youth_education && (
                          <p>{YOUTH_EDUCATION_LABELS[selectedMatch.student.youth_education as YouthEducationType] || selectedMatch.student.youth_education}</p>
                        )}
                        {selectedMatch.student.youth_education_school && (
                          <p className="text-text-secondary mt-0.5">{selectedMatch.student.youth_education_school}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Address */}
                {(selectedMatch.student.address || selectedMatch.student.city) && (
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-text-secondary mb-1.5">Adresse</h3>
                    <div className="flex items-start gap-3 text-white text-sm bg-white/5 rounded-xl p-4 border border-white/10">
                      <MapPin className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
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
                    <h3 className="text-sm font-medium text-text-secondary mb-1.5">Fødselsdato</h3>
                    <div className="flex items-center gap-3 text-white text-sm bg-white/5 rounded-xl p-4 border border-white/10">
                      <Calendar className="w-4 h-4 text-violet-400 shrink-0" />
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
                    <h3 className="text-sm font-medium text-text-secondary mb-1.5">Erhvervserfaring</h3>
                    <div className="flex items-start gap-3 text-white text-sm bg-white/5 rounded-xl p-4 border border-white/10">
                      <Briefcase className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <p>{selectedMatch.student.work_experience}</p>
                    </div>
                  </div>
                )}

                {/* Video pitch */}
                {selectedMatch.student.video_pitch_url && (
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-text-secondary mb-1.5">Video-pitch</h3>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => sheetVideoUrl && openVideo(sheetVideoUrl)}
                      className="w-full relative rounded-xl overflow-hidden bg-white/5 border border-white/10 aspect-video flex items-center justify-center group"
                    >
                      {selectedMatch.student.video_thumbnail_url ? (
                        <img src={selectedMatch.student.video_thumbnail_url} alt="Video thumbnail" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-900/30 to-blue-900/30" />
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
                    <h3 className="text-sm font-medium text-text-secondary mb-1.5">CV</h3>
                    <a
                      href={sheetCvUrl ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-disabled={!sheetCvUrl}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-colors aria-disabled:opacity-50"
                    >
                      <FileText className="w-5 h-5" />
                      <span className="font-medium text-sm">Se elevens CV</span>
                      <ExternalLink className="w-4 h-4 ml-auto" />
                    </a>
                  </div>
                )}

                {/* Contact */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-text-secondary mb-2">Kontaktoplysninger</h3>
                  {selectedMatch.student.phone && (
                    <a
                      href={`tel:${selectedMatch.student.phone}`}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-colors"
                    >
                      <Phone className="w-5 h-5" />
                      <span className="font-medium text-sm">Ring: {selectedMatch.student.phone}</span>
                    </a>
                  )}
                  {selectedMatch.student.email && (
                    <a
                      href={`mailto:${selectedMatch.student.email}`}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors"
                    >
                      <Mail className="w-5 h-5" />
                      <span className="font-medium text-sm">Email: {selectedMatch.student.email}</span>
                    </a>
                  )}
                  {!selectedMatch.student.phone && !selectedMatch.student.email && (
                    <p className="text-text-muted text-sm p-3.5 rounded-xl bg-white/5 border border-white/10">
                      Eleven har ikke delt kontaktoplysninger endnu
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video player overlay */}
      <AnimatePresence>
        {showVideoPlayer && videoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowVideoPlayer(false)}
          >
            <button
              onClick={() => setShowVideoPlayer(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-md aspect-[9/16] rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain bg-black"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}
