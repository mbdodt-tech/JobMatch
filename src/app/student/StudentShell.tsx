'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, MessageCircle, Settings, Sparkles, User } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

const tabs = [
  { href: '/student/feed', label: 'Hjem', icon: Home },
  { href: '/student/inspiration', label: 'Inspiration', icon: Sparkles },
  { href: '/student/matches', label: 'Matches', icon: MessageCircle },
];

const profileTab = { href: '/student/profile', label: 'Profil', icon: User };

function DockTab({
  tab,
  isActive,
}: {
  tab: { href: string; label: string; icon: typeof Home };
  isActive: boolean;
}) {
  return (
    <Link
      href={tab.href}
      className="relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-full min-w-0"
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 rounded-full bg-[#211F1A]/[0.07]"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
      <tab.icon
        size={20}
        className={`relative z-10 transition-colors ${
          isActive ? 'text-[#211F1A]' : 'text-[#8B8471]'
        }`}
      />
      <span
        className={`relative z-10 text-[10px] font-medium truncate max-w-full transition-colors ${
          isActive ? 'text-[#211F1A] font-semibold' : 'text-[#8B8471]'
        }`}
      >
        {tab.label}
      </span>
    </Link>
  );
}

export default function StudentShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hide bottom bar on onboarding and in chat (composer needs the bottom edge)
  const isOnboarding =
    pathname?.startsWith('/student/onboarding') || pathname?.startsWith('/student/chat');

  const isTabActive = (href: string) =>
    pathname === href ||
    (href === '/student/feed' && pathname === '/student') ||
    (href !== '/student/feed' && !!pathname?.startsWith(href));

  return (
    <div className="min-h-dvh font-[Inter] bg-[#FAF7F1] text-[#211F1A]">
      {/* Main content area */}
      <main className={isOnboarding ? '' : 'pb-32'}>
        {children}
      </main>

      {/* Settings moved out of the dock (user decision aug. 2026) */}
      {!isOnboarding && (
        <Link
          href="/student/settings"
          aria-label="Indstillinger"
          className="fixed right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/60 backdrop-blur-xl border border-white/70 varm-card-shadow"
          style={{ top: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}
        >
          <Settings
            size={19}
            className={
              pathname?.startsWith('/student/settings')
                ? 'text-[#211F1A]'
                : 'text-[#8B8471]'
            }
          />
        </Link>
      )}

      {/* Floating glass dock */}
      {!isOnboarding && (
        <nav
          className="fixed left-4 right-4 z-50"
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="max-w-md mx-auto rounded-full bg-white/60 backdrop-blur-xl border border-white/70 varm-dock-shadow">
            <div className="flex items-center justify-around px-2 py-2">
              {tabs.map((tab) => (
                <DockTab key={tab.href} tab={tab} isActive={isTabActive(tab.href)} />
              ))}
              <NotificationBell />
              <DockTab tab={profileTab} isActive={isTabActive(profileTab.href)} />
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
