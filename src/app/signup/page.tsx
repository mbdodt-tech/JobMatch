'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Store,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Organization } from '@/lib/types/database';

type Role = 'student' | 'store_manager';

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [organizationId, setOrganizationId] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadOrganizations() {
      const supabase = createClient();
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .order('name');
      if (data) setOrganizations(data);
    }
    loadOrganizations();
  }, []);

  function goToStep2(selectedRole: Role) {
    setRole(selectedRole);
    setDirection(1);
    setStep(2);
    setError('');
  }

  function goBack() {
    setDirection(-1);
    setStep(1);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!role) {
      setError('Vælg venligst en rolle');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Adgangskoden skal være mindst 6 tegn');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            organization_id: role === 'student' ? organizationId || null : null,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Denne email er allerede registreret');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      // Redirect based on role
      if (role === 'student') {
        router.push('/student/onboarding');
      } else {
        router.push('/manager/store');
      }
    } catch {
      setError('Der opstod en fejl. Prøv igen.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background orbs — vibrant and colorful */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-br from-fuchsia-600/25 to-purple-600/15 blur-3xl"
        style={{ top: '10%', right: '5%' }}
        animate={{ x: [0, -30, 20, 0], y: [0, 20, -15, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[320px] h-[320px] rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/15 blur-3xl"
        style={{ bottom: '10%', left: '5%' }}
        animate={{ x: [0, 25, -20, 0], y: [0, -25, 15, 0], scale: [1, 0.95, 1.1, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        className="absolute w-[220px] h-[220px] rounded-full bg-gradient-to-br from-orange-500/15 to-pink-500/10 blur-3xl"
        style={{ top: '55%', left: '45%' }}
        animate={{ x: [0, 20, -25, 0], y: [0, -20, 15, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 mb-6"
        >
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  step >= s
                    ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                    : 'bg-white/5 border border-white/10 text-text-muted'
                }`}
              >
                {s}
              </div>
              {s < 2 && (
                <div
                  className={`w-12 h-0.5 rounded-full transition-colors duration-300 ${
                    step > 1 ? 'bg-purple-500' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          ))}
        </motion.div>

        {/* Card */}
        <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl shadow-purple-500/10 overflow-hidden">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex justify-center mb-5"
          >
            <div className="animate-float w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-blue-500 animate-gradient flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
          </motion.div>

          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-extrabold tracking-tight">
                    <span className="gradient-text">Kom i gang</span> 🎉
                  </h1>
                  <p className="text-text-secondary text-sm mt-2">Hvem er du?</p>
                </div>

                <div className="space-y-3">
                  {/* Student card */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => goToStep2('student')}
                    className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5 hover:shadow-lg hover:shadow-fuchsia-500/10 transition-all text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-500 flex items-center justify-center shrink-0 shadow-lg shadow-fuchsia-500/30">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg">Elev 🎓</h3>
                        <p className="text-text-secondary text-sm mt-0.5">
                          Jeg leder efter en praktikplads
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-purple-400 group-hover:translate-x-1 transition-all mt-1" />
                    </div>
                  </motion.button>

                  {/* Store manager card */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => goToStep2('store_manager')}
                    className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 hover:shadow-lg hover:shadow-cyan-500/10 transition-all text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/30">
                        <Store className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg">Butikschef 🏪</h3>
                        <p className="text-text-secondary text-sm mt-0.5">
                          Jeg leder efter en praktikant
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-blue-400 group-hover:translate-x-1 transition-all mt-1" />
                    </div>
                  </motion.button>
                </div>

                <p className="text-center text-sm text-text-secondary mt-6">
                  Har du allerede en konto?{' '}
                  <Link href="/login" className="text-purple-400 font-medium hover:text-purple-300 transition-colors">
                    Log ind
                  </Link>
                </p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-extrabold tracking-tight">
                    <span className="gradient-text">Næsten i mål</span>{' '}
                    {role === 'student' ? '🎓' : '🏪'}
                  </h1>
                  <p className="text-text-secondary text-sm mt-2">Udfyld dine oplysninger</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-1.5">Fulde navn</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none transition-colors group-focus-within:text-fuchsia-400 z-10" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Dit fulde navn"
                        required
                        className="w-full !pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-1.5">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none transition-colors group-focus-within:text-fuchsia-400 z-10" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="din@email.dk"
                        required
                        className="w-full !pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-1.5">Adgangskode</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none transition-colors group-focus-within:text-fuchsia-400 z-10" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mindst 6 tegn"
                        required
                        minLength={6}
                        className="w-full !pl-11 !pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors z-10"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Organization selector for students */}
                  {role === 'student' && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        Erhvervscenter / skole
                      </label>
                      <div className="relative">
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                        <select
                          value={organizationId}
                          onChange={(e) => setOrganizationId(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-[#12121A]">
                            Vælg din skole...
                          </option>
                          {organizations.map((org) => (
                            <option key={org.id} value={org.id} className="bg-[#12121A]">
                              {org.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={goBack}
                      className="px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Tilbage
                    </motion.button>

                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                      className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-500 animate-gradient text-white font-bold shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-shadow"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Opretter...
                        </>
                      ) : (
                        <>
                          Opret konto
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
