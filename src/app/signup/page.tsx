'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Store,
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

      if (role === 'student') {
        window.location.href = '/student/onboarding';
      } else {
        window.location.href = '/manager/store';
      }
    } catch {
      setError('Der opstod en fejl. Prøv igen.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)] flex flex-col items-center justify-center px-5 relative overflow-hidden">
      {/* Background orbs */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-br from-emerald-500/25 to-teal-500/15 blur-3xl"
        style={{ top: '10%', right: '5%' }}
        animate={{ x: [0, -30, 20, 0], y: [0, 20, -15, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[320px] h-[320px] rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-400/15 blur-3xl"
        style={{ bottom: '10%', left: '5%' }}
        animate={{ x: [0, 25, -20, 0], y: [0, -25, 15, 0], scale: [1, 0.95, 1.1, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        className="absolute w-[220px] h-[220px] rounded-full bg-gradient-to-br from-lime-400/15 to-emerald-500/10 blur-3xl"
        style={{ top: '55%', left: '45%' }}
        animate={{ x: [0, 20, -25, 0], y: [0, -20, 15, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 mb-6"
        >
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  step >= s
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                    : 'bg-white/5 border border-white/10 text-text-muted'
                }`}
              >
                {s}
              </div>
              {s < 2 && (
                <div
                  className={`w-14 h-0.5 rounded-full transition-colors duration-300 ${
                    step > 1 ? 'bg-emerald-500' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          ))}
        </motion.div>

        {/* Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl shadow-emerald-500/10 overflow-hidden">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex justify-center mb-6"
          >
            <div className="animate-float w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-400 animate-gradient flex items-center justify-center shadow-lg shadow-emerald-500/50">
              <Sparkles className="w-8 h-8 text-white" />
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
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-extrabold tracking-tight">
                    <span className="gradient-text">Kom i gang</span>
                  </h1>
                  <p className="text-text-secondary text-base mt-2">Hvem er du?</p>
                </div>

                <div className="space-y-4">
                  {/* Student card */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => goToStep2('student')}
                    className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:shadow-lg hover:shadow-emerald-500/10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
                        <GraduationCap className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg">Elev</h3>
                        <p className="text-text-secondary text-sm mt-0.5">
                          Jeg leder efter en praktikplads
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.button>

                  {/* Store manager card */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => goToStep2('store_manager')}
                    className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 hover:shadow-lg hover:shadow-cyan-500/10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/30">
                        <Store className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg">Butikschef</h3>
                        <p className="text-text-secondary text-sm mt-0.5">
                          Jeg leder efter en praktikant
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.button>
                </div>

                <p className="text-center text-sm text-text-secondary mt-8">
                  Har du allerede en konto?{' '}
                  <Link href="/login" className="font-semibold gradient-text hover:opacity-80 transition-opacity">
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
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-extrabold tracking-tight">
                    <span className="gradient-text">Næsten i mål</span>
                  </h1>
                  <p className="text-text-secondary text-base mt-2">Udfyld dine oplysninger</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Fulde navn</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Dit fulde navn"
                      required
                      className="w-full px-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-base"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="din@email.dk"
                      required
                      className="w-full px-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-base"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Adgangskode</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mindst 6 tegn"
                        required
                        minLength={6}
                        className="w-full px-4 !pr-12 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors z-10"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Organization selector for students */}
                  {role === 'student' && (
                    <div>
                      <label className="block text-sm font-semibold text-text-secondary mb-2">
                        Erhvervscenter / skole
                      </label>
                      <div className="relative">
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
                        <select
                          value={organizationId}
                          onChange={(e) => setOrganizationId(e.target.value)}
                          className="w-full px-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-base appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-[var(--bg-secondary)]">
                            Vælg din skole...
                          </option>
                          {organizations.map((org) => (
                            <option key={org.id} value={org.id} className="bg-[var(--bg-secondary)]">
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
                        className="flex items-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
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
                      className="px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Tilbage
                    </motion.button>

                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                      className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 animate-gradient text-white font-bold text-base shadow-lg shadow-emerald-500/40 hover:shadow-emerald-500/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-shadow"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
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
