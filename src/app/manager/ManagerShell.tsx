'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, CheckCircle2, Store, Settings } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

const tabs = [
  { href: '/manager/feed', label: 'Elever', icon: Users },
  { href: '/manager/matches', label: 'Matches', icon: CheckCircle2 },
  { href: '/manager/store', label: 'Min butik', icon: Store },
  { href: '/manager/settings', label: 'Indstillinger', icon: Settings },
];

export default function ManagerShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Chat needs the bottom edge for its composer
  const isChat = pathname?.startsWith('/manager/chat');

  return (
    <div className="min-h-[100dvh] bg-[#FAF7F1] text-[#211F1A] flex flex-col">
      {/* Page content */}
      <main className={`flex-1 ${isChat ? '' : 'pb-28'}`}>{children}</main>

      {/* Floating dock */}
      {!isChat && (
      <nav className="fixed bottom-4 left-4 right-4 z-50 safe-bottom">
        <div className="max-w-md mx-auto bg-white border border-[#EAE4D8] varm-dock-shadow rounded-full flex items-center justify-around px-2 py-2">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.href === '/manager/feed' && pathname === '/manager');

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative flex flex-col items-center gap-0.5 px-3.5 py-1.5 rounded-full transition-colors min-w-[60px]"
              >
                {isActive && (
                  <motion.div
                    layoutId="manager-tab-indicator"
                    className="absolute inset-0 rounded-full bg-[#0E8578]"
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 25,
                    }}
                  />
                )}
                <tab.icon
                  className={`relative z-10 w-5 h-5 transition-colors ${
                    isActive ? 'text-white' : 'text-[#8B8471]'
                  }`}
                />
                <span
                  className={`relative z-10 text-[10px] font-semibold transition-colors ${
                    isActive ? 'text-white' : 'text-[#8B8471]'
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
          <NotificationBell />
        </div>
      </nav>
      )}
    </div>
  );
}
