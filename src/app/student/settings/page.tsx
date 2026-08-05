'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, BellOff, Shield, Moon, LogOut, Trash2, ChevronRight,
  Mail, Smartphone, MonitorSmartphone, Globe, Info, ToggleLeft, ToggleRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { enablePush, disablePush, isDeviceSubscribed } from '@/lib/push';
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
  const [pushHint, setPushHint] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data }, deviceSubscribed] = await Promise.all([
        supabase.from('profiles').select('notify_push, notify_email, notify_in_app').eq('id', user.id).single(),
        isDeviceSubscribed(),
      ]);
      if (data) {
        // The push toggle reflects THIS device — the DB flag alone says nothing
        // about whether this phone is actually registered for push
        setNotifyPush(data.notify_push && deviceSubscribed);
        setNotifyEmail(data.notify_email);
        setNotifyInApp(data.notify_in_app);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    { key: 'notify_push', label: 'Push-notifikationer', description: 'Beskeder på låseskærmen — også når appen er lukket', icon: Smartphone, value: notifyPush, color: 'text-[#0B6B60]' },
    { key: 'notify_email', label: 'Email-notifikationer', description: 'Modtag en email når du matcher', icon: Mail, value: notifyEmail, color: 'text-[#4E50C4]' },
    { key: 'notify_in_app', label: 'In-app notifikationer', description: 'Vis bannere inde i appen', icon: Bell, value: notifyInApp, color: 'text-[#0B6B60]' },
  ];

  const handleToggle = async (t: SettingToggle) => {
    const newVal = !t.value;

    // Push needs a real browser subscription, not just the DB flag — and the
    // permission prompt must come from this tap (iOS requirement)
    if (t.key === 'notify_push') {
      setPushHint('');
      if (newVal) {
        const result = await enablePush(supabase);
        if (result === 'denied') {
          setPushHint('Du har blokeret notifikationer — tillad dem i telefonens indstillinger for Jobmatch.');
          return;
        }
        if (result === 'unsupported') {
          setPushHint('Push kræver at appen er føjet til hjemmeskærmen (iOS 16.4+).');
          return;
        }
        if (result === 'error') {
          setPushHint('Kunne ikke aktivere push — prøv igen.');
          return;
        }
      } else {
        await disablePush(supabase);
      }
      setNotifyPush(newVal);
      updateSetting(t.key, newVal);
      return;
    }

    if (t.key === 'notify_email') setNotifyEmail(newVal);
    if (t.key === 'notify_in_app') setNotifyInApp(newVal);
    updateSetting(t.key, newVal);
  };

  return (
    <div className="min-h-dvh bg-[#FAF7F1] pb-32">
      <div className="px-4 pt-6 pb-4 max-w-md mx-auto safe-top">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#211F1A]">
          Indstillinger
        </h1>
        <p className="text-sm text-[#6E6759] mt-0.5">Tilpas din oplevelse</p>
      </div>

      <div className="max-w-md mx-auto px-4 space-y-4">
        {/* Notification Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white border border-[#EAE4D8] varm-card-shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-[#EAE4D8]">
            <h2 className="text-xs font-semibold text-[#6E6759] uppercase tracking-wider flex items-center gap-2">
              <Bell size={14} /> Notifikationer
            </h2>
          </div>
          {toggles.map((t, i) => (
            <div key={t.key} className={`${i < toggles.length - 1 ? 'border-b border-[#EAE4D8]' : ''}`}>
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <t.icon size={18} className={t.color} />
                  <div>
                    <p className="text-sm font-medium text-[#211F1A]">{t.label}</p>
                    <p className="text-xs text-[#6E6759]">{t.description}</p>
                  </div>
                </div>
                <button onClick={() => handleToggle(t)} className="ml-3 shrink-0" aria-label={`${t.value ? 'Slå fra' : 'Slå til'}: ${t.label}`}>
                  {t.value ? <ToggleRight size={32} className="text-[#0E8578]" /> : <ToggleLeft size={32} className="text-[#8B8471]" />}
                </button>
              </div>
              {t.key === 'notify_push' && pushHint && (
                <p className="px-4 pb-3 -mt-1 text-xs text-[#B3412A]">{pushHint}</p>
              )}
            </div>
          ))}
        </motion.div>

        {/* Privacy */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl bg-white border border-[#EAE4D8] varm-card-shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-[#EAE4D8]">
            <h2 className="text-xs font-semibold text-[#6E6759] uppercase tracking-wider flex items-center gap-2">
              <Shield size={14} /> Privatliv & Data
            </h2>
          </div>
          <button onClick={() => router.push('/student/profile')} className="w-full flex items-center justify-between px-4 py-4 border-b border-[#EAE4D8] hover:bg-[#FAF7F1] transition-colors">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-[#4E50C4]" />
              <span className="text-sm text-[#211F1A]">GDPR-samtykke</span>
            </div>
            <ChevronRight size={16} className="text-[#8B8471]" />
          </button>
          <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-[#FAF7F1] transition-colors">
            <div className="flex items-center gap-3">
              <Info size={18} className="text-[#4E50C4]" />
              <span className="text-sm text-[#211F1A]">Privatlivspolitik</span>
            </div>
            <ChevronRight size={16} className="text-[#8B8471]" />
          </button>
        </motion.div>

        {/* App Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl bg-white border border-[#EAE4D8] varm-card-shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-[#EAE4D8]">
            <h2 className="text-xs font-semibold text-[#6E6759] uppercase tracking-wider flex items-center gap-2">
              <MonitorSmartphone size={14} /> App
            </h2>
          </div>
          <div className="flex items-center justify-between px-4 py-4 border-b border-[#EAE4D8]">
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-[#8B8471]" />
              <span className="text-sm text-[#6E6759]">Version</span>
            </div>
            <span className="text-xs text-[#8B8471] font-mono">1.0.0</span>
          </div>
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <Moon size={18} className="text-[#8B8471]" />
              <span className="text-sm text-[#6E6759]">Tema</span>
            </div>
            <span className="text-xs text-[#8B8471]">Lyst (altid)</span>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3 pt-4">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white border border-[#EAE4D8] varm-card-shadow text-[#211F1A] font-medium text-sm hover:bg-[#F3EEE4] transition-colors">
            <LogOut size={16} /> Log ud
          </button>
          <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#FCEAE3] border border-[#F3C9BA] text-[#B3412A] font-medium text-sm hover:bg-[#F8DED2] transition-colors">
            <Trash2 size={16} /> Slet min konto
          </button>
        </motion.div>

        <p className="text-center text-[10px] text-[#8B8471] pt-4 pb-8">
          Jobmatch © 2026 · Lavet med 💜 i Danmark
        </p>
      </div>
    </div>
  );
}
