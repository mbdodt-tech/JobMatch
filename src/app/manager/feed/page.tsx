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
  RotateCcw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { resolveMediaUrl } from '@/lib/storage';
import Modal from '@/components/Modal';
import type { Profile, Store, BehavioralStyle } from '@/lib/types/database';
import {
  BEHAVIORAL_STYLE_LABELS,
  BEHAVIORAL_STYLE_COLORS,
  BEHAVIORAL_STYLE_ICONS,
  educationLineLabels,
  youthEducationLabels,
} from '@/lib/types/database';
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
  const [toast, setToast] = useState<{ id: number; kind: 'like' | 'pass' | 'undo'; name: string } | null>(null);
  const [lastSwipe, setLastSwipe] = useState<{
    swipeId: string;
    index: number;
    studentId: string;
    matched: boolean;
  } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const rightOpacity = useTransform(x, [0, 25, 90], [0, 0.3, 1]);
  const leftOpacity = useTransform(x, [-90, -25, 0], [1, 0.3, 0]);

  async function loadData() {
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
        .order('created_at')
        .limit(1)
        .maybeSingle();

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

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      const { data: swipeData, error: swipeError } = await supabase
        .from('swipes')
        .insert({
          profile_id: student.id,
          store_id: store.id,
          swiper_role: 'store_manager',
          direction,
        })
        .select('id')
        .single();
      if (swipeError || !swipeData) {
        console.error('Kunne ikke gemme swipe:', swipeError);
        setSwiping(false);
        return;
      }

      let matched = false;
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
            matched = true;
          }
        }
      }

      if (!matched) {
        setToast({
          id: Date.now(),
          kind: direction === 'right' ? 'like' : 'pass',
          name: student.full_name ?? 'eleven',
        });
      }
      setLastSwipe({ swipeId: swipeData.id, index: currentIndex, studentId: student.id, matched });
      setCurrentIndex((prev) => prev + 1);
      x.set(0);
      setSwiping(false);
    },
    [currentIndex, students, store, swiping, x]
  );

  const handleUndo = useCallback(async () => {
    if (swiping || !lastSwipe || !store) return;
    setSwiping(true);
    try {
      const supabase = createClient();

      if (lastSwipe.matched) {
        await supabase
          .from('matches')
          .delete()
          .eq('student_id', lastSwipe.studentId)
          .eq('store_id', store.id);
      }
      const { error: delError } = await supabase
        .from('swipes')
        .delete()
        .eq('id', lastSwipe.swipeId);
      if (delError) { console.error('Kunne ikke fortryde swipe:', delError); return; }

      setShowMatch(false);
      setCurrentIndex(lastSwipe.index);
      setToast({
        id: Date.now(),
        kind: 'undo',
        name: students[lastSwipe.index]?.full_name ?? 'eleven',
      });
      setLastSwipe(null);
    } finally {
      setSwiping(false);
    }
  }, [swiping, lastSwipe, store, students]);

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const threshold = 80;
    const flick = 500;
    if (info.offset.x > threshold || info.velocity.x > flick) {
      handleSwipe('right');
    } else if (info.offset.x < -threshold || info.velocity.x < -flick) {
      handleSwipe('left');
    }
  }

  // Sheet/video scroll-lock, Escape and focus handled by Modal (Radix Dialog).

  useEffect(() => {
    resolveMediaUrl(selectedStudent?.cv_url, 'cv').then(setSheetCvUrl);
    resolveMediaUrl(selectedStudent?.video_pitch_url, 'video').then(setSheetVideoUrl);
  }, [selectedStudent?.cv_url, selectedStudent?.video_pitch_url]);

  function openVideo(url: string) {
    setVideoUrl(url);
    setShowVideoPlayer(true);
  }

  const currentStudent = students[currentIndex];
  const nextStudent = students[currentIndex + 1];

  if (loading) {
    return (
      <div className="bg-[#FAF7F1] flex items-center justify-center min-h-[100dvh]">
        <Loader2 className="w-8 h-8 text-[#0B6B60] animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="bg-[#FAF7F1] flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#E1F2EF] flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-[#0B6B60]" />
        </div>
        <h2 className="text-xl font-bold text-[#211F1A] mb-2">Ingen butik oprettet</h2>
        <p className="text-[#6E6759] text-sm">
          Opret din butiksprofil først for at se interesserede elever
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF7F1] min-h-[100dvh]">
    {/* Swipe confirmation toast */}
    <div aria-live="polite" className="fixed top-4 inset-x-4 z-[60] flex justify-center pointer-events-none">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className="flex items-center gap-2.5 max-w-full px-4 py-2.5 rounded-full bg-white border border-[#EAE4D8] varm-dock-shadow"
          >
            {toast.kind === 'like' ? (
              <span className="w-7 h-7 rounded-full bg-[#FCEAE3] flex items-center justify-center shrink-0">
                <Heart size={14} className="text-[#EE5B3A] fill-[#EE5B3A]/40" />
              </span>
            ) : toast.kind === 'undo' ? (
              <span className="w-7 h-7 rounded-full bg-[#E1F2EF] flex items-center justify-center shrink-0">
                <RotateCcw size={14} className="text-[#0B6B60]" />
              </span>
            ) : (
              <span className="w-7 h-7 rounded-full bg-[#FAF7F1] border border-[#EAE4D8] flex items-center justify-center shrink-0">
                <X size={14} className="text-[#6E6759]" />
              </span>
            )}
            <span className="text-sm font-medium text-[#211F1A] truncate">
              {toast.kind === 'like' ? (
                <>Du likede <span className="font-bold">{toast.name}</span></>
              ) : toast.kind === 'undo' ? (
                <>Fortrudt — <span className="font-bold">{toast.name}</span> er tilbage</>
              ) : (
                <>Du fravalgte <span className="font-bold">{toast.name}</span></>
              )}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    <div className="max-w-md mx-auto px-4 pt-6 pb-4 safe-top">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h1 className="text-2xl font-extrabold text-[#211F1A] tracking-tight">
          Interesserede elever
        </h1>
        <p className="text-[#6E6759] text-sm mt-1">
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
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 rounded-[28px] bg-white border border-[#EAE4D8] varm-card-shadow"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#E1F2EF] flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-[#0B6B60]" />
            </div>
            <h2 className="text-lg font-bold text-[#211F1A] mb-2">
              Ingen interesserede elever endnu
            </h2>
            <p className="text-[#6E6759] text-sm leading-relaxed">
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
                  className="absolute inset-0 z-10 rounded-[28px] bg-[#EE5B3A]/30 flex items-center justify-center pointer-events-none"
                  style={{ opacity: rightOpacity }}
                >
                  <div className="bg-white/90 rounded-full p-4">
                    <Heart className="w-10 h-10 text-[#EE5B3A] fill-[#EE5B3A]/30" />
                  </div>
                </motion.div>
                <motion.div
                  className="absolute inset-0 z-10 rounded-[28px] bg-black/30 flex items-center justify-center pointer-events-none"
                  style={{ opacity: leftOpacity }}
                >
                  <div className="bg-white/90 rounded-full p-4">
                    <X className="w-10 h-10 text-[#211F1A]" />
                  </div>
                </motion.div>

                <StudentCard student={currentStudent} />

                {/* Profile button — stops drag propagation so tap always works */}
                <button
                  className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md bg-white/15 border border-white/20 text-white text-xs font-semibold shadow-lg"
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
          className="flex items-center justify-center gap-5 mt-6"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleUndo}
            disabled={swiping || !lastSwipe}
            aria-label="Fortryd sidste swipe"
            className="w-12 h-12 rounded-full bg-white border border-[#EAE4D8] varm-card-shadow flex items-center justify-center hover:bg-[#FAF7F1] transition-colors group disabled:opacity-30 disabled:pointer-events-none"
          >
            <RotateCcw
              size={20}
              className="text-[#8B8471] group-hover:text-[#6E6759] transition-colors"
            />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSwipe('left')}
            disabled={swiping}
            aria-label="Afvis"
            className="w-[72px] h-[72px] rounded-full bg-white border border-[#EAE4D8] varm-card-shadow flex items-center justify-center hover:bg-[#FAF7F1] transition-all disabled:opacity-50 group"
          >
            <X className="w-8 h-8 text-[#6E6759] group-hover:text-[#211F1A] transition-colors" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSwipe('right')}
            disabled={swiping}
            aria-label="Synes godt om"
            className="w-20 h-20 rounded-full bg-[#EE5B3A] hover:bg-[#DC4E2E] varm-card-shadow flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <Heart className="w-9 h-9 text-white fill-white/30" />
          </motion.button>
        </motion.div>
      )}

      {/* ── Student detail bottom sheet ── */}
      <Modal
        open={!!selectedStudent}
        onOpenChange={(o) => !o && setSelectedStudent(null)}
        title="Elevprofil"
        variant="sheet"
        contentClassName="max-h-[90dvh] overflow-y-auto bg-white rounded-t-3xl border-t border-[#EAE4D8]"
      >
        {selectedStudent && (
          <>
              <div className="sticky top-0 z-10 bg-white flex justify-center py-3 rounded-t-3xl">
                <div className="w-10 h-1 rounded-full bg-[#EAE4D8]" />
              </div>

              <div className="px-6 pb-10">
                {/* Close button */}
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setSelectedStudent(null)}
                    aria-label="Luk"
                    className="w-11 h-11 rounded-full bg-[#FAF7F1] flex items-center justify-center text-[#6E6759] hover:text-[#211F1A] transition-colors"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                {/* Avatar + name */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#E1F2EF] flex items-center justify-center shrink-0">
                    {selectedStudent.avatar_url ? (
                      <img
                        src={selectedStudent.avatar_url}
                        alt={selectedStudent.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-[#0B6B60]">
                        {selectedStudent.full_name?.charAt(0)?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-[#211F1A] truncate">
                      {selectedStudent.full_name}
                      {(() => {
                        const age = calculateAge(selectedStudent.date_of_birth);
                        return age ? <span className="text-base font-normal text-[#8B8471] ml-2">{age} år</span> : null;
                      })()}
                    </h2>
                    {educationLineLabels(selectedStudent) && (
                      <p className="text-[#6E6759] text-sm">
                        {educationLineLabels(selectedStudent)}
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
                    <h3 className="text-sm font-medium text-[#6E6759] mb-1.5">
                      Uddannelse
                    </h3>
                    <div className="flex items-start gap-3 text-[#211F1A] text-sm bg-[#FAF7F1] rounded-xl p-4 border border-[#EAE4D8]">
                      <GraduationCap className="w-4 h-4 text-[#4E50C4] shrink-0 mt-0.5" />
                      <div>
                        {youthEducationLabels(selectedStudent) && (
                          <p>{youthEducationLabels(selectedStudent)}</p>
                        )}
                        {selectedStudent.youth_education_school && (
                          <p className="text-[#6E6759] mt-0.5">{selectedStudent.youth_education_school}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Address */}
                {(selectedStudent.address || selectedStudent.city) && (
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-[#6E6759] mb-1.5">
                      Adresse
                    </h3>
                    <div className="flex items-start gap-3 text-[#211F1A] text-sm bg-[#FAF7F1] rounded-xl p-4 border border-[#EAE4D8]">
                      <MapPin className="w-4 h-4 text-[#0B6B60] shrink-0 mt-0.5" />
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
                    <h3 className="text-sm font-medium text-[#6E6759] mb-1.5">
                      Fødselsdato
                    </h3>
                    <div className="flex items-center gap-3 text-[#211F1A] text-sm bg-[#FAF7F1] rounded-xl p-4 border border-[#EAE4D8]">
                      <Calendar className="w-4 h-4 text-[#0B6B60] shrink-0" />
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
                    <h3 className="text-sm font-medium text-[#6E6759] mb-1.5">
                      Erhvervserfaring
                    </h3>
                    <div className="flex items-start gap-3 text-[#211F1A] text-sm bg-[#FAF7F1] rounded-xl p-4 border border-[#EAE4D8]">
                      <Briefcase className="w-4 h-4 text-[#0B6B60] shrink-0 mt-0.5" />
                      <p>{selectedStudent.work_experience}</p>
                    </div>
                  </div>
                )}

                {/* Video pitch */}
                {selectedStudent.video_pitch_url && (
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-[#6E6759] mb-1.5">
                      Video-pitch
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => sheetVideoUrl && openVideo(sheetVideoUrl)}
                      aria-label="Afspil video-pitch"
                      className="w-full relative rounded-xl overflow-hidden bg-[#FAF7F1] border border-[#EAE4D8] aspect-video flex items-center justify-center group"
                    >
                      {selectedStudent.video_thumbnail_url ? (
                        <img
                          src={selectedStudent.video_thumbnail_url}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover"
                        />
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
                {selectedStudent.cv_url && (
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-[#6E6759] mb-1.5">
                      CV
                    </h3>
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

                {/* Contact info */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[#6E6759] mb-2">
                    Kontaktoplysninger
                  </h3>
                  {selectedStudent.phone && (
                    <a
                      href={`tel:${selectedStudent.phone}`}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-[#E1F2EF] border border-[#C4E4DE] text-[#0B6B60] hover:bg-[#D3EAE5] transition-colors"
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
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAF7F1] border border-[#EAE4D8] text-[#211F1A] hover:bg-[#F3EEE4] transition-colors"
                    >
                      <Mail className="w-5 h-5" />
                      <span className="font-medium text-sm">
                        Email: {selectedStudent.email}
                      </span>
                    </a>
                  )}
                  {!selectedStudent.phone && !selectedStudent.email && (
                    <p className="text-[#8B8471] text-sm p-3.5 rounded-xl bg-[#FAF7F1] border border-[#EAE4D8]">
                      Eleven har ikke delt kontaktoplysninger endnu
                    </p>
                  )}
                </div>
              </div>
          </>
        )}
      </Modal>

      {/* Video player overlay */}
      <Modal
        open={showVideoPlayer && !!videoUrl}
        onOpenChange={(o) => !o && setShowVideoPlayer(false)}
        title="Video-pitch"
        variant="center"
        overlayClassName="z-[70] bg-black/90"
        contentZClassName="z-[71]"
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

      {/* Match celebration overlay */}
      <Modal
        open={showMatch && !!matchedStudent}
        onOpenChange={(o) => !o && setShowMatch(false)}
        title="Det er et match"
        variant="center"
        overlayClassName="z-[100] bg-black/80 backdrop-blur-sm"
        contentZClassName="z-[101]"
        contentClassName="w-[calc(100vw-2rem)] max-w-sm bg-white rounded-3xl p-8 text-center border border-[#EAE4D8] varm-card-shadow"
        ariaLive="assertive"
      >
        {matchedStudent && (
          <>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Sparkles className="w-16 h-16 text-[#0E8578] mx-auto mb-4" />
            </motion.div>
            <h2 className="text-3xl font-extrabold text-[#211F1A] mb-2">
              Det er et match!
            </h2>
            <p className="text-[#6E6759] mb-6">
              Du og {matchedStudent.full_name} har matchet! I kan nu se hinandens kontaktoplysninger.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setShowMatch(false);
                window.location.href = '/manager/matches';
              }}
              className="w-full py-3 rounded-xl bg-[#0E8578] hover:bg-[#0B6B60] text-white font-semibold transition-colors"
            >
              Se match
            </motion.button>
            <button
              onClick={() => setShowMatch(false)}
              className="w-full py-3 mt-2 text-[#6E6759] text-sm font-medium"
            >
              Fortsæt med at swipe
            </button>
          </>
        )}
      </Modal>
    </div>
    </div>
  );
}
