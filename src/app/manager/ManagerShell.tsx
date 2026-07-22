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

export default function ManagerShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-[100dvh] bg-[#05050A] flex flex-col">
      {/* Page content */}
      <main className="flex-1 pb-28">{children}</main>

      {/* Floating glass dock */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 safe-bottom">
        <div className="max-w-md mx-auto glass-strong rounded-full shadow-2xl flex items-center justify-around px-2 py-2">
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
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-blue-500 glow-violet"
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 25,
                    }}
                  />
                )}
                <tab.icon
                  className={`relative z-10 w-5 h-5 transition-colors ${
                    isActive ? 'text-white' : 'text-[#64748B]'
                  }`}
                />
                <span
                  className={`relative z-10 text-[10px] font-semibold transition-colors ${
                    isActive ? 'text-white' : 'text-[#64748B]'
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
