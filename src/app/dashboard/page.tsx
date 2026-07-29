"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Activity,
  Heart,
  TrendingUp,
  Store,
  Clock,
  ArrowUpRight,
  Loader2,
  AlertTriangle,
  BellOff,
  Scale,
  UserX,
  FileCheck2,
  CheckCircle2,
  RotateCcw,
  Video,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  EDUCATION_LINE_LABELS,
  getEducationLines,
} from "@/lib/types/database";
import type { EducationLine } from "@/lib/types/database";

interface StudentRow {
  id: string;
  full_name: string | null;
  education_line: EducationLine | null;
  education_lines: EducationLine[] | null;
  onboarding_completed: boolean;
  last_active_at: string | null;
  created_at: string;
  gdpr_consent: boolean;
  video_pitch_url: string | null;
  cv_url: string | null;
}

interface StoreRow {
  id: string;
  name: string;
  city: string;
  education_lines: EducationLine[];
  internship_slots: number;
  is_active: boolean;
  job_description_url: string | null;
}

interface SwipeRow {
  profile_id: string;
  store_id: string;
  swiper_role: string;
  direction: string;
  created_at: string;
}

interface MatchRow {
  id: string;
  student_id: string;
  store_id: string;
  matched_at: string;
  agreement_confirmed_at: string | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

function KpiCard({
  label,
  value,
  icon: Icon,
  accentColor,
  iconClass,
  glowClass,
  suffix,
  href,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accentColor: string;
  iconClass: string;
  glowClass?: string;
  suffix?: string;
  href?: string;
}) {
  const card = (
    <motion.div
      variants={itemVariants}
      className={`relative overflow-hidden rounded-2xl glass-card glass-card-hover p-5 group ${
        href ? "cursor-pointer" : ""
      } ${glowClass ?? ""}`}
    >
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 ${accentColor}`}
      />
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-1 truncate">
            {label}
          </p>
          <p className="text-3xl font-extrabold tracking-tight tabular-nums text-[var(--text-primary)]">
            {value.toLocaleString("da-DK")}
            {suffix && (
              <span className="text-xl font-bold text-[var(--text-muted)] ml-0.5">
                {suffix}
              </span>
            )}
          </p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {href && (
        <ArrowUpRight className="absolute bottom-4 right-4 w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity z-10" />
      )}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }
  return card;
}

function SectionCard({
  title,
  icon: Icon,
  iconClass,
  children,
  action,
}: {
  title: string;
  icon: React.ElementType;
  iconClass: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <motion.div variants={itemVariants} className="rounded-2xl glass-card p-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>
            <Icon className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)] truncate">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Lige nu";
  if (diffMins < 60) return `${diffMins} min. siden`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} time${diffHours > 1 ? "r" : ""} siden`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} dag${diffDays > 1 ? "e" : ""} siden`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / 86400000);
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [swipes, setSwipes] = useState<SwipeRow[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      const supabase = createClient();
      const [studentsRes, storesRes, swipesRes, matchesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, full_name, education_line, education_lines, onboarding_completed, last_active_at, created_at, gdpr_consent, video_pitch_url, cv_url"
          )
          .eq("role", "student"),
        supabase
          .from("stores")
          .select("id, name, city, education_lines, internship_slots, is_active, job_description_url"),
        supabase
          .from("swipes")
          .select("profile_id, store_id, swiper_role, direction, created_at"),
        supabase
          .from("matches")
          .select("id, student_id, store_id, matched_at, agreement_confirmed_at"),
      ]);

      setStudents((studentsRes.data as StudentRow[]) ?? []);
      setStores((storesRes.data as StoreRow[]) ?? []);
      setSwipes((swipesRes.data as SwipeRow[]) ?? []);
      setMatches((matchesRes.data as MatchRow[]) ?? []);
      setLoading(false);
    }
    fetchDashboardData();
  }, []);

  async function confirmAgreement(matchId: string, undo: boolean) {
    setConfirming(matchId);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const patch = undo
        ? { agreement_confirmed_at: null, agreement_confirmed_by: null }
        : { agreement_confirmed_at: new Date().toISOString(), agreement_confirmed_by: user.id };

      const { error } = await supabase.from("matches").update(patch).eq("id", matchId);
      if (error) {
        console.error("Kunne ikke opdatere aftale:", error);
        return;
      }
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? { ...m, agreement_confirmed_at: undo ? null : new Date().toISOString() }
            : m
        )
      );
    } finally {
      setConfirming(null);
    }
  }

  const view = useMemo(() => {
    const now = new Date();
    const studentById = new Map(students.map((s) => [s.id, s]));
    const storeById = new Map(stores.map((s) => [s.id, s]));
    const activeStores = stores.filter((s) => s.is_active);

    const studentRight = swipes.filter(
      (s) => s.swiper_role === "student" && s.direction === "right"
    );
    const managerSwipeKeys = new Set(
      swipes
        .filter((s) => s.swiper_role === "store_manager")
        .map((s) => `${s.profile_id}:${s.store_id}`)
    );

    const rightByStudent = new Map<string, SwipeRow[]>();
    for (const s of studentRight) {
      const list = rightByStudent.get(s.profile_id) ?? [];
      list.push(s);
      rightByStudent.set(s.profile_id, list);
    }
    const matchesByStudent = new Map<string, MatchRow[]>();
    for (const m of matches) {
      const list = matchesByStudent.get(m.student_id) ?? [];
      list.push(m);
      matchesByStudent.set(m.student_id, list);
    }

    // ── KPIs ──
    const onboarded = students.filter((s) => s.onboarding_completed);
    const activeThisWeek = students.filter(
      (s) => s.last_active_at && daysBetween(new Date(s.last_active_at), now) < 7
    );
    const agreements = matches.filter((m) => m.agreement_confirmed_at);
    const matchRate =
      studentRight.length > 0
        ? Math.round(((matches.length / studentRight.length) * 100) * 10) / 10
        : 0;

    // ── Funnel (student-centric) ──
    const withLikes = onboarded.filter((s) => rightByStudent.has(s.id));
    const withMatch = onboarded.filter((s) => matchesByStudent.has(s.id));
    const withAgreement = onboarded.filter((s) =>
      (matchesByStudent.get(s.id) ?? []).some((m) => m.agreement_confirmed_at)
    );
    const funnel = [
      { label: "Onboardet", count: onboarded.length, cls: "from-violet-600 to-violet-400" },
      { label: "Aktiv seneste 7 dage", count: onboarded.filter((s) => s.last_active_at && daysBetween(new Date(s.last_active_at), now) < 7).length, cls: "from-violet-500 to-blue-400" },
      { label: "Har liket butikker", count: withLikes.length, cls: "from-blue-500 to-cyan-400" },
      { label: "Har match", count: withMatch.length, cls: "from-cyan-500 to-emerald-400" },
      { label: "Aftale bekræftet", count: withAgreement.length, cls: "from-emerald-500 to-teal-400" },
    ];

    // ── Matches per week, last 8 ISO weeks ──
    const weekStart = (d: Date) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      const day = (x.getDay() + 6) % 7;
      x.setDate(x.getDate() - day);
      return x;
    };
    const thisWeek = weekStart(now);
    // 8 ISO weeks ending with the current one (i=7 → this week)
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const start = new Date(thisWeek);
      start.setDate(start.getDate() - (7 - i) * 7);
      return start;
    });
    const perWeek = weeks.map((start) => {
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const count = matches.filter((m) => {
        const t = new Date(m.matched_at);
        return t >= start && t < end;
      }).length;
      return {
        label: start.toLocaleDateString("da-DK", { day: "numeric", month: "numeric" }),
        count,
      };
    });

    // Median days from onboarding (profile creation) to first match
    const toMatchDays = withMatch
      .map((s) => {
        const first = (matchesByStudent.get(s.id) ?? [])
          .map((m) => new Date(m.matched_at).getTime())
          .sort((a, b) => a - b)[0];
        return daysBetween(new Date(s.created_at), new Date(first));
      })
      .sort((a, b) => a - b);
    const medianDays =
      toMatchDays.length === 0
        ? null
        : toMatchDays[Math.floor((toMatchDays.length - 1) / 2)];

    // ── Action: follow-up queue ──
    const followUp = onboarded
      .filter((s) => !matchesByStudent.has(s.id))
      .map((s) => {
        const rights = rightByStudent.get(s.id)?.length ?? 0;
        const inactiveDays = s.last_active_at
          ? daysBetween(new Date(s.last_active_at), now)
          : 999;
        return { s, rights, inactiveDays, score: rights + inactiveDays * 5 };
      })
      .filter((r) => r.rights >= 5 || r.inactiveDays >= 5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    // ── Action: stores not responding to likes ──
    const pendingByStore = new Map<string, { count: number; oldest: Date }>();
    for (const s of studentRight) {
      if (managerSwipeKeys.has(`${s.profile_id}:${s.store_id}`)) continue;
      const at = new Date(s.created_at);
      const cur = pendingByStore.get(s.store_id);
      if (!cur) pendingByStore.set(s.store_id, { count: 1, oldest: at });
      else {
        cur.count += 1;
        if (at < cur.oldest) cur.oldest = at;
      }
    }
    const unanswered = [...pendingByStore.entries()]
      .map(([storeId, v]) => ({
        store: storeById.get(storeId),
        count: v.count,
        waitDays: daysBetween(v.oldest, now),
      }))
      .filter((r) => r.store && r.waitDays >= 3)
      .sort((a, b) => b.waitDays - a.waitDays)
      .slice(0, 5);

    // ── Action: seekers vs. slots per education line ──
    const lines = Object.keys(EDUCATION_LINE_LABELS) as EducationLine[];
    const gapSorted = lines
      .map((line) => {
        const seekers = onboarded.filter((s) => getEducationLines(s).includes(line)).length;
        const slots = activeStores
          .filter((st) => st.education_lines?.includes(line))
          .reduce((sum, st) => sum + (st.internship_slots || 0), 0);
        return { line, label: EDUCATION_LINE_LABELS[line], seekers, slots };
      })
      .filter((r) => r.seekers > 0 || r.slots > 0)
      .sort((a, b) => (b.seekers - b.slots) - (a.seekers - a.slots));

    // ── Action: onboarded but never swiped ──
    const neverStarted = onboarded.filter(
      (s) => !swipes.some((sw) => sw.swiper_role === "student" && sw.profile_id === s.id)
    );

    // ── Agreements list ──
    const matchList = [...matches]
      .sort((a, b) => new Date(b.matched_at).getTime() - new Date(a.matched_at).getTime())
      .map((m) => ({
        ...m,
        studentName: studentById.get(m.student_id)?.full_name ?? "Ukendt",
        storeName: storeById.get(m.store_id)?.name ?? "Ukendt",
      }));

    // ── Popular stores ──
    const likesByStore = new Map<string, number>();
    for (const s of studentRight) {
      likesByStore.set(s.store_id, (likesByStore.get(s.store_id) ?? 0) + 1);
    }
    const popular = activeStores
      .map((st) => ({
        ...st,
        likes: likesByStore.get(st.id) ?? 0,
        matches: matches.filter((m) => m.store_id === st.id).length,
      }))
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 5);

    // ── Data quality ──
    const missingVideo = onboarded.filter((s) => !s.video_pitch_url).length;
    const missingCv = onboarded.filter((s) => !s.cv_url).length;
    const storesMissingJob = activeStores.filter((s) => !s.job_description_url).length;
    const missingGdpr = students.filter((s) => !s.gdpr_consent).length;

    return {
      kpi: {
        totalStudents: students.length,
        activeThisWeek: activeThisWeek.length,
        totalMatches: matches.length,
        agreements: agreements.length,
        matchRate,
      },
      funnel,
      perWeek,
      medianDays,
      followUp,
      unanswered,
      gap: gapSorted,
      neverStarted,
      matchList,
      popular,
      quality: { missingVideo, missingCv, storesMissingJob, missingGdpr },
    };
  }, [students, stores, swipes, matches]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  const maxWeek = Math.max(...view.perWeek.map((w) => w.count), 1);
  const funnelMax = Math.max(view.funnel[0].count, 1);
  const unconfirmed = view.matchList.filter((m) => !m.agreement_confirmed_at);
  const confirmed = view.matchList.filter((m) => m.agreement_confirmed_at);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          <span className="gradient-text">Overblik</span>
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Fra swipe til praktikaftale — følg fremdriften og grib ind, hvor det kræves
        </p>
      </motion.div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard
          label="Elever i alt"
          value={view.kpi.totalStudents}
          icon={Users}
          accentColor="bg-blue-500"
          iconClass="bg-blue-500/15 text-blue-400"
          href="/dashboard/students"
        />
        <KpiCard
          label="Aktive denne uge"
          value={view.kpi.activeThisWeek}
          icon={Activity}
          accentColor="bg-emerald-500"
          iconClass="bg-emerald-500/15 text-emerald-400"
          href="/dashboard/students"
        />
        <KpiCard
          label="Matches"
          value={view.kpi.totalMatches}
          icon={Heart}
          accentColor="bg-violet-500"
          iconClass="bg-violet-500/15 text-violet-400"
          href="/dashboard/students?status=matched"
        />
        <KpiCard
          label="Aftaler bekræftet"
          value={view.kpi.agreements}
          icon={FileCheck2}
          accentColor="bg-teal-500"
          iconClass="bg-teal-500/15 text-teal-400"
          glowClass="glow-green"
        />
        <KpiCard
          label="Match-rate"
          value={view.kpi.matchRate}
          icon={TrendingUp}
          accentColor="bg-cyan-500"
          iconClass="bg-cyan-500/15 text-cyan-400"
          suffix="%"
        />
      </div>

      {/* Action grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard
          title="Kræver opfølgning"
          icon={AlertTriangle}
          iconClass="bg-rose-500/15 text-rose-400"
          action={
            <Link
              href="/dashboard/follow-up"
              className="text-xs font-medium text-violet-400 hover:text-violet-300 flex items-center gap-1 shrink-0"
            >
              Se alle <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {view.followUp.length === 0 ? (
            <p className="text-sm text-emerald-400/90 py-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Ingen elever kræver opfølgning lige nu
            </p>
          ) : (
            <div className="space-y-2">
              {view.followUp.map(({ s, rights, inactiveDays }) => (
                <Link
                  key={s.id}
                  href="/dashboard/follow-up"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-xs font-bold text-rose-300 shrink-0">
                    {(s.full_name ?? "?")
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {s.full_name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {rights} likes uden match
                      {inactiveDays < 999 && ` · inaktiv ${inactiveDays} d.`}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/25 shrink-0">
                    {inactiveDays >= 7 ? "Inaktiv" : "0 matches"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Butikker der ikke svarer"
          icon={BellOff}
          iconClass="bg-amber-500/15 text-amber-400"
        >
          {view.unanswered.length === 0 ? (
            <p className="text-sm text-emerald-400/90 py-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Alle likes er besvaret inden for 3 dage
            </p>
          ) : (
            <div className="space-y-2">
              {view.unanswered.map((r) => (
                <Link
                  key={r.store!.id}
                  href={`/dashboard/stores?search=${encodeURIComponent(r.store!.name)}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
                    <Store className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {r.store!.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {r.count} ventende {r.count === 1 ? "elev" : "elever"}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-amber-400 tabular-nums shrink-0">
                    {r.waitDays} d.
                  </span>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Elever vs. pladser pr. retning"
          icon={Scale}
          iconClass="bg-blue-500/15 text-blue-400"
        >
          <div className="space-y-3">
            {view.gap.map((g) => {
              const shortage = g.seekers > g.slots;
              const max = Math.max(g.seekers, g.slots, 1);
              return (
                <div key={g.line} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-[var(--text-primary)] truncate">
                      {g.label}
                    </span>
                    <span
                      className={`shrink-0 tabular-nums font-semibold ${
                        shortage ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {g.seekers} elever · {g.slots} pladser
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-400"
                        style={{ width: `${(g.seekers / max) * 100}%` }}
                      />
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${
                          shortage
                            ? "from-amber-600 to-amber-400"
                            : "from-emerald-600 to-teal-400"
                        }`}
                        style={{ width: `${(g.slots / max) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {view.gap.length === 0 && (
              <p className="text-sm text-[var(--text-muted)] py-4 text-center">
                Ingen data endnu
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Aldrig kommet i gang"
          icon={UserX}
          iconClass="bg-slate-500/15 text-slate-300"
        >
          {view.neverStarted.length === 0 ? (
            <p className="text-sm text-emerald-400/90 py-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Alle onboardede elever er i gang med at swipe
            </p>
          ) : (
            <div className="space-y-2">
              {view.neverStarted.slice(0, 5).map((s) => (
                <Link
                  key={s.id}
                  href={`/dashboard/students?search=${encodeURIComponent(s.full_name ?? "")}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] shrink-0">
                    {(s.full_name ?? "?")
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {s.full_name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Onboardet {timeAgo(s.created_at)} — 0 swipes
                    </p>
                  </div>
                </Link>
              ))}
              {view.neverStarted.length > 5 && (
                <p className="text-xs text-[var(--text-muted)] pt-1">
                  + {view.neverStarted.length - 5} flere
                </p>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Funnel + weekly matches */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div variants={itemVariants} className="rounded-2xl glass-card p-6 lg:col-span-3">
          <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)] mb-1">
            Vejen til praktikaftale
          </h2>
          <p className="text-xs text-[var(--text-muted)] mb-5">
            Hvor mange elever når hvert trin
          </p>
          <div className="space-y-3">
            {view.funnel.map((f, i) => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-xs font-medium text-[var(--text-secondary)] truncate">
                  {f.label}
                </span>
                <div className="flex-1 h-6 rounded-lg bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(f.count / funnelMax) * 100}%` }}
                    transition={{ duration: 0.7, delay: i * 0.08, ease: "easeOut" }}
                    className={`h-full rounded-lg bg-gradient-to-r ${f.cls} min-w-[2px]`}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-sm font-bold tabular-nums text-[var(--text-primary)]">
                  {f.count}
                  <span className="text-[10px] font-medium text-[var(--text-muted)] ml-1">
                    {funnelMax > 0 ? Math.round((f.count / funnelMax) * 100) : 0}%
                  </span>
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-2xl glass-card p-6 lg:col-span-2">
          <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)] mb-1">
            Nye matches pr. uge
          </h2>
          <p className="text-xs text-[var(--text-muted)] mb-5">
            {view.medianDays !== null
              ? `Median: ${view.medianDays} dage fra onboarding til første match`
              : "Ingen matches endnu"}
          </p>
          <div className="flex items-end gap-2 h-32">
            {view.perWeek.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <span className="text-[10px] font-semibold tabular-nums text-[var(--text-secondary)]">
                  {w.count > 0 ? w.count : ""}
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((w.count / maxWeek) * 88, w.count > 0 ? 8 : 2)}px` }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                  className={`w-full rounded-t-md ${
                    w.count > 0
                      ? "bg-gradient-to-t from-violet-600 to-blue-400"
                      : "bg-white/5"
                  }`}
                />
                <span className="text-[9px] text-[var(--text-muted)] truncate max-w-full">
                  {w.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Agreements */}
      <SectionCard
        title="Praktikaftaler"
        icon={FileCheck2}
        iconClass="bg-teal-500/15 text-teal-400"
      >
        {view.matchList.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-4 text-center">
            Ingen matches endnu
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-2">
            {[...unconfirmed, ...confirmed].map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                    m.agreement_confirmed_at
                      ? "bg-emerald-500/15 border-emerald-500/30"
                      : "bg-violet-500/15 border-violet-500/25"
                  }`}
                >
                  {m.agreement_confirmed_at ? (
                    <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Heart className="w-4 h-4 text-violet-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {m.studentName}{" "}
                    <span className="text-[var(--text-muted)] font-normal">↔</span>{" "}
                    {m.storeName}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Matchet {timeAgo(m.matched_at)}
                    {m.agreement_confirmed_at && (
                      <span className="text-emerald-400 ml-1">
                        · aftale {timeAgo(m.agreement_confirmed_at)}
                      </span>
                    )}
                  </p>
                </div>
                {m.agreement_confirmed_at ? (
                  <button
                    onClick={() => confirmAgreement(m.id, true)}
                    disabled={confirming === m.id}
                    aria-label="Fortryd bekræftelse"
                    title="Fortryd bekræftelse"
                    className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-[var(--text-muted)] hover:text-amber-400 transition-colors shrink-0 disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    onClick={() => confirmAgreement(m.id, false)}
                    disabled={confirming === m.id}
                    className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors shrink-0 disabled:opacity-50"
                  >
                    {confirming === m.id ? "Gemmer…" : "Bekræft aftale"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Popular stores + data quality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard
          title="Mest populære butikker"
          icon={Store}
          iconClass="bg-violet-500/15 text-violet-400"
        >
          <div className="space-y-2">
            {view.popular.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-4 text-center">
                Ingen butikker endnu
              </p>
            ) : (
              view.popular.map((store, i) => (
                <Link
                  key={store.id}
                  href={`/dashboard/stores?search=${encodeURIComponent(store.name)}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                      i === 0
                        ? "bg-amber-500/20 text-amber-400"
                        : i === 1
                          ? "bg-gray-400/20 text-gray-300"
                          : i === 2
                            ? "bg-amber-700/20 text-amber-600"
                            : "bg-white/5 text-[var(--text-muted)]"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {store.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{store.city}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-blue-400 tabular-nums">
                      {store.likes}{" "}
                      <span className="text-xs text-[var(--text-muted)] font-normal">likes</span>
                    </p>
                    <p className="text-xs text-emerald-400 tabular-nums">
                      {store.matches} matches
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Datakvalitet"
          icon={FileText}
          iconClass="bg-slate-500/15 text-slate-300"
        >
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Video, label: "Elever uden video", value: view.quality.missingVideo },
              { icon: FileText, label: "Elever uden CV", value: view.quality.missingCv },
              { icon: Store, label: "Butikker uden jobopslag", value: view.quality.storesMissingJob },
              { icon: Users, label: "Uden GDPR-samtykke", value: view.quality.missingGdpr },
            ].map((q) => (
              <div
                key={q.label}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5"
              >
                <q.icon
                  className={`w-4 h-4 shrink-0 ${
                    q.value > 0 ? "text-amber-400" : "text-emerald-400"
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-lg font-bold tabular-nums text-[var(--text-primary)] leading-none">
                    {q.value}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                    {q.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </motion.div>
  );
}
