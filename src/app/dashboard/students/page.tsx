"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowUpDown,
  UserX,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EDUCATION_LINE_LABELS } from "@/lib/types/database";
import type { EducationLine } from "@/lib/types/database";

interface Student {
  id: string;
  name: string;
  education_line: string;
  swipes: number;
  matches: number;
  last_active: string;
  gdpr_consent: boolean;
}

type SortField = "swipes" | "matches" | "last_active" | "name";
type SortDirection = "asc" | "desc";
type StatusFilter = "all" | "at_risk" | "matched" | "inactive";

function getStatus(student: Student): "at_risk" | "matched" | "inactive" {
  if (student.matches > 0) return "matched";
  if (student.swipes >= 5) return "at_risk";
  return "inactive";
}

function getStatusBadge(status: "at_risk" | "matched" | "inactive") {
  switch (status) {
    case "at_risk":
      return {
        label: "Kræver opmærksomhed",
        className: "bg-red-500/15 text-red-400 border border-red-500/20",
        icon: AlertCircle,
      };
    case "matched":
      return {
        label: "Matchet",
        className: "bg-green-500/15 text-green-400 border border-green-500/20",
        icon: CheckCircle2,
      };
    case "inactive":
      return {
        label: "Inaktiv",
        className: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20",
        icon: UserX,
      };
  }
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "Aldrig";
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const VALID_STATUSES: StatusFilter[] = ["all", "at_risk", "matched", "inactive"];

function StudentsContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const initialStatus: StatusFilter = VALID_STATUSES.includes(
    statusParam as StatusFilter
  )
    ? (statusParam as StatusFilter)
    : "all";
  const initialEducation = searchParams.get("education") || "Alle";
  const initialSearch = searchParams.get("search") || "";

  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [educationFilter, setEducationFilter] = useState(initialEducation);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus);
  const [sortField, setSortField] = useState<SortField>("swipes");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showFilterPanel, setShowFilterPanel] = useState(initialStatus !== "all");

  useEffect(() => {
    async function fetchStudents() {
      const supabase = createClient();

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, education_line, gdpr_consent, last_active_at")
        .eq("role", "student");

      if (!profiles) {
        setLoading(false);
        return;
      }

      const enriched: Student[] = [];
      for (const p of profiles) {
        const { count: swipeCount } = await supabase
          .from("swipes")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", p.id);

        const { count: matchCount } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .eq("student_id", p.id);

        const eduLabel = p.education_line
          ? EDUCATION_LINE_LABELS[p.education_line as EducationLine] || p.education_line
          : "Ikke angivet";

        enriched.push({
          id: p.id,
          name: p.full_name || "Ukendt",
          education_line: eduLabel,
          swipes: swipeCount ?? 0,
          matches: matchCount ?? 0,
          last_active: p.last_active_at || "",
          gdpr_consent: p.gdpr_consent ?? false,
        });
      }

      setStudentsData(enriched);
      setLoading(false);
    }

    fetchStudents();
  }, []);

  const educationOptions = useMemo(() => {
    const lines = new Set(studentsData.map((s) => s.education_line));
    return ["Alle", ...Array.from(lines).sort()];
  }, [studentsData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const filteredStudents = useMemo(() => {
    let result = [...studentsData];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.education_line.toLowerCase().includes(q)
      );
    }

    if (educationFilter !== "Alle") {
      result = result.filter((s) => s.education_line === educationFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((s) => getStatus(s) === statusFilter);
    }

    result.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "swipes":
          aVal = a.swipes;
          bVal = b.swipes;
          break;
        case "matches":
          aVal = a.matches;
          bVal = b.matches;
          break;
        case "last_active":
          aVal = a.last_active ? new Date(a.last_active).getTime() : 0;
          bVal = b.last_active ? new Date(b.last_active).getTime() : 0;
          break;
        default:
          aVal = a.swipes;
          bVal = b.swipes;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return result;
  }, [searchQuery, educationFilter, statusFilter, sortField, sortDirection, studentsData]);

  const atRiskCount = studentsData.filter((s) => getStatus(s) === "at_risk").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Elever
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Oversigt over alle elever og deres aktivitet
        </p>
      </div>

      {atRiskCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">
            <span className="font-semibold">{atRiskCount} elev{atRiskCount > 1 ? "er" : ""}</span>{" "}
            har mange swipes men ingen matches — de kan have brug for vejledning.
          </p>
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Søg efter elev eller uddannelse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 !rounded-xl"
          />
        </div>

        <div className="relative">
          <select
            value={educationFilter}
            onChange={(e) => setEducationFilter(e.target.value)}
            className="appearance-none pr-10 !rounded-xl min-w-[180px] cursor-pointer"
          >
            {educationOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "Alle" ? "Alle uddannelser" : opt}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
        </div>

        <button
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
            statusFilter !== "all"
              ? "bg-purple-500/20 border-purple-500/30 text-purple-300"
              : "bg-white/5 border-white/10 text-[var(--text-secondary)] hover:bg-white/10"
          }`}
        >
          <Filter className="w-4 h-4" />
          Status
        </button>
      </div>

      <AnimatePresence>
        {showFilterPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 overflow-hidden"
          >
            {(
              [
                { key: "all", label: "Alle" },
                { key: "at_risk", label: "Kræver opmærksomhed" },
                { key: "matched", label: "Matchet" },
                { key: "inactive", label: "Inaktiv" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setStatusFilter(opt.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  statusFilter === opt.key
                    ? "bg-purple-500/30 text-purple-200 border border-purple-500/30"
                    : "bg-white/5 text-[var(--text-secondary)] border border-white/10 hover:bg-white/10"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1.5fr] gap-4 px-6 py-4 border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          <button
            onClick={() => handleSort("name")}
            className="flex items-center gap-1.5 hover:text-[var(--text-secondary)] transition-colors text-left"
          >
            Navn
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <span>Uddannelse</span>
          <button
            onClick={() => handleSort("swipes")}
            className="flex items-center gap-1.5 hover:text-[var(--text-secondary)] transition-colors"
          >
            Swipes
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleSort("matches")}
            className="flex items-center gap-1.5 hover:text-[var(--text-secondary)] transition-colors"
          >
            Matches
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleSort("last_active")}
            className="flex items-center gap-1.5 hover:text-[var(--text-secondary)] transition-colors"
          >
            Sidst aktiv
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <span>Status</span>
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {filteredStudents.length === 0 ? (
            <div className="py-16 text-center">
              <UserX className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-[var(--text-secondary)]">
                Ingen elever matcher dine filtre
              </p>
            </div>
          ) : (
            filteredStudents.map((student, i) => {
              const status = getStatus(student);
              const badge = getStatusBadge(status);
              const BadgeIcon = badge.icon;
              const isAnonymized = !student.gdpr_consent;

              return (
                <motion.div
                  key={student.id}
                  variants={rowVariants}
                  className={`grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1.5fr] gap-2 md:gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.03] transition-colors ${
                    i % 2 === 0 ? "bg-white/[0.01]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        status === "at_risk"
                          ? "bg-red-500/20 text-red-400"
                          : status === "matched"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-white/10 text-[var(--text-muted)]"
                      }`}
                    >
                      {isAnonymized ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isAnonymized
                            ? "text-[var(--text-muted)] blur-sm select-none"
                            : "text-[var(--text-primary)]"
                        }`}
                      >
                        {isAnonymized ? "Skjult navn" : student.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] md:hidden">
                        {student.education_line}
                      </p>
                    </div>
                    {isAnonymized && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 flex-shrink-0">
                        Ingen samtykke
                      </span>
                    )}
                  </div>

                  <div className="hidden md:flex items-center">
                    <span className="text-sm text-[var(--text-secondary)]">
                      {student.education_line}
                    </span>
                  </div>

                  <div className="hidden md:flex items-center">
                    <span
                      className={`text-sm font-semibold ${
                        student.swipes >= 50
                          ? "text-blue-400"
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      {student.swipes}
                    </span>
                  </div>

                  <div className="hidden md:flex items-center">
                    <span
                      className={`text-sm font-semibold ${
                        student.matches > 0
                          ? "text-green-400"
                          : "text-[var(--text-muted)]"
                      }`}
                    >
                      {student.matches}
                    </span>
                  </div>

                  <div className="hidden md:flex items-center">
                    <span className="text-sm text-[var(--text-secondary)]">
                      {timeAgo(student.last_active)}
                    </span>
                  </div>

                  <div className="flex items-center mt-2 md:mt-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}
                    >
                      <BadgeIcon className="w-3.5 h-3.5" />
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 md:hidden text-xs text-[var(--text-secondary)]">
                    <span>{student.swipes} swipes</span>
                    <span>{student.matches} matches</span>
                    <span>{timeAgo(student.last_active)}</span>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
        <span>
          Viser{" "}
          <span className="font-semibold text-[var(--text-secondary)]">
            {filteredStudents.length}
          </span>{" "}
          af {studentsData.length} elever
        </span>
        <span className="hidden sm:inline">·</span>
        <span className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" />
          {studentsData.filter((s) => s.gdpr_consent).length} med samtykke
        </span>
      </div>
    </motion.div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      }
    >
      <StudentsContent />
    </Suspense>
  );
}
