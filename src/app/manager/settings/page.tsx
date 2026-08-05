'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, Smartphone, LogOut, Moon, Globe, ToggleLeft, ToggleRight, MonitorSmartphone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { enablePush, disablePush } from '@/lib/push';
import { useRouter } from 'next/navigation';

export default function ManagerSettings() {
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [pushHint, setPushHint] = useState('');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSetting = async (field: string, value: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ [field]: value }).eq('id', user.id);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const toggles = [
    { key: 'notify_push', label: 'Push-notifikationer', desc: 'Besked på telefonen ved match og chat', icon: Smartphone, value: notifyPush, set: setNotifyPush, color: 'text-[#0B6B60]' },
    { key: 'notify_email', label: 'Email-notifikationer', desc: 'Daglig opsummering af nye matches', icon: Mail, value: notifyEmail, set: setNotifyEmail, color: 'text-[#0B6B60]' },
    { key: 'notify_in_app', label: 'In-app notifikationer', desc: 'Vis badges og bannere', icon: Bell, value: notifyInApp, set: setNotifyInApp, color: 'text-[#0B6B60]' },
  ];

  const handleToggle = async (t: (typeof toggles)[number]) => {
    const newVal = !t.value;

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
    }

    t.set(newVal);
    updateSetting(t.key, newVal);
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAF7F1] pb-8">
      <div className="px-4 pt-6 pb-4 max-w-md mx-auto safe-top">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#211F1A]">Indstillinger</h1>
      </div>
      <div className="max-w-md mx-auto px-4 space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white border border-[#EAE4D8] varm-card-shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-[#EAE4D8]">
            <h2 className="text-xs font-semibold text-[#8B8471] uppercase tracking-wider flex items-center gap-2"><Bell size={14} /> Notifikationer</h2>
          </div>
          {toggles.map((t, i) => (
            <div key={t.key} className={`${i < toggles.length - 1 ? 'border-b border-[#EAE4D8]' : ''}`}>
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3 flex-1">
                  <t.icon size={18} className={t.color} />
                  <div><p className="text-sm font-medium text-[#211F1A]">{t.label}</p><p className="text-xs text-[#6E6759]">{t.desc}</p></div>
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl bg-white border border-[#EAE4D8] varm-card-shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-[#EAE4D8]"><h2 className="text-xs font-semibold text-[#8B8471] uppercase tracking-wider flex items-center gap-2"><MonitorSmartphone size={14} /> App</h2></div>
          <div className="flex items-center justify-between px-4 py-4 border-b border-[#EAE4D8]"><div className="flex items-center gap-3"><Globe size={18} className="text-[#8B8471]" /><span className="text-sm text-[#6E6759]">Version</span></div><span className="text-xs text-[#8B8471] font-mono">1.0.0</span></div>
          <div className="flex items-center justify-between px-4 py-4"><div className="flex items-center gap-3"><Moon size={18} className="text-[#8B8471]" /><span className="text-sm text-[#6E6759]">Tema</span></div><span className="text-xs text-[#8B8471]">Lyst</span></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="pt-4">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white border border-[#EAE4D8] varm-card-shadow text-[#211F1A] font-medium text-sm hover:bg-[#FAF7F1] transition-colors"><LogOut size={16} /> Log ud</button>
        </motion.div>
      </div>
    </div>
  );
}
