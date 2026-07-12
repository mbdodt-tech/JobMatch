'use client';

import { motion } from 'framer-motion';
import { GraduationCap, Store, Building2, ArrowRight, UserPlus, Repeat2, Heart, Sparkles } from 'lucide-react';
import Link from 'next/link';

const roles = [
  {
    title: 'Elev',
    icon: GraduationCap,
    description: 'Find den perfekte praktikplads der matcher din stil og dine interesser',
    gradient: 'from-violet-500 to-blue-500',
    href: '/signup',
  },
  {
    title: 'Butikschef',
    icon: Store,
    description: 'Find motiverede elever der passer perfekt til din butik',
    gradient: 'from-blue-500 to-cyan-400',
    href: '/signup',
  },
  {
    title: 'Erhvervscenter',
    icon: Building2,
    description: 'Få overblik over matches, statistik og elevernes trivsel',
    gradient: 'from-orange-500 to-amber-400',
    href: '/login',
  },
];

const steps = [
  { number: '1', title: 'Opret profil', icon: UserPlus, description: 'Fortæl om dig selv og dine interesser' },
  { number: '2', title: 'Swipe', icon: Repeat2, description: 'Swipe igennem praktikpladser eller elever' },
  { number: '3', title: 'Match!', icon: Heart, description: 'Når I begge swiper højre, er det et match!' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function LandingPage() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden aurora-bg aurora-animated">
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between px-6 py-5"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 glow-violet flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Jobmatch</span>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-text-secondary hover:text-white transition-colors px-4 py-2 rounded-full border border-white/10 hover:border-white/20"
          >
            Log ind
          </Link>
        </motion.nav>

        {/* Hero */}
        <section className="px-6 pt-12 pb-16 max-w-md mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-text-secondary mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              Praktik-matching til den nye generation
            </motion.div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] mb-4">
              <span className="text-white">Find din</span>
              <br />
              <motion.span
                className="gradient-text"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 5, repeat: Infinity }}
                style={{ backgroundSize: '200% auto' }}
              >
                drømmepraktik
              </motion.span>
            </h1>

            <motion.p
              className="text-text-secondary text-base leading-relaxed max-w-xs mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Swipe, match og find den perfekte praktikplads — eller den perfekte praktikant
            </motion.p>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-8"
          >
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="relative group px-8 py-4 rounded-full btn-gradient text-white font-semibold text-lg overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Kom i gang
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>
            </Link>
          </motion.div>
        </section>

        {/* Role Cards */}
        <section className="px-6 pb-16 max-w-md mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="space-y-4"
          >
            <motion.h2
              variants={itemVariants}
              className="text-xl font-bold text-center text-white mb-6"
            >
              Hvem er du?
            </motion.h2>

            {roles.map((role) => (
              <motion.div key={role.title} variants={itemVariants}>
                <Link href={role.href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative p-5 rounded-2xl glass-card glass-card-hover cursor-pointer overflow-hidden"
                  >
                    {/* Gradient accent */}
                    <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${role.gradient} opacity-50 group-hover:opacity-100 transition-opacity`} />

                    <div className="flex items-start gap-4">
                      <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center shadow-lg`}>
                        <role.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-lg">{role.title}</h3>
                        <p className="text-text-secondary text-sm mt-0.5 leading-relaxed">{role.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-white group-hover:translate-x-1 transition-all mt-1 shrink-0" />
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* How It Works */}
        <section className="px-6 pb-20 max-w-md mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
          >
            <motion.h2
              variants={itemVariants}
              className="text-xl font-bold text-center text-white mb-8"
            >
              Så nemt er det
            </motion.h2>

            <div className="space-y-6">
              {steps.map((step, i) => (
                <motion.div
                  key={step.number}
                  variants={itemVariants}
                  className="flex items-start gap-4"
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/30 flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-violet-400" />
                    </div>
                    {i < steps.length - 1 && (
                      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-px h-6 bg-gradient-to-b from-violet-500/30 to-transparent" />
                    )}
                  </div>
                  <div className="pt-1">
                    <h3 className="text-white font-semibold">
                      {step.number}. {step.title}
                    </h3>
                    <p className="text-text-secondary text-sm mt-0.5">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom CTA */}
            <motion.div variants={itemVariants} className="mt-10 text-center">
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-3.5 rounded-full btn-gradient text-white font-semibold"
                >
                  Start nu — det er gratis ✨
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="px-6 pb-8 text-center">
          <p className="text-text-muted text-xs">
            © 2026 Jobmatch · Lavet med 💜 i Danmark
          </p>
        </footer>
      </div>
    </div>
  );
}
