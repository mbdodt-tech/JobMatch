'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, MessageCircle, User, Settings } from 'lucide-react';

const tabs = [
  { href: '/student/feed', label: 'Hjem', icon: Home },
  { href: '/student/matches', label: 'Matches', icon: MessageCircle },
  { href: '/student/profile', label: 'Profil', icon: User },
  { href: '/student/settings', label: 'Indstillinger', icon: Settings },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hide bottom bar on onboarding
  const isOnboarding = pathname?.startsWith('/student/onboarding');

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F8FAFC] font-[Inter]">
      {/* Main content area */}
      <main className={isOnboarding ? '' : 'pb-24'}>
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      {!isOnboarding && (
        <nav className="fixed bottom-0 left-0 right-0 z-50">
          {/* Safe area spacer */}
          <div
            className="backdrop-blur-xl bg-white/5 border-t border-white/10"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="max-w-md mx-auto flex items-center justify-around h-16">
              {tabs.map((tab) => {
                const isActive =
                  pathname === tab.href ||
                  (tab.href === '/student/feed' && pathname === '/student');

                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className="relative flex flex-col items-center justify-center gap-0.5 px-4 py-2 transition-colors"
                  >
                    <tab.icon
                      size={22}
                      className={
                        isActive
                          ? 'text-purple-400'
                          : 'text-[#64748B] hover:text-[#94A3B8]'
                      }
                    />
                    <span
                      className={`text-[10px] font-medium ${
                        isActive ? 'text-purple-400' : 'text-[#64748B]'
                      }`}
                    >
                      {tab.label}
                    </span>

                    {/* Active indicator dot */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute -bottom-1 w-5 h-0.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
