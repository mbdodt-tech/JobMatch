'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, MessageCircle, User, Settings } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

const tabs = [
  { href: '/student/feed', label: 'Hjem', icon: Home },
  { href: '/student/matches', label: 'Matches', icon: MessageCircle },
  { href: '/student/profile', label: 'Profil', icon: User },
  { href: '/student/settings', label: 'Indstillinger', icon: Settings },
];

export default function StudentShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hide bottom bar on onboarding and in chat (composer needs the bottom edge)
  const isOnboarding =
    pathname?.startsWith('/student/onboarding') || pathname?.startsWith('/student/chat');

  // "Varm" prototype pages run the light theme; the rest still run Aurora
  const varm =
    pathname?.startsWith('/student/feed') || pathname?.startsWith('/student/matches');

  return (
    <div
      className={`min-h-dvh font-[Inter] ${
        varm ? 'bg-[#FAF7F1] text-[#211F1A]' : 'bg-[#05050A] text-[#F8FAFC]'
      }`}
    >
      {/* Main content area */}
      <main className={isOnboarding ? '' : 'pb-32'}>
        {children}
      </main>

      {/* Floating dock */}
      {!isOnboarding && (
        <nav
          className="fixed left-4 right-4 z-50"
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div
            className={`max-w-md mx-auto rounded-full ${
              varm
                ? 'bg-white border border-[#EAE4D8] varm-dock-shadow'
                : 'glass-strong shadow-2xl shadow-black/50'
            }`}
          >
            <div className="flex items-center justify-around px-2 py-2">
              {tabs.map((tab) => {
                const isActive =
                  pathname === tab.href ||
                  (tab.href === '/student/feed' && pathname === '/student');

                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className="relative flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-full min-w-0"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className={`absolute inset-0 rounded-full ${
                          varm
                            ? 'bg-[#0C5B43]'
                            : 'bg-gradient-to-r from-violet-500 to-blue-500 glow-violet'
                        }`}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <tab.icon
                      size={20}
                      className={`relative z-10 transition-colors ${
                        isActive
                          ? 'text-white'
                          : varm
                            ? 'text-[#8B8471]'
                            : 'text-[#94A3B8] hover:text-[#94A3B8]'
                      }`}
                    />
                    <span
                      className={`relative z-10 text-[10px] font-medium truncate max-w-full transition-colors ${
                        isActive ? 'text-white' : varm ? 'text-[#8B8471]' : 'text-[#94A3B8]'
                      }`}
                    >
                      {tab.label}
                    </span>
                  </Link>
                );
              })}
              <NotificationBell />
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
