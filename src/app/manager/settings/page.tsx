'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, Smartphone, LogOut, Info, Moon, Globe, ChevronRight, ToggleLeft, ToggleRight, Shield, MonitorSmartphone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ManagerSettings() {
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyInApp, setNotifyInApp] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const toggles = [
    { key: 'push', label: 'Push-notifikationer', desc: 'Besked når en elev swiper right', icon: Smartphone, value: notifyPush, set: setNotifyPush, color: 'text-violet-400' },
    { key: 'email', label: 'Email-notifikationer', desc: 'Daglig opsummering af nye matches', icon: Mail, value: notifyEmail, set: setNotifyEmail, color: 'text-blue-400' },
    { key: 'inapp', label: 'In-app notifikationer', desc: 'Vis badges og bannere', icon: Bell, value: notifyInApp, set: setNotifyInApp, color: 'text-green-400' },
  ];

  return (
    <div className="min-h-[100dvh] aurora-bg aurora-bg-subtle pb-8">
      <div className="px-4 pt-6 pb-4 max-w-md mx-auto">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#F8FAFC]"><span className="gradient-text">Indstillinger</span> ⚙️</h1>
      </div>
      <div className="max-w-md mx-auto px-4 space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2"><Bell size={14} /> Notifikationer</h2>
          </div>
          {toggles.map((t, i) => (
            <div key={t.key} className={`flex items-center justify-between px-4 py-4 ${i < toggles.length - 1 ? 'border-b border-white/5' : ''}`}>
              <div className="flex items-center gap-3 flex-1">
                <t.icon size={18} className={t.color} />
                <div><p className="text-sm font-medium text-[#F8FAFC]">{t.label}</p><p className="text-xs text-[#94A3B8]">{t.desc}</p></div>
              </div>
              <button onClick={() => t.set(!t.value)} className="ml-3 shrink-0">
                {t.value ? <ToggleRight size={32} className="text-emerald-400" /> : <ToggleLeft size={32} className="text-[#94A3B8]" />}
              </button>
            </div>
          ))}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5"><h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2"><MonitorSmartphone size={14} /> App</h2></div>
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/5"><div className="flex items-center gap-3"><Globe size={18} className="text-[#94A3B8]" /><span className="text-sm text-[#94A3B8]">Version</span></div><span className="text-xs text-[#94A3B8] font-mono">1.0.0</span></div>
          <div className="flex items-center justify-between px-4 py-4"><div className="flex items-center gap-3"><Moon size={18} className="text-[#94A3B8]" /><span className="text-sm text-[#94A3B8]">Tema</span></div><span className="text-xs text-[#94A3B8]">Mørkt</span></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="pt-4">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 text-[#F8FAFC] font-medium text-sm hover:bg-white/10 transition-colors"><LogOut size={16} /> Log ud</button>
        </motion.div>
      </div>
    </div>
  );
}
