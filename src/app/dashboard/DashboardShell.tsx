"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Users,
  Store,
  AlertTriangle,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", label: "Overblik", icon: BarChart3 },
  { href: "/dashboard/students", label: "Elever", icon: Users },
  { href: "/dashboard/stores", label: "Butikker", icon: Store },
  { href: "/dashboard/follow-up", label: "Opfølgning", icon: AlertTriangle },
  { href: "/dashboard/settings", label: "Indstillinger", icon: Settings },
];

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userInitials, setUserInitials] = useState("");
  const [atRiskCount, setAtRiskCount] = useState(0);

  useEffect(() => {
    async function loadUserData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profile?.full_name) {
        setUserName(profile.full_name);
        setUserInitials(
          profile.full_name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
        );
      }

      const { data: students } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "student")
        .eq("is_active", true);

      if (students) {
        const results = await Promise.all(
          students.map(async (s) => {
            const [{ count: swipeCount }, { count: matchCount }] = await Promise.all([
              supabase
                .from("swipes")
                .select("*", { count: "exact", head: true })
                .eq("profile_id", s.id)
                .eq("direction", "right"),
              supabase
                .from("matches")
                .select("*", { count: "exact", head: true })
                .eq("student_id", s.id),
            ]);
            return (swipeCount ?? 0) >= 5 && (matchCount ?? 0) === 0;
          })
        );
        setAtRiskCount(results.filter(Boolean).length);
      }
    }

    loadUserData();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 pb-8">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <Logo variant="icon" className="w-10 h-10 rounded-xl glow-violet" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
              Jobmatch
            </h1>
            <p className="text-xs text-[var(--text-muted)]">Skole Dashboard</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                active
                  ? "bg-gradient-to-r from-purple-500/20 to-blue-500/10 text-white"
                  : "text-[var(--text-secondary)] hover:text-white hover:bg-white/5"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-purple-400 to-blue-500 rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${
                  active
                    ? "text-purple-400"
                    : "text-[var(--text-muted)] group-hover:text-purple-400"
                }`}
              />
              <span>{item.label}</span>
              {item.label === "Opfølgning" && atRiskCount > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 text-xs flex items-center justify-center font-semibold">
                  {atRiskCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 mx-3 mb-4 rounded-xl glass-card">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white">
            {userInitials || "??"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {userName || "Indlæser..."}
            </p>
            <p className="text-xs text-[var(--text-muted)] truncate">
              Vejleder
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-rose-400 transition-colors"
            title="Log ud"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[var(--bg-primary)]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-[280px] lg:flex-col bg-white/[0.03] backdrop-blur-xl border-r border-white/10 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 h-16 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-white/10 flex items-center px-4 safe-top">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-xl hover:bg-white/10 text-[var(--text-secondary)] transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2">
            <Logo variant="icon" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-[var(--text-primary)]">
              Jobmatch
            </span>
          </div>
        </div>
        <div className="w-10" />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="lg:hidden fixed inset-y-0 left-0 w-[280px] bg-[var(--bg-secondary)] border-r border-white/10 z-50 flex flex-col"
            >
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/10 text-[var(--text-secondary)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:pl-[280px] pt-16 lg:pt-0 min-h-dvh aurora-bg aurora-bg-subtle">
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
