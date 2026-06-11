'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  PanInfo,
} from 'framer-motion';
import { Loader2, Heart, X, Sparkles, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Store } from '@/lib/types/database';
import StudentCard from '@/components/manager/StudentCard';

export default function ManagerFeedPage() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedStudent, setMatchedStudent] = useState<Profile | null>(null);
  const [swiping, setSwiping] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const rightOpacity = useTransform(x, [0, 100], [0, 1]);
  const leftOpacity = useTransform(x, [-100, 0], [1, 0]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Get manager's store
    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .eq('manager_id', user.id)
      .single();

    if (!storeData) {
      setLoading(false);
      return;
    }
    setStore(storeData);

    // Get students who swiped right on this store
    const { data: rightSwipes } = await supabase
      .from('swipes')
      .select('profile_id')
      .eq('store_id', storeData.id)
      .eq('swiper_role', 'student')
      .eq('direction', 'right');

    if (!rightSwipes || rightSwipes.length === 0) {
      setLoading(false);
      return;
    }

    const studentIds = rightSwipes.map((s) => s.profile_id);

    // Get students already swiped on by this manager
    const { data: alreadySwiped } = await supabase
      .from('swipes')
      .select('profile_id')
      .eq('store_id', storeData.id)
      .eq('swiper_role', 'store_manager');

    const alreadySwipedIds = (alreadySwiped || []).map((s) => s.profile_id);

    // Filter out already swiped students
    const remainingIds = studentIds.filter(
      (id) => !alreadySwipedIds.includes(id)
    );

    if (remainingIds.length === 0) {
      setLoading(false);
      return;
    }

    // Get student profiles
    const { data: studentProfiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', remainingIds);

    if (studentProfiles) {
      setStudents(studentProfiles);
    }
    setLoading(false);
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

      // Record swipe
      await supabase.from('swipes').insert({
        profile_id: student.id,
        store_id: store.id,
        swiper_role: 'store_manager',
        direction,
      });

      // Check for match (both swiped right)
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
          // Get the manager's swipe ID
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
            // Create match
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

  const currentStudent = students[currentIndex];
  const nextStudent = students[currentIndex + 1];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
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
    <div className="max-w-md mx-auto px-4 pt-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Interesserede elever
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Elever der har swiped højre på {store.name}
        </p>
      </motion.div>

      {/* Card stack */}
      <div className="relative h-[500px]">
        {!currentStudent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              Ingen interesserede elever endnu
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              Din butik vises for relevante elever 📱
              <br />
              Kom tilbage senere!
            </p>
          </motion.div>
        ) : (
          <>
            {/* Next card (behind) */}
            {nextStudent && (
              <div className="absolute inset-0 scale-[0.95] opacity-50 pointer-events-none">
                <StudentCard student={nextStudent} />
              </div>
            )}

            {/* Current card */}
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
                  className="absolute inset-0 z-10 rounded-3xl bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center pointer-events-none"
                  style={{ opacity: rightOpacity }}
                >
                  <div className="bg-green-500 rounded-full p-4 shadow-lg shadow-green-500/30">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                </motion.div>
                <motion.div
                  className="absolute inset-0 z-10 rounded-3xl bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center pointer-events-none"
                  style={{ opacity: leftOpacity }}
                >
                  <div className="bg-red-500 rounded-full p-4 shadow-lg shadow-red-500/30">
                    <X className="w-10 h-10 text-white" />
                  </div>
                </motion.div>

                <StudentCard student={currentStudent} />
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
            className="w-16 h-16 rounded-full bg-white/5 border border-red-500/30 flex items-center justify-center hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            <X className="w-7 h-7 text-red-400" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSwipe('right')}
            disabled={swiping}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30 disabled:opacity-50"
          >
            <Heart className="w-7 h-7 text-white" />
          </motion.button>
        </motion.div>
      )}

      {/* Match celebration overlay */}
      <AnimatePresence>
        {showMatch && matchedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowMatch(false)}
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 rounded-3xl p-8 text-center border border-white/20 shadow-2xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-3xl font-extrabold text-white mb-2">
                Det er et match! 🎉
              </h2>
              <p className="text-text-secondary mb-6">
                Du og {matchedStudent.full_name} har matchet! I kan nu se hinandens kontaktoplysninger.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowMatch(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold shadow-lg"
              >
                Fantastisk!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
