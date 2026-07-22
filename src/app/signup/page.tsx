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
  Eye,
  EyeOff,
  ChevronDown,
  User,
  Mail,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/Logo';
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
    <div className="min-h-[100dvh] aurora-bg aurora-bg-emerald aurora-animated flex flex-col items-center justify-center px-5 relative overflow-hidden">
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
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white glow-green'
                    : 'glass text-text-muted'
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
        <div className="p-6 sm:p-8 rounded-3xl glass-card overflow-hidden">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex justify-center mb-6"
          >
            <Logo variant="icon" className="animate-float w-16 h-16 rounded-2xl glow-green" />
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
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                    Kom i <span className="gradient-text-emerald">gang</span>
                  </h1>
                  <p className="text-text-secondary text-base mt-2">Hvem er du?</p>
                </div>

                <div className="space-y-4">
                  {/* Student card */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => goToStep2('student')}
                    className="w-full p-5 rounded-2xl glass-card hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 glow-green flex items-center justify-center shrink-0">
                        <GraduationCap className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
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
                    className="w-full p-5 rounded-2xl glass-card hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/30">
                        <Store className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
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
                  <Link href="/login" className="font-semibold gradient-text-emerald hover:opacity-80 transition-opacity">
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
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                    Næsten i <span className="gradient-text-emerald">mål</span>
                  </h1>
                  <p className="text-text-secondary text-base mt-2">Udfyld dine oplysninger</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Fulde navn</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Dit fulde navn"
                        required
                        className="w-full !pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-base"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="din@email.dk"
                        required
                        className="w-full !pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-base"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Adgangskode</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mindst 6 tegn"
                        required
                        minLength={6}
                        className="w-full !pl-12 !pr-12 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-base"
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
                      className="px-5 py-4 rounded-2xl glass text-white font-medium hover:bg-white/10 transition-all flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Tilbage
                    </motion.button>

                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                      className="flex-1 py-4 rounded-2xl btn-gradient-emerald text-white font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
