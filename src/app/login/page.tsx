'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, Eye, EyeOff, Zap, Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Forkert email eller adgangskode');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Kunne ikke hente brugerdata');
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarding_completed')
        .eq('id', user.id)
        .single();

      const role = profile?.role || user.user_metadata?.role;

      let destination = '/';
      switch (role) {
        case 'student':
          destination = profile?.onboarding_completed ? '/student/feed' : '/student/onboarding';
          break;
        case 'store_manager':
          destination = '/manager/feed';
          break;
        case 'school_admin':
        case 'super_admin':
          destination = '/dashboard';
          break;
      }

      window.location.href = destination;
    } catch {
      setError('Der opstod en fejl. Prøv igen.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] aurora-bg aurora-bg-emerald aurora-animated flex flex-col items-center justify-center px-5 relative overflow-hidden">
      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="p-6 sm:p-8 rounded-3xl glass-card">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <Logo variant="icon" className="animate-float w-16 h-16 rounded-2xl glow-green" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-10"
          >
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Velkommen <span className="gradient-text-emerald">tilbage</span>
            </h1>
            <p className="text-text-secondary text-base mt-2 break-words">Log ind og find dit næste match</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
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
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-semibold text-text-secondary mb-2">Adgangskode</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Din adgangskode"
                  required
                  className="w-full !pl-12 !pr-12 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Skjul adgangskode' : 'Vis adgangskode'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors z-10"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                </button>
              </div>
            </motion.div>

            {/* Error Message */}
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

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="pt-2"
            >
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.97 }}
                className="w-full py-4 rounded-2xl btn-gradient-emerald text-white font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Logger ind...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Log ind
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>

          {/* Sign up link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-sm text-text-secondary mt-8"
          >
            Har du ikke en konto?{' '}
            <Link
              href="/signup"
              className="font-semibold gradient-text-emerald hover:opacity-80 transition-opacity"
            >
              Opret dig her
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
