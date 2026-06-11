'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Phone, Mail, Clock, ChevronDown, TrendingDown, Sparkles, MessageCircle, CheckCircle2 } from 'lucide-react';

interface AtRiskStudent {
  id: string;
  name: string;
  education_line: string;
  swipes: number;
  matches: number;
  days_inactive: number;
  last_active: string;
  primary_style: string;
  contacted: boolean;
  risk_reason: string;
}

const atRiskStudents: AtRiskStudent[] = [
  { id: '1', name: 'Sofia Nielsen', education_line: 'Kontor', swipes: 62, matches: 0, days_inactive: 1, last_active: '2026-06-10', primary_style: '🔬 Analytisk', contacted: false, risk_reason: 'Mange swipes, ingen matches' },
  { id: '2', name: 'Ida Christensen', education_line: 'Detail', swipes: 91, matches: 0, days_inactive: 2, last_active: '2026-06-09', primary_style: '⚡ Handlingsorienteret', contacted: false, risk_reason: 'Høj aktivitet uden resultat' },
  { id: '3', name: 'Emma Thomsen', education_line: 'Kontor', swipes: 73, matches: 0, days_inactive: 4, last_active: '2026-06-07', primary_style: '🤝 Social', contacted: true, risk_reason: 'Inaktiv + ingen matches' },
  { id: '4', name: 'Oscar Møller', education_line: 'Detail', swipes: 87, matches: 0, days_inactive: 1, last_active: '2026-06-10', primary_style: '🛡️ Stabiliserende', contacted: false, risk_reason: 'Meget høj aktivitet, 0 matches' },
  { id: '5', name: 'Lucas Poulsen', education_line: 'Event', swipes: 19, matches: 0, days_inactive: 6, last_active: '2026-06-05', primary_style: '🔬 Analytisk', contacted: false, risk_reason: 'Lav aktivitet, potentielt opgivet' },
  { id: '6', name: 'Freja Larsen', education_line: 'Lager & Logistik', swipes: 55, matches: 0, days_inactive: 1, last_active: '2026-06-10', primary_style: '⚡ Handlingsorienteret', contacted: false, risk_reason: 'Mange swipes, ingen matches' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export default function FollowUpPage() {
  const [students, setStudents] = useState(atRiskStudents);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const markContacted = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, contacted: true } : s));
  };

  const urgencyLevel = (s: AtRiskStudent) => {
    if (s.days_inactive >= 5 && s.swipes > 30) return 'critical';
    if (s.swipes >= 60 && s.matches === 0) return 'high';
    return 'medium';
  };

  const urgencyColors = {
    critical: { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400', label: 'Kritisk' },
    high: { bg: 'bg-orange-500/15', border: 'border-orange-500/30', text: 'text-orange-400', label: 'Høj' },
    medium: { bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', text: 'text-yellow-400', label: 'Medium' },
  };

  const notContacted = students.filter(s => !s.contacted).length;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">Opfølgning</h1>
        <p className="text-[var(--text-secondary)] mt-1">Elever der kan have brug for vejledning</p>
      </motion.div>

      {/* Alert Banner */}
      <motion.div variants={itemVariants} className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-300">{notContacted} elev{notContacted !== 1 ? 'er' : ''} kræver opmærksomhed</p>
          <p className="text-xs text-red-400/70 mt-0.5">Disse elever har mange swipes men ingen matches, eller er blevet inaktive</p>
        </div>
      </motion.div>

      {/* Student Cards */}
      <div className="space-y-3">
        {students.map(student => {
          const urgency = urgencyLevel(student);
          const colors = urgencyColors[urgency];
          const isExpanded = expandedId === student.id;

          return (
            <motion.div key={student.id} variants={itemVariants} className={`rounded-2xl bg-white/5 backdrop-blur-xl border transition-all overflow-hidden ${student.contacted ? 'border-green-500/20 opacity-60' : 'border-white/10'}`}>
              <button onClick={() => setExpandedId(isExpanded ? null : student.id)} className="w-full flex items-center gap-4 p-4 text-left">
                <div className={`w-10 h-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center shrink-0`}>
                  {student.contacted ? <CheckCircle2 size={18} className="text-green-400" /> : <AlertTriangle size={18} className={colors.text} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[var(--text-primary)] text-sm truncate">{student.name}</p>
                    {student.contacted && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400">Kontaktet</span>}
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
                      {/* Reason */}
                      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                        <TrendingDown size={14} className={colors.text} />
                        <span>{student.risk_reason}</span>
                      </div>
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-2.5 rounded-xl bg-white/5 text-center">
                          <p className="text-sm font-bold text-blue-400">{student.swipes}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">Swipes</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5 text-center">
                          <p className="text-sm font-bold text-red-400">{student.matches}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">Matches</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5 text-center">
                          <p className="text-sm font-bold text-orange-400">{student.days_inactive}d</p>
                          <p className="text-[10px] text-[var(--text-muted)]">Inaktiv</p>
                        </div>
                      </div>
                      {/* Actions */}
                      {!student.contacted && (
                        <div className="flex gap-2">
                          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors">
                            <Mail size={14} /> Send besked
                          </button>
                          <button onClick={() => markContacted(student.id)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors">
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
    </motion.div>
  );
}
