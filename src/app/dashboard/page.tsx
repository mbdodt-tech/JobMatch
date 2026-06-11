"use client";

import { motion } from "framer-motion";
import {
  Users,
  Activity,
  Heart,
  TrendingUp,
  Store,
  Clock,
  ArrowUpRight,
} from "lucide-react";

// ─── Placeholder Data (swap with Supabase RPC calls) ───────────────────────

const kpiData = {
  totalStudents: 284,
  activeThisWeek: 167,
  totalMatches: 89,
  matchRate: 31.3,
};

const educationLines = [
  { name: "Detail", swipes: 420, matches: 38 },
  { name: "Kontor", swipes: 310, matches: 28 },
  { name: "Event", swipes: 275, matches: 19 },
  { name: "Handel", swipes: 198, matches: 15 },
  { name: "Lager & Logistik", swipes: 145, matches: 9 },
];

const popularStores = [
  { name: "Magasin du Nord", city: "København", rightSwipes: 78, matches: 12 },
  { name: "Matas Strøget", city: "København", rightSwipes: 65, matches: 9 },
  { name: "IKEA Gentofte", city: "Gentofte", rightSwipes: 52, matches: 7 },
  { name: "Normal Østerbro", city: "København", rightSwipes: 48, matches: 6 },
  { name: "Flying Tiger", city: "Frederiksberg", rightSwipes: 41, matches: 5 },
];

const recentMatches = [
  { student: "Emil Andersen", store: "Magasin du Nord", timeAgo: "12 min. siden" },
  { student: "Sofia Nielsen", store: "Matas Strøget", timeAgo: "34 min. siden" },
  { student: "Oliver Petersen", store: "IKEA Gentofte", timeAgo: "1 time siden" },
  { student: "Ida Christensen", store: "Normal Østerbro", timeAgo: "2 timer siden" },
  { student: "Noah Jensen", store: "Flying Tiger", timeAgo: "3 timer siden" },
];

// ─── Animation Variants ────────────────────────────────────────────────────

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

// ─── KPI Card Component ────────────────────────────────────────────────────

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
      {/* Background glow */}
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
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center bg-white/10`}
        >
          <Icon className={`w-5 h-5 ${accentColor.replace("bg-", "text-")}`} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const maxSwipes = Math.max(...educationLines.map((e) => e.swipes));

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Overblik
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Realtidsoversigt over elever, swipes og matches
        </p>
      </motion.div>

      {/* KPI Cards */}
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

      {/* Activity by Education Line */}
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

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Popular Stores */}
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
            {popularStores.map((store, i) => (
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
            ))}
          </div>
        </motion.div>

        {/* Recent Matches */}
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
            {recentMatches.map((match, i) => (
              <motion.div
                key={`${match.student}-${match.store}`}
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
                  {match.timeAgo}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
