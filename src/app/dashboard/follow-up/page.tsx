'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Mail, ChevronDown, TrendingDown, CheckCircle2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { EDUCATION_LINE_LABELS, BEHAVIORAL_STYLE_LABELS, BEHAVIORAL_STYLE_ICONS } from '@/lib/types/database';
import type { EducationLine, BehavioralStyle } from '@/lib/types/database';

interface AtRiskStudent {
  id: string;
  name: string;
  email: string | null;
  education_line: string;
  swipes: number;
  matches: number;
  days_inactive: number;
  last_active: string;
  primary_style: string;
  contacted: boolean;
  risk_reason: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export default function FollowUpPage() {
  const [students, setStudents] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAtRiskStudents() {
      const supabase = createClient();

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, education_line, primary_style, last_active_at')
        .eq('role', 'student')
        .eq('is_active', true);

      if (!profiles) {
        setLoading(false);
        return;
      }

      const now = new Date();

      // Batch the per-student counts and load who's already been contacted.
      const [enriched, followUpsRes] = await Promise.all([
        Promise.all(
          profiles.map(async (p) => {
            const [{ count: swipeCount }, { count: matchCount }] = await Promise.all([
              supabase
                .from('swipes')
                .select('*', { count: 'exact', head: true })
                .eq('profile_id', p.id),
              supabase
                .from('matches')
                .select('*', { count: 'exact', head: true })
                .eq('student_id', p.id),
            ]);
            return { p, swipes: swipeCount ?? 0, matches: matchCount ?? 0 };
          })
        ),
        supabase.from('follow_ups').select('student_id'),
      ]);

      const contactedSet = new Set(
        (followUpsRes.data ?? []).map((f) => f.student_id)
      );

      const atRisk: AtRiskStudent[] = [];

      for (const { p, swipes, matches } of enriched) {
        if (matches > 0) continue;

        const lastActive = p.last_active_at ? new Date(p.last_active_at) : null;
        const daysInactive = lastActive
          ? Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        const isAtRisk = swipes >= 5 || daysInactive >= 5;
        if (!isAtRisk) continue;

        const eduLabel = p.education_line
          ? EDUCATION_LINE_LABELS[p.education_line as EducationLine] || p.education_line
          : 'Ikke angivet';

        const styleIcon = p.primary_style
          ? BEHAVIORAL_STYLE_ICONS[p.primary_style as BehavioralStyle] || ''
          : '';
        const styleLabel = p.primary_style
          ? BEHAVIORAL_STYLE_LABELS[p.primary_style as BehavioralStyle] || p.primary_style
          : 'Ikke angivet';

        let reason = 'Mange swipes, ingen matches';
        if (daysInactive >= 5 && swipes > 5) reason = 'Inaktiv + ingen matches';
        else if (swipes >= 10) reason = 'Høj aktivitet uden resultat';
        else if (daysInactive >= 5) reason = 'Lav aktivitet, potentielt opgivet';

        atRisk.push({
          id: p.id,
          name: p.full_name || 'Ukendt',
          email: p.email ?? null,
          education_line: eduLabel,
          swipes,
          matches,
          days_inactive: daysInactive,
          last_active: p.last_active_at || '',
          primary_style: `${styleIcon} ${styleLabel}`.trim(),
          contacted: contactedSet.has(p.id),
          risk_reason: reason,
        });
      }

      atRisk.sort((a, b) => {
        const aScore = a.swipes + a.days_inactive * 5;
        const bScore = b.swipes + b.days_inactive * 5;
        return bScore - aScore;
      });

      setStudents(atRisk);
      setLoading(false);
    }

    fetchAtRiskStudents();
  }, []);

  const markContacted = async (id: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('follow_ups')
      .upsert(
        { student_id: id, contacted_by: user.id, contacted_at: new Date().toISOString() },
        { onConflict: 'student_id' }
      );
    if (error) {
      console.error('Kunne ikke gemme opfølgning:', error);
      return;
    }
    setStudents(prev => prev.map(s => s.id === id ? { ...s, contacted: true } : s));
  };

  const urgencyLevel = (s: AtRiskStudent) => {
    if (s.days_inactive >= 5 && s.swipes > 5) return 'critical';
    if (s.swipes >= 10 && s.matches === 0) return 'high';
    return 'medium';
  };

  const urgencyColors = {
    critical: { bg: 'bg-rose-500/15', border: 'border-rose-500/30', text: 'text-rose-400', label: 'Kritisk' },
    high: { bg: 'bg-orange-500/15', border: 'border-orange-500/30', text: 'text-orange-400', label: 'Høj' },
    medium: { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400', label: 'Medium' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  const notContacted = students.filter(s => !s.contacted).length;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]"><span className="gradient-text">Opfølgning</span></h1>
        <p className="text-[var(--text-secondary)] mt-1">Elever der kan have brug for vejledning</p>
      </motion.div>

      {students.length === 0 ? (
        <motion.div variants={itemVariants} className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-300">Alle elever klarer sig godt!</p>
            <p className="text-xs text-emerald-400/70 mt-0.5">Der er ingen elever der kræver opfølgning lige nu</p>
          </div>
        </motion.div>
      ) : (
        <>
          <motion.div variants={itemVariants} className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-300">{notContacted} elev{notContacted !== 1 ? 'er' : ''} kræver opmærksomhed</p>
              <p className="text-xs text-rose-400/70 mt-0.5">Disse elever har mange swipes men ingen matches, eller er blevet inaktive</p>
            </div>
          </motion.div>

          <div className="space-y-3">
            {students.map(student => {
              const urgency = urgencyLevel(student);
              const colors = urgencyColors[urgency];
              const isExpanded = expandedId === student.id;

              return (
                <motion.div key={student.id} variants={itemVariants} className={`rounded-2xl glass-card transition-all overflow-hidden ${student.contacted ? '!border-emerald-500/20 opacity-60' : ''}`}>
                  <button onClick={() => setExpandedId(isExpanded ? null : student.id)} className="w-full flex items-center gap-4 p-4 text-left">
                    <div className={`w-10 h-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center shrink-0`}>
                      {student.contacted ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertTriangle size={18} className={colors.text} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[var(--text-primary)] text-sm truncate">{student.name}</p>
                        {student.contacted && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Kontaktet</span>}
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">{student.education_line} · {student.primary_style}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>{colors.label}</span>
                      <ChevronDown size={16} className={`text-[var(--text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                            <TrendingDown size={14} className={colors.text} />
                            <span>{student.risk_reason}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="p-2.5 rounded-xl bg-white/5 text-center">
                              <p className="text-sm font-bold text-blue-400">{student.swipes}</p>
                              <p className="text-[10px] text-[var(--text-muted)]">Swipes</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/5 text-center">
                              <p className="text-sm font-bold text-rose-400">{student.matches}</p>
                              <p className="text-[10px] text-[var(--text-muted)]">Matches</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/5 text-center">
                              <p className="text-sm font-bold text-amber-400">{student.days_inactive}d</p>
                              <p className="text-[10px] text-[var(--text-muted)]">Inaktiv</p>
                            </div>
                          </div>
                          {!student.contacted && (
                            <div className="flex gap-2">
                              <a
                                href={student.email ? `mailto:${student.email}?subject=${encodeURIComponent('Opfølgning på din praktiksøgning')}` : undefined}
                                aria-disabled={!student.email}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors aria-disabled:opacity-50 aria-disabled:pointer-events-none"
                              >
                                <Mail size={14} /> Send besked
                              </a>
                              <button onClick={() => markContacted(student.id)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors">
                                <CheckCircle2 size={14} /> Markér kontaktet
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}
