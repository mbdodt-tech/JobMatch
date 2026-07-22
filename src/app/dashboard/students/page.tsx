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
  X,
  Play,
  Phone,
  Mail,
  MapPin,
  FileText,
  ExternalLink,
  GraduationCap,
  Briefcase,
  Calendar,
  MessageSquarePlus,
  Send,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  EDUCATION_LINE_LABELS,
  YOUTH_EDUCATION_LABELS,
  BEHAVIORAL_STYLE_LABELS,
  BEHAVIORAL_STYLE_COLORS,
  BEHAVIORAL_STYLE_ICONS,
} from "@/lib/types/database";
import type {
  EducationLine,
  YouthEducationType,
  BehavioralStyle,
  Profile,
} from "@/lib/types/database";

interface Student {
  id: string;
  name: string;
  education_line: string;
  swipes: number;
  matches: number;
  last_active: string;
  gdpr_consent: boolean;
}

interface AdminNote {
  id: string;
  content: string;
  created_at: string;
  author: string;
  author_id: string;
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
        className: "bg-rose-500/15 text-rose-400 border border-rose-500/20",
        icon: AlertCircle,
      };
    case "matched":
      return {
        label: "Matchet",
        className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
        icon: CheckCircle2,
      };
    case "inactive":
      return {
        label: "Inaktiv",
        className: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
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

function StyleBadge({ style }: { style: BehavioralStyle }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
      style={{
        backgroundColor: `${BEHAVIORAL_STYLE_COLORS[style]}15`,
        borderColor: `${BEHAVIORAL_STYLE_COLORS[style]}30`,
        color: BEHAVIORAL_STYLE_COLORS[style],
      }}
    >
      {BEHAVIORAL_STYLE_ICONS[style]} {BEHAVIORAL_STYLE_LABELS[style]}
    </span>
  );
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

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

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

  async function openStudentDetail(studentId: string) {
    setSelectedStudentId(studentId);
    setProfileLoading(true);
    setNotes([]);
    setNewNote("");

    const supabase = createClient();

    const [profileRes, notesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", studentId).single(),
      supabase
        .from("admin_notes")
        .select("id, content, created_at, author_id")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false }),
    ]);

    if (profileRes.data) {
      setSelectedProfile(profileRes.data as unknown as Profile);
    }

    if (notesRes.data) {
      const enrichedNotes: AdminNote[] = [];
      for (const n of notesRes.data) {
        const { data: author } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", n.author_id)
          .single();
        enrichedNotes.push({
          id: n.id,
          content: n.content,
          created_at: n.created_at,
          author: author?.full_name || "Ukendt",
          author_id: n.author_id,
        });
      }
      setNotes(enrichedNotes);
    }

    setProfileLoading(false);
  }

  async function saveNote() {
    if (!newNote.trim() || !selectedStudentId) return;
    setSavingNote(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSavingNote(false);
      return;
    }

    const { data } = await supabase
      .from("admin_notes")
      .insert({
        student_id: selectedStudentId,
        author_id: user.id,
        content: newNote.trim(),
      })
      .select("id, content, created_at, author_id")
      .single();

    if (data) {
      const { data: author } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", data.author_id)
        .single();

      setNotes((prev) => [
        {
          id: data.id,
          content: data.content,
          created_at: data.created_at,
          author: author?.full_name || "Ukendt",
          author_id: data.author_id,
        },
        ...prev,
      ]);
      setNewNote("");
    }
    setSavingNote(false);
  }

  async function deleteNote(noteId: string) {
    const supabase = createClient();
    await supabase.from("admin_notes").delete().eq("id", noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  function closeDetail() {
    setSelectedStudentId(null);
    setSelectedProfile(null);
    setShowVideoPlayer(false);
  }

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
      <div className="flex items-center justify-center min-h-[60dvh]">
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
          <span className="gradient-text">Elever</span>
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Oversigt over alle elever og deres aktivitet
        </p>
      </div>

      {atRiskCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20"
        >
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <p className="text-sm text-rose-300">
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

      <div className="rounded-2xl glass-card overflow-hidden">
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
                  onClick={() => openStudentDetail(student.id)}
                  className={`grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1.5fr] gap-2 md:gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer ${
                    i % 2 === 0 ? "bg-white/[0.01]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        status === "at_risk"
                          ? "bg-rose-500/20 text-rose-400"
                          : status === "matched"
                            ? "bg-emerald-500/20 text-emerald-400"
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
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 flex-shrink-0">
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
                          ? "text-emerald-400"
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

      {/* ── Student detail sheet ── */}
      <AnimatePresence>
        {selectedStudentId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeDetail}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 max-h-[90dvh] bg-[#0E0E18] rounded-t-3xl border-t border-white/10 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 bg-[#0E0E18] flex justify-center py-3 rounded-t-3xl">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="px-6 pb-10">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={closeDetail}
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-muted hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {profileLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  </div>
                ) : selectedProfile ? (
                  <>
                    {/* Avatar + name */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                        {selectedProfile.avatar_url ? (
                          <img
                            src={selectedProfile.avatar_url}
                            alt={selectedProfile.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl font-bold text-white">
                            {selectedProfile.full_name?.charAt(0)?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-xl font-bold text-white truncate">
                          {selectedProfile.full_name}
                        </h2>
                        {selectedProfile.education_line && (
                          <p className="text-text-secondary text-sm">
                            {EDUCATION_LINE_LABELS[selectedProfile.education_line as EducationLine] ||
                              selectedProfile.education_line}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedProfile.primary_style && (
                            <StyleBadge style={selectedProfile.primary_style} />
                          )}
                          {selectedProfile.secondary_style && (
                            <StyleBadge style={selectedProfile.secondary_style} />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Education */}
                    {(selectedProfile.youth_education || selectedProfile.youth_education_school) && (
                      <div className="mb-5">
                        <h3 className="text-sm font-medium text-text-secondary mb-1.5">Uddannelse</h3>
                        <div className="flex items-start gap-3 text-white text-sm bg-white/5 rounded-xl p-4 border border-white/5">
                          <GraduationCap className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                          <div>
                            {selectedProfile.youth_education && (
                              <p>{YOUTH_EDUCATION_LABELS[selectedProfile.youth_education as YouthEducationType] || selectedProfile.youth_education}</p>
                            )}
                            {selectedProfile.youth_education_school && (
                              <p className="text-text-secondary mt-0.5">{selectedProfile.youth_education_school}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Address */}
                    {(selectedProfile.address || selectedProfile.city) && (
                      <div className="mb-5">
                        <h3 className="text-sm font-medium text-text-secondary mb-1.5">Adresse</h3>
                        <div className="flex items-start gap-3 text-white text-sm bg-white/5 rounded-xl p-4 border border-white/5">
                          <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                          <span>
                            {selectedProfile.address}
                            {(selectedProfile.postal_code || selectedProfile.city) && ", "}
                            {selectedProfile.postal_code && `${selectedProfile.postal_code} `}
                            {selectedProfile.city}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Date of birth */}
                    {selectedProfile.date_of_birth && (
                      <div className="mb-5">
                        <h3 className="text-sm font-medium text-text-secondary mb-1.5">Fødselsdato</h3>
                        <div className="flex items-center gap-3 text-white text-sm bg-white/5 rounded-xl p-4 border border-white/5">
                          <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
                          <span>
                            {new Date(selectedProfile.date_of_birth).toLocaleDateString("da-DK", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Work experience */}
                    {selectedProfile.work_experience && (
                      <div className="mb-5">
                        <h3 className="text-sm font-medium text-text-secondary mb-1.5">Erhvervserfaring</h3>
                        <div className="flex items-start gap-3 text-white text-sm bg-white/5 rounded-xl p-4 border border-white/5">
                          <Briefcase className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          <p>{selectedProfile.work_experience}</p>
                        </div>
                      </div>
                    )}

                    {/* Video */}
                    {selectedProfile.video_pitch_url && (
                      <div className="mb-5">
                        <h3 className="text-sm font-medium text-text-secondary mb-1.5">Video-pitch</h3>
                        <button
                          onClick={() => {
                            setVideoUrl(selectedProfile.video_pitch_url!);
                            setShowVideoPlayer(true);
                          }}
                          className="w-full relative rounded-xl overflow-hidden bg-white/5 border border-white/10 aspect-video flex items-center justify-center group"
                        >
                          {selectedProfile.video_thumbnail_url ? (
                            <img src={selectedProfile.video_thumbnail_url} alt="Video" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-900/30 to-blue-900/30" />
                          )}
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center border border-white/20">
                              <Play className="w-6 h-6 text-white ml-0.5" />
                            </div>
                          </div>
                        </button>
                      </div>
                    )}

                    {/* CV */}
                    {selectedProfile.cv_url && (
                      <div className="mb-5">
                        <h3 className="text-sm font-medium text-text-secondary mb-1.5">CV</h3>
                        <a
                          href={selectedProfile.cv_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors"
                        >
                          <FileText className="w-5 h-5" />
                          <span className="font-medium text-sm">Se elevens CV</span>
                          <ExternalLink className="w-4 h-4 ml-auto" />
                        </a>
                      </div>
                    )}

                    {/* Contact */}
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-text-secondary mb-2">Kontaktoplysninger</h3>
                      <div className="space-y-2">
                        {selectedProfile.phone && (
                          <a
                            href={`tel:${selectedProfile.phone}`}
                            className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          >
                            <Phone className="w-5 h-5" />
                            <span className="font-medium text-sm">Ring: {selectedProfile.phone}</span>
                          </a>
                        )}
                        {selectedProfile.email && (
                          <a
                            href={`mailto:${selectedProfile.email}`}
                            className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors"
                          >
                            <Mail className="w-5 h-5" />
                            <span className="font-medium text-sm">Email: {selectedProfile.email}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* ── Admin notes ── */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquarePlus className="w-4 h-4 text-purple-400" />
                        <h3 className="text-sm font-medium text-text-secondary">
                          Interne noter ({notes.length})
                        </h3>
                      </div>

                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveNote()}
                          placeholder="Skriv en note om eleven..."
                          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                        />
                        <button
                          onClick={saveNote}
                          disabled={!newNote.trim() || savingNote}
                          className="px-4 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {savingNote ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {notes.length > 0 ? (
                        <div className="space-y-2">
                          {notes.map((note) => (
                            <div
                              key={note.id}
                              className="p-3 rounded-xl bg-white/5 border border-white/5 group"
                            >
                              <p className="text-sm text-white">{note.content}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-[11px] text-text-muted">
                                  {note.author} — {new Date(note.created_at).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </span>
                                <button
                                  onClick={() => deleteNote(note.id)}
                                  className="text-text-muted hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-text-muted text-center py-4">
                          Ingen noter endnu
                        </p>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video player */}
      <AnimatePresence>
        {showVideoPlayer && videoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowVideoPlayer(false)}
          >
            <button
              onClick={() => setShowVideoPlayer(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-md aspect-[9/16] rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain bg-black"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60dvh]">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      }
    >
      <StudentsContent />
    </Suspense>
  );
}
