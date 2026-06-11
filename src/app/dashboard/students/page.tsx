"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── Placeholder Data ───────────────────────────────────────────────────────

const studentsData: Student[] = [
  { id: "1", name: "Emil Andersen", education_line: "Detail", swipes: 45, matches: 3, last_active: "2026-06-11T09:30:00", gdpr_consent: true },
  { id: "2", name: "Sofia Nielsen", education_line: "Kontor", swipes: 62, matches: 0, last_active: "2026-06-10T14:20:00", gdpr_consent: true },
  { id: "3", name: "Oliver Petersen", education_line: "Event", swipes: 38, matches: 2, last_active: "2026-06-11T08:15:00", gdpr_consent: true },
  { id: "4", name: "Ida Christensen", education_line: "Detail", swipes: 91, matches: 0, last_active: "2026-06-09T16:45:00", gdpr_consent: true },
  { id: "5", name: "Noah Jensen", education_line: "Handel", swipes: 12, matches: 1, last_active: "2026-06-08T11:00:00", gdpr_consent: false },
  { id: "6", name: "Freja Larsen", education_line: "Lager & Logistik", swipes: 55, matches: 0, last_active: "2026-06-10T09:30:00", gdpr_consent: true },
  { id: "7", name: "William Rasmussen", education_line: "Detail", swipes: 28, matches: 4, last_active: "2026-06-11T10:00:00", gdpr_consent: true },
  { id: "8", name: "Emma Thomsen", education_line: "Kontor", swipes: 73, matches: 0, last_active: "2026-06-07T13:15:00", gdpr_consent: true },
  { id: "9", name: "Lucas Poulsen", education_line: "Event", swipes: 19, matches: 0, last_active: "2026-06-05T10:30:00", gdpr_consent: false },
  { id: "10", name: "Alma Sørensen", education_line: "Handel", swipes: 34, matches: 2, last_active: "2026-06-11T07:45:00", gdpr_consent: true },
  { id: "11", name: "Oscar Møller", education_line: "Detail", swipes: 87, matches: 0, last_active: "2026-06-10T15:00:00", gdpr_consent: true },
  { id: "12", name: "Clara Frederiksen", education_line: "Lager & Logistik", swipes: 41, matches: 1, last_active: "2026-06-09T12:00:00", gdpr_consent: true },
];

const educationOptions = [
  "Alle",
  "Detail",
  "Kontor",
  "Event",
  "Handel",
  "Lager & Logistik",
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function getStatus(student: Student): "at_risk" | "matched" | "inactive" {
  if (student.matches > 0) return "matched";
  if (student.swipes >= 30) return "at_risk";
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
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins} min. siden`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} time${diffHours > 1 ? "r" : ""} siden`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} dag${diffDays > 1 ? "e" : ""} siden`;
}

// ─── Animation Variants ────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

// ─── Page Component ─────────────────────────────────────────────────────────

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [educationFilter, setEducationFilter] = useState("Alle");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortField, setSortField] = useState<SortField>("swipes");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

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

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.education_line.toLowerCase().includes(q)
      );
    }

    // Education filter
    if (educationFilter !== "Alle") {
      result = result.filter((s) => s.education_line === educationFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((s) => getStatus(s) === statusFilter);
    }

    // Sort
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
          aVal = new Date(a.last_active).getTime();
          bVal = new Date(b.last_active).getTime();
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
  }, [searchQuery, educationFilter, statusFilter, sortField, sortDirection]);

  const atRiskCount = studentsData.filter((s) => getStatus(s) === "at_risk").length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Elever
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Oversigt over alle elever og deres aktivitet
        </p>
      </div>

      {/* Alert Banner */}
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

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
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

        {/* Education Filter */}
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

        {/* Status Filter Toggle */}
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

      {/* Status Filter Panel */}
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

      {/* Table */}
      <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
        {/* Table Header */}
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

        {/* Table Body */}
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
                  {/* Name */}
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

                  {/* Education */}
                  <div className="hidden md:flex items-center">
                    <span className="text-sm text-[var(--text-secondary)]">
                      {student.education_line}
                    </span>
                  </div>

                  {/* Swipes */}
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

                  {/* Matches */}
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

                  {/* Last Active */}
                  <div className="hidden md:flex items-center">
                    <span className="text-sm text-[var(--text-secondary)]">
                      {timeAgo(student.last_active)}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center mt-2 md:mt-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}
                    >
                      <BadgeIcon className="w-3.5 h-3.5" />
                      {badge.label}
                    </span>
                  </div>

                  {/* Mobile Stats */}
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

      {/* Summary Footer */}
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
