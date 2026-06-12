"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EDUCATION_LINE_LABELS } from "@/lib/types/database";
import type { EducationLine } from "@/lib/types/database";

interface KpiData {
  totalStudents: number;
  activeThisWeek: number;
  totalMatches: number;
  matchRate: number;
}

interface EducationLineData {
  name: string;
  swipes: number;
  matches: number;
}

interface PopularStore {
  name: string;
  city: string;
  rightSwipes: number;
  matches: number;
}

interface RecentMatch {
  student: string;
  store: string;
  matchedAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
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
  glowClass,
  suffix,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accentColor: string;
  glowClass?: string;
  suffix?: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className={`relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 group hover:scale-[1.02] transition-transform duration-300 ${glowClass ?? ""}`}
    >
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 ${accentColor}`}
      />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">
            {label}
          </p>
          <p className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {value.toLocaleString("da-DK")}
            {suffix && (
              <span className="text-xl font-bold text-[var(--text-muted)] ml-0.5">
                {suffix}
              </span>
            )}
          </p>
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/10">
          <Icon className={`w-5 h-5 ${accentColor.replace("bg-", "text-")}`} />
        </div>
      </div>
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

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KpiData>({
    totalStudents: 0,
    activeThisWeek: 0,
    totalMatches: 0,
    matchRate: 0,
  });
  const [educationLines, setEducationLines] = useState<EducationLineData[]>([]);
  const [popularStores, setPopularStores] = useState<PopularStore[]>([]);
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      const supabase = createClient();

      const { count: totalStudents } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student");

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const { count: activeThisWeek } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student")
        .gte("last_active_at", oneWeekAgo.toISOString());

      const { count: totalMatches } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true });

      const { count: totalRightSwipes } = await supabase
        .from("swipes")
        .select("*", { count: "exact", head: true })
        .eq("direction", "right");

      const matchRate =
        (totalRightSwipes ?? 0) > 0
          ? ((totalMatches ?? 0) / (totalRightSwipes ?? 1)) * 100
          : 0;

      setKpiData({
        totalStudents: totalStudents ?? 0,
        activeThisWeek: activeThisWeek ?? 0,
        totalMatches: totalMatches ?? 0,
        matchRate: Math.round(matchRate * 10) / 10,
      });

      const { data: students } = await supabase
        .from("profiles")
        .select("id, education_line")
        .eq("role", "student")
        .not("education_line", "is", null);

      const eduMap: Record<string, { swipes: number; matches: number }> = {};

      if (students) {
        for (const s of students) {
          const line = s.education_line as EducationLine;
          if (!eduMap[line]) eduMap[line] = { swipes: 0, matches: 0 };

          const { count: swipeCount } = await supabase
            .from("swipes")
            .select("*", { count: "exact", head: true })
            .eq("profile_id", s.id);

          const { count: matchCount } = await supabase
            .from("matches")
            .select("*", { count: "exact", head: true })
            .eq("student_id", s.id);

          eduMap[line].swipes += swipeCount ?? 0;
          eduMap[line].matches += matchCount ?? 0;
        }
      }

      setEducationLines(
        Object.entries(eduMap)
          .map(([key, val]) => ({
            name: EDUCATION_LINE_LABELS[key as EducationLine] || key,
            swipes: val.swipes,
            matches: val.matches,
          }))
          .sort((a, b) => b.swipes - a.swipes)
      );

      const { data: stores } = await supabase
        .from("stores")
        .select("id, name, city")
        .eq("is_active", true);

      if (stores) {
        const storeStats: PopularStore[] = [];
        for (const store of stores) {
          const { count: rightSwipes } = await supabase
            .from("swipes")
            .select("*", { count: "exact", head: true })
            .eq("store_id", store.id)
            .eq("direction", "right");

          const { count: storeMatches } = await supabase
            .from("matches")
            .select("*", { count: "exact", head: true })
            .eq("store_id", store.id);

          storeStats.push({
            name: store.name,
            city: store.city,
            rightSwipes: rightSwipes ?? 0,
            matches: storeMatches ?? 0,
          });
        }
        setPopularStores(
          storeStats.sort((a, b) => b.rightSwipes - a.rightSwipes).slice(0, 5)
        );
      }

      const { data: matches } = await supabase
        .from("matches")
        .select("matched_at, student_id, store_id")
        .order("matched_at", { ascending: false })
        .limit(5);

      if (matches) {
        const enriched: RecentMatch[] = [];
        for (const m of matches) {
          const { data: studentProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", m.student_id)
            .single();

          const { data: storeData } = await supabase
            .from("stores")
            .select("name")
            .eq("id", m.store_id)
            .single();

          enriched.push({
            student: studentProfile?.full_name ?? "Ukendt",
            store: storeData?.name ?? "Ukendt",
            matchedAt: m.matched_at,
          });
        }
        setRecentMatches(enriched);
      }

      setLoading(false);
    }

    fetchDashboardData();
  }, []);

  const maxSwipes = educationLines.length > 0
    ? Math.max(...educationLines.map((e) => e.swipes), 1)
    : 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Overblik
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Realtidsoversigt over elever, swipes og matches
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Elever i alt"
          value={kpiData.totalStudents}
          icon={Users}
          accentColor="bg-blue-500"
        />
        <KpiCard
          label="Aktive denne uge"
          value={kpiData.activeThisWeek}
          icon={Activity}
          accentColor="bg-green-500"
          glowClass="glow-green"
        />
        <KpiCard
          label="Matches i alt"
          value={kpiData.totalMatches}
          icon={Heart}
          accentColor="bg-purple-500"
          glowClass="glow-purple"
        />
        <KpiCard
          label="Match-rate"
          value={kpiData.matchRate}
          icon={TrendingUp}
          accentColor="bg-cyan-500"
          suffix="%"
        />
      </div>

      {educationLines.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6"
        >
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6">
            Aktivitet per uddannelseslinje
          </h2>
          <div className="space-y-5">
            {educationLines.map((line, i) => (
              <div key={line.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[var(--text-primary)]">
                    {line.name}
                  </span>
                  <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      {line.swipes} swipes
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                      {line.matches} matches
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5 h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(line.swipes / maxSwipes) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(line.matches / maxSwipes) * 100}%`,
                    }}
                    transition={{ duration: 0.8, delay: i * 0.1 + 0.2, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          variants={itemVariants}
          className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Populære butikker
            </h2>
            <Store className="w-5 h-5 text-[var(--text-muted)]" />
          </div>
          <div className="space-y-3">
            {popularStores.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-8">
                Ingen butikker endnu
              </p>
            ) : (
              popularStores.map((store, i) => (
                <motion.div
                  key={store.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      i === 0
                        ? "bg-yellow-500/20 text-yellow-400"
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
                    <p className="text-xs text-[var(--text-muted)]">
                      {store.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-400">
                      {store.rightSwipes}{" "}
                      <span className="text-xs text-[var(--text-muted)] font-normal">
                        swipes
                      </span>
                    </p>
                    <p className="text-xs text-green-400">
                      {store.matches} matches
                    </p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Seneste matches
            </h2>
            <Heart className="w-5 h-5 text-purple-400" />
          </div>
          <div className="space-y-3">
            {recentMatches.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-8">
                Ingen matches endnu
              </p>
            ) : (
              recentMatches.map((match, i) => (
                <motion.div
                  key={`${match.student}-${match.store}-${i}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-purple-500/20 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {match.student}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">
                      ↔ {match.store}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <Clock className="w-3.5 h-3.5" />
                    {timeAgo(match.matchedAt)}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
