'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, BellOff, Shield, Moon, LogOut, Trash2, ChevronRight,
  Mail, Smartphone, MonitorSmartphone, Globe, Info, ToggleLeft, ToggleRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface SettingToggle {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  value: boolean;
  color: string;
}

export default function StudentSettings() {
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('notify_push, notify_email, notify_in_app').eq('id', user.id).single();
      if (data) {
        setNotifyPush(data.notify_push);
        setNotifyEmail(data.notify_email);
        setNotifyInApp(data.notify_in_app);
      }
    }
    load();
  }, []);

  const updateSetting = async (field: string, value: boolean) => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ [field]: value }).eq('id', user.id);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const toggles: SettingToggle[] = [
    { key: 'notify_push', label: 'Push-notifikationer', description: 'Modtag push-beskeder ved nyt match', icon: Smartphone, value: notifyPush, color: 'text-violet-400' },
    { key: 'notify_email', label: 'Email-notifikationer', description: 'Modtag en email når du matcher', icon: Mail, value: notifyEmail, color: 'text-blue-400' },
    { key: 'notify_in_app', label: 'In-app notifikationer', description: 'Vis bannere inde i appen', icon: Bell, value: notifyInApp, color: 'text-green-400' },
  ];

  const handleToggle = (t: SettingToggle) => {
    const newVal = !t.value;
    if (t.key === 'notify_push') setNotifyPush(newVal);
    if (t.key === 'notify_email') setNotifyEmail(newVal);
    if (t.key === 'notify_in_app') setNotifyInApp(newVal);
    updateSetting(t.key, newVal);
  };

  return (
    <div className="min-h-dvh aurora-bg aurora-bg-subtle pb-32">
      <div className="px-4 pt-6 pb-4 max-w-md mx-auto">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#F8FAFC]">
          <span className="gradient-text">Indstillinger</span> ⚙️
        </h1>
        <p className="text-sm text-[#64748B] mt-0.5">Tilpas din oplevelse</p>
      </div>

      <div className="max-w-md mx-auto px-4 space-y-4">
        {/* Notification Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <h2 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-2">
              <Bell size={14} /> Notifikationer
            </h2>
          </div>
          {toggles.map((t, i) => (
            <div key={t.key} className={`flex items-center justify-between px-4 py-4 ${i < toggles.length - 1 ? 'border-b border-white/5' : ''}`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <t.icon size={18} className={t.color} />
                <div>
                  <p className="text-sm font-medium text-[#F8FAFC]">{t.label}</p>
                  <p className="text-xs text-[#64748B]">{t.description}</p>
                </div>
              </div>
              <button onClick={() => handleToggle(t)} className="ml-3 shrink-0">
                {t.value ? <ToggleRight size={32} className="text-green-400" /> : <ToggleLeft size={32} className="text-[#64748B]" />}
              </button>
            </div>
          ))}
        </motion.div>

        {/* Privacy */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <h2 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-2">
              <Shield size={14} /> Privatliv & Data
            </h2>
          </div>
          <button onClick={() => router.push('/student/profile')} className="w-full flex items-center justify-between px-4 py-4 border-b border-white/5 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-violet-400" />
              <span className="text-sm text-[#F8FAFC]">GDPR-samtykke</span>
            </div>
            <ChevronRight size={16} className="text-[#64748B]" />
          </button>
          <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <Info size={18} className="text-blue-400" />
              <span className="text-sm text-[#F8FAFC]">Privatlivspolitik</span>
            </div>
            <ChevronRight size={16} className="text-[#64748B]" />
          </button>
        </motion.div>

        {/* App Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <h2 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-2">
              <MonitorSmartphone size={14} /> App
            </h2>
          </div>
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-[#64748B]" />
              <span className="text-sm text-[#94A3B8]">Version</span>
            </div>
            <span className="text-xs text-[#64748B] font-mono">1.0.0</span>
          </div>
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <Moon size={18} className="text-[#64748B]" />
              <span className="text-sm text-[#94A3B8]">Tema</span>
            </div>
            <span className="text-xs text-[#64748B]">Mørkt (altid)</span>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3 pt-4">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl glass text-[#F8FAFC] font-medium text-sm hover:bg-white/10 transition-colors">
            <LogOut size={16} /> Log ud
          </button>
          <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 font-medium text-sm hover:bg-red-500/10 transition-colors">
            <Trash2 size={16} /> Slet min konto
          </button>
        </motion.div>

        <p className="text-center text-[10px] text-[#64748B] pt-4 pb-8">
          Jobmatch © 2026 · Lavet med 💜 i Danmark
        </p>
      </div>
    </div>
  );
}
