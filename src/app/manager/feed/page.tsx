'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  PanInfo,
} from 'framer-motion';
import {
  Loader2,
  Heart,
  X,
  Sparkles,
  Users,
  Play,
  Phone,
  Mail,
  MapPin,
  FileText,
  ExternalLink,
  GraduationCap,
  Briefcase,
  Calendar,
  Info,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { resolveMediaUrl } from '@/lib/storage';
import type { Profile, Store, BehavioralStyle } from '@/lib/types/database';
import {
  BEHAVIORAL_STYLE_LABELS,
  BEHAVIORAL_STYLE_COLORS,
  BEHAVIORAL_STYLE_ICONS,
  EDUCATION_LINE_LABELS,
  YOUTH_EDUCATION_LABELS,
} from '@/lib/types/database';
import type { EducationLine, YouthEducationType } from '@/lib/types/database';
import StudentCard from '@/components/manager/StudentCard';

function StyleBadge({ style }: { style: BehavioralStyle }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border"
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

export default function ManagerFeedPage() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedStudent, setMatchedStudent] = useState<Profile | null>(null);
  const [swiping, setSwiping] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [sheetCvUrl, setSheetCvUrl] = useState<string | null>(null);
  const [sheetVideoUrl, setSheetVideoUrl] = useState<string | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const rightOpacity = useTransform(x, [0, 100], [0, 1]);
  const leftOpacity = useTransform(x, [-100, 0], [1, 0]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }

      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('manager_id', user.id)
        .single();

      if (!storeData) return;
      setStore(storeData);

      const { data: rightSwipes } = await supabase
        .from('swipes')
        .select('profile_id')
        .eq('store_id', storeData.id)
        .eq('swiper_role', 'student')
        .eq('direction', 'right');

      if (!rightSwipes || rightSwipes.length === 0) return;

      const studentIds = rightSwipes.map((s) => s.profile_id);

      const { data: alreadySwiped } = await supabase
        .from('swipes')
        .select('profile_id')
        .eq('store_id', storeData.id)
        .eq('swiper_role', 'store_manager');

      const alreadySwipedIds = (alreadySwiped || []).map((s) => s.profile_id);
      const remainingIds = studentIds.filter(
        (id) => !alreadySwipedIds.includes(id)
      );

      if (remainingIds.length === 0) return;

      const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', remainingIds);

      if (studentProfiles) {
        setStudents(studentProfiles);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleSwipe = useCallback(
    async (direction: 'left' | 'right') => {
      if (swiping || currentIndex >= students.length || !store) return;
      setSwiping(true);

      const student = students[currentIndex];
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSwiping(false);
        return;
      }

      await supabase.from('swipes').insert({
        profile_id: student.id,
        store_id: store.id,
        swiper_role: 'store_manager',
        direction,
      });

      if (direction === 'right') {
        const { data: studentSwipe } = await supabase
          .from('swipes')
          .select('id')
          .eq('profile_id', student.id)
          .eq('store_id', store.id)
          .eq('swiper_role', 'student')
          .eq('direction', 'right')
          .single();

        if (studentSwipe) {
          const { data: managerSwipe } = await supabase
            .from('swipes')
            .select('id')
            .eq('profile_id', student.id)
            .eq('store_id', store.id)
            .eq('swiper_role', 'store_manager')
            .eq('direction', 'right')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (managerSwipe) {
            await supabase.from('matches').insert({
              student_id: student.id,
              store_id: store.id,
              student_swipe_id: studentSwipe.id,
              store_swipe_id: managerSwipe.id,
            });

            setMatchedStudent(student);
            setShowMatch(true);
          }
        }
      }

      setCurrentIndex((prev) => prev + 1);
      x.set(0);
      setSwiping(false);
    },
    [currentIndex, students, store, swiping, x]
  );

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const threshold = 100;
    if (info.offset.x > threshold) {
      handleSwipe('right');
    } else if (info.offset.x < -threshold) {
      handleSwipe('left');
    }
  }

  useEffect(() => {
    if (selectedStudent) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedStudent]);

  useEffect(() => {
    resolveMediaUrl(selectedStudent?.cv_url, 'cv').then(setSheetCvUrl);
    resolveMediaUrl(selectedStudent?.video_pitch_url, 'video').then(setSheetVideoUrl);
  }, [selectedStudent?.cv_url, selectedStudent?.video_pitch_url]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showVideoPlayer) setShowVideoPlayer(false);
      else if (selectedStudent) setSelectedStudent(null);
      else if (showMatch) setShowMatch(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showVideoPlayer, selectedStudent, showMatch]);

  function openVideo(url: string) {
    setVideoUrl(url);
    setShowVideoPlayer(true);
  }

  const currentStudent = students[currentIndex];
  const nextStudent = students[currentIndex + 1];

  if (loading) {
    return (
      <div className="aurora-bg aurora-bg-subtle flex items-center justify-center min-h-[100dvh]">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="aurora-bg aurora-bg-subtle flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center">
        <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Ingen butik oprettet</h2>
        <p className="text-text-secondary text-sm">
          Opret din butiksprofil først for at se interesserede elever
        </p>
      </div>
    );
  }

  return (
    <div className="aurora-bg aurora-bg-subtle min-h-[100dvh]">
    <div className="max-w-md mx-auto px-4 pt-6 pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Interesserede <span className="gradient-text">elever</span>
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {currentStudent
            ? `Tryk på kortet for detaljer — swipe for at vælge`
            : `Elever der har swiped højre på ${store.name}`}
        </p>
      </motion.div>

      {/* Card stack */}
      <div className="relative" style={{ height: 'calc(100dvh - 360px)', minHeight: 360 }}>
        {!currentStudent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 rounded-[28px] glass-card"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-violet-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              Ingen interesserede elever endnu
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              Din butik vises for relevante elever.
              <br />
              Kom tilbage senere!
            </p>
          </motion.div>
        ) : (
          <>
            {nextStudent && (
              <div className="absolute inset-0 scale-[0.95] opacity-50 pointer-events-none">
                <StudentCard student={nextStudent} />
              </div>
            )}

            <AnimatePresence>
              <motion.div
                key={currentStudent.id}
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                style={{ x, rotate }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragEnd={handleDragEnd}
              >
                {/* Swipe overlays */}
                <motion.div
                  className="absolute inset-0 z-10 rounded-[28px] bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center pointer-events-none"
                  style={{ opacity: rightOpacity }}
                >
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full p-4 glow-green">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                </motion.div>
                <motion.div
                  className="absolute inset-0 z-10 rounded-[28px] bg-rose-500/20 border-2 border-rose-500/40 flex items-center justify-center pointer-events-none"
                  style={{ opacity: leftOpacity }}
                >
                  <div className="bg-rose-500 rounded-full p-4 glow-red">
                    <X className="w-10 h-10 text-white" />
                  </div>
                </motion.div>

                <StudentCard student={currentStudent} />

                {/* Profile button — stops drag propagation so tap always works */}
                <button
                  className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 rounded-full glass-strong text-white text-xs font-semibold shadow-lg"
                  onPointerDownCapture={(e) => e.stopPropagation()}
                  onClick={() => setSelectedStudent(currentStudent)}
                >
                  <Info className="w-3.5 h-3.5" />
                  Se profil
                </button>
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Action buttons */}
      {currentStudent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-6 mt-6"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSwipe('left')}
            disabled={swiping}
            className="w-[72px] h-[72px] rounded-full bg-white/5 backdrop-blur-xl border border-rose-500/30 flex items-center justify-center hover:bg-rose-500/10 hover:glow-red transition-all disabled:opacity-50"
          >
            <X className="w-8 h-8 text-rose-400" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSwipe('right')}
            disabled={swiping}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center glow-green disabled:opacity-50"
          >
            <Heart className="w-9 h-9 text-white" />
          </motion.button>
        </motion.div>
      )}

      {/* ── Student detail bottom sheet ── */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedStudent(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              role="dialog"
              aria-modal="true"
              aria-label="Elevprofil"
              className="absolute bottom-0 left-0 right-0 max-h-[90vh] bg-[#0E0E18] rounded-t-3xl border-t border-white/10 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 bg-[#0E0E18] flex justify-center py-3 rounded-t-3xl">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="px-6 pb-10">
                {/* Close button */}
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setSelectedStudent(null)}
                    aria-label="Luk"
                    className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center text-text-muted hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                {/* Avatar + name */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0">
                    {selectedStudent.avatar_url ? (
                      <img
                        src={selectedStudent.avatar_url}
                        alt={selectedStudent.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-white">
                        {selectedStudent.full_name?.charAt(0)?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-white truncate">
                      {selectedStudent.full_name}
                      {(() => {
                        const age = calculateAge(selectedStudent.date_of_birth);
                        return age ? <span className="text-base font-normal text-white/60 ml-2">{age} år</span> : null;
                      })()}
                    </h2>
                    {selectedStudent.education_line && (
                      <p className="text-text-secondary text-sm">
                        {EDUCATION_LINE_LABELS[selectedStudent.education_line as EducationLine] ||
                          selectedStudent.education_line.replace(/_/g, ' ')}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedStudent.primary_style && (
                        <StyleBadge style={selectedStudent.primary_style} />
                      )}
                      {selectedStudent.secondary_style && (
                        <StyleBadge style={selectedStudent.secondary_style} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Education details */}
                {(selectedStudent.youth_education || selectedStudent.youth_education_school) && (
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-text-secondary mb-1.5">
                      Uddannelse
                    </h3>
                    <div className="flex items-start gap-3 text-white text-sm bg-white/5 rounded-xl p-4 border border-white/10">
                      <GraduationCap className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                      <div>
                        {selectedStudent.youth_education && (
                          <p>
                            {YOUTH_EDUCATION_LABELS[selectedStudent.youth_education as YouthEducationType] ||
                              selectedStudent.youth_education}
                          </p>
                        )}
                        {selectedStudent.youth_education_school && (
                          <p className="text-text-secondary mt-0.5">{selectedStudent.youth_education_school}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Address */}
                {(selectedStudent.address || selectedStudent.city) && (
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-text-secondary mb-1.5">
                      Adresse
                    </h3>
                    <div className="flex items-start gap-3 text-white text-sm bg-white/5 rounded-xl p-4 border border-white/10">
                      <MapPin className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                      <span>
                        {selectedStudent.address}
                        {(selectedStudent.postal_code || selectedStudent.city) && ', '}
                        {selectedStudent.postal_code && `${selectedStudent.postal_code} `}
                        {selectedStudent.city}
                      </span>
                    </div>
                  </div>
                )}

                {/* Date of birth */}
                {selectedStudent.date_of_birth && (
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-text-secondary mb-1.5">
                      Fødselsdato
                    </h3>
                    <div className="flex items-center gap-3 text-white text-sm bg-white/5 rounded-xl p-4 border border-white/10">
                      <Calendar className="w-4 h-4 text-violet-400 shrink-0" />
                      <span>
                        {new Date(selectedStudent.date_of_birth).toLocaleDateString('da-DK', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Work experience */}
                {selectedStudent.work_experience && (
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-text-secondary mb-1.5">
                      Erhvervserfaring
                    </h3>
                    <div className="flex items-start gap-3 text-white text-sm bg-white/5 rounded-xl p-4 border border-white/10">
                      <Briefcase className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <p>{selectedStudent.work_experience}</p>
                    </div>
                  </div>
                )}

                {/* Video pitch */}
                {selectedStudent.video_pitch_url && (
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-text-secondary mb-1.5">
                      Video-pitch
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => sheetVideoUrl && openVideo(sheetVideoUrl)}
                      aria-label="Afspil video-pitch"
                      className="w-full relative rounded-xl overflow-hidden bg-white/5 border border-white/10 aspect-video flex items-center justify-center group"
                    >
                      {selectedStudent.video_thumbnail_url ? (
                        <img
                          src={selectedStudent.video_thumbnail_url}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover"
                        />
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
                {selectedStudent.cv_url && (
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-text-secondary mb-1.5">
                      CV
                    </h3>
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

                {/* Contact info */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-text-secondary mb-2">
                    Kontaktoplysninger
                  </h3>
                  {selectedStudent.phone && (
                    <a
                      href={`tel:${selectedStudent.phone}`}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-colors"
                    >
                      <Phone className="w-5 h-5" />
                      <span className="font-medium text-sm">
                        Ring: {selectedStudent.phone}
                      </span>
                    </a>
                  )}
                  {selectedStudent.email && (
                    <a
                      href={`mailto:${selectedStudent.email}`}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors"
                    >
                      <Mail className="w-5 h-5" />
                      <span className="font-medium text-sm">
                        Email: {selectedStudent.email}
                      </span>
                    </a>
                  )}
                  {!selectedStudent.phone && !selectedStudent.email && (
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
            role="dialog"
            aria-modal="true"
            aria-label="Video-pitch"
            className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowVideoPlayer(false)}
          >
            <button
              onClick={() => setShowVideoPlayer(false)}
              aria-label="Luk video"
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" aria-hidden="true" />
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

      {/* Match celebration overlay */}
      <AnimatePresence>
        {showMatch && matchedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-live="assertive"
            aria-label="Det er et match"
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowMatch(false)}
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="bg-gradient-to-br from-violet-900/90 to-blue-900/90 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/20 shadow-2xl glow-violet max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-3xl font-extrabold text-white mb-2">
                Det er et match!
              </h2>
              <p className="text-text-secondary mb-6">
                Du og {matchedStudent.full_name} har matchet! I kan nu se hinandens kontaktoplysninger.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setShowMatch(false);
                  window.location.href = '/manager/matches';
                }}
                className="w-full py-3 rounded-xl btn-gradient text-white font-semibold"
              >
                Se match
              </motion.button>
              <button
                onClick={() => setShowMatch(false)}
                className="w-full py-3 mt-2 text-text-secondary text-sm font-medium"
              >
                Fortsæt med at swipe
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}
