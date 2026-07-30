'use client';

import { motion } from 'framer-motion';
import { GraduationCap, Store, Building2, ArrowRight, UserPlus, Repeat2, Heart, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/Logo';

const roles = [
  {
    title: 'Elev',
    icon: GraduationCap,
    description: 'Find den perfekte praktikplads der matcher din stil og dine interesser',
    accent: 'bg-[#0F9B8E]',
    iconBox: 'bg-[#E1F2EF] border border-[#C4E4DE]',
    iconColor: 'text-[#0B6B60]',
    href: '/signup',
  },
  {
    title: 'Butikschef',
    icon: Store,
    description: 'Find motiverede elever der passer perfekt til din butik',
    accent: 'bg-[#5D5FE0]',
    iconBox: 'bg-[#EEEEFC] border border-[#DBDBF8]',
    iconColor: 'text-[#4E50C4]',
    href: '/signup',
  },
  {
    title: 'Erhvervscenter',
    icon: Building2,
    description: 'Få overblik over matches, statistik og elevernes trivsel',
    accent: 'bg-[#EAE4D8]',
    iconBox: 'bg-[#FAF7F1] border border-[#EAE4D8]',
    iconColor: 'text-[#6E6759]',
    href: '/login',
    note: 'Konto oprettes af din skole',
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
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#FAF7F1]">
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
            <Logo variant="icon" className="w-8 h-8 rounded-xl" />
            <span className="text-lg font-bold text-[#211F1A] tracking-tight">Jobmatch</span>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-[#6E6759] hover:text-[#211F1A] transition-colors px-4 py-2 rounded-full bg-white border border-[#EAE4D8] hover:border-[#0E8578]/40"
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
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#EAE4D8] varm-card-shadow text-sm text-[#6E6759] mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0B6B60]" />
              Praktik-matching til den nye generation
            </motion.div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] mb-4">
              <span className="text-[#211F1A]">Find din</span>
              <br />
              <span className="text-[#0B6B60]">drømmepraktik</span>
            </h1>

            <motion.p
              className="text-[#6E6759] text-base leading-relaxed max-w-xs mx-auto"
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
                className="relative group px-8 py-4 rounded-full bg-[#0E8578] hover:bg-[#0B6B60] text-white font-semibold text-lg overflow-hidden transition-colors"
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
              className="text-xl font-bold text-center text-[#211F1A] mb-6"
            >
              Hvem er du?
            </motion.h2>

            {roles.map((role) => (
              <motion.div key={role.title} variants={itemVariants}>
                <Link href={role.href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative p-5 rounded-2xl bg-white border border-[#EAE4D8] varm-card-shadow hover:border-[#0E8578]/40 transition-colors cursor-pointer overflow-hidden"
                  >
                    {/* Accent line */}
                    <div className={`absolute top-0 left-0 w-full h-0.5 ${role.accent} opacity-50 group-hover:opacity-100 transition-opacity`} />

                    <div className="flex items-start gap-4">
                      <div className={`shrink-0 w-12 h-12 rounded-xl ${role.iconBox} flex items-center justify-center`}>
                        <role.icon className={`w-6 h-6 ${role.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[#211F1A] font-semibold text-lg">{role.title}</h3>
                        <p className="text-[#6E6759] text-sm mt-0.5 leading-relaxed">{role.description}</p>
                        {role.note && (
                          <p className="text-[#8B8471] text-xs mt-1.5">{role.note}</p>
                        )}
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#8B8471] group-hover:text-[#0B6B60] group-hover:translate-x-1 transition-all mt-1 shrink-0" />
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
              className="text-xl font-bold text-center text-[#211F1A] mb-8"
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
                    <div className="w-12 h-12 rounded-full bg-[#E1F2EF] border border-[#C4E4DE] flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-[#0B6B60]" />
                    </div>
                    {i < steps.length - 1 && (
                      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-px h-6 bg-[#EAE4D8]" />
                    )}
                  </div>
                  <div className="pt-1">
                    <h3 className="text-[#211F1A] font-semibold">
                      {step.number}. {step.title}
                    </h3>
                    <p className="text-[#6E6759] text-sm mt-0.5">{step.description}</p>
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
                  className="px-8 py-3.5 rounded-full bg-[#0E8578] hover:bg-[#0B6B60] text-white font-semibold transition-colors"
                >
                  Start nu — det er gratis ✨
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="px-6 pb-8 text-center">
          <p className="text-[#8B8471] text-xs">
            © 2026 Jobmatch · Lavet med 💜 i Danmark
          </p>
        </footer>
      </div>
    </div>
  );
}
