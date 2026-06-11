'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, CheckCircle2, Store, Settings } from 'lucide-react';

const tabs = [
  { href: '/manager/feed', label: 'Elever', icon: Users },
  { href: '/manager/matches', label: 'Matches', icon: CheckCircle2 },
  { href: '/manager/store', label: 'Min butik', icon: Store },
  { href: '/manager/settings', label: 'Indstillinger', icon: Settings },
];

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col">
      {/* Page content */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="backdrop-blur-xl bg-[#0A0A0F]/80 border-t border-white/10">
          <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
            {tabs.map((tab) => {
              const isActive =
                pathname === tab.href ||
                (tab.href === '/manager/feed' && pathname === '/manager');

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[60px]"
                >
                  {isActive && (
                    <motion.div
                      layoutId="manager-tab-indicator"
                      className="absolute inset-0 bg-white/5 rounded-xl"
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 25,
                      }}
                    />
                  )}
                  <tab.icon
                    className={`relative z-10 w-5 h-5 transition-colors ${
                      isActive ? 'text-purple-400' : 'text-text-muted'
                    }`}
                  />
                  <span
                    className={`relative z-10 text-[10px] font-medium transition-colors ${
                      isActive ? 'text-purple-400' : 'text-text-muted'
                    }`}
                  >
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
          {/* Safe area spacer for iOS */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </nav>
    </div>
  );
}
