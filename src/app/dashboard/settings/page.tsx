'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Bell, Shield, Database, Key, ChevronRight,
  ToggleLeft, ToggleRight, Save, Building2, Mail, Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function DashboardSettings() {
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [autoReminders, setAutoReminders] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [anonymizeExport, setAnonymizeExport] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); window.location.href = '/login'; return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profile?.organization_id) {
        setOrgId(profile.organization_id);

        const { data: org } = await supabase
          .from('organizations')
          .select('name, email, phone')
          .eq('id', profile.organization_id)
          .single();

        if (org) {
          setOrgName(org.name || '');
          setOrgEmail(org.email || '');
          setOrgPhone(org.phone || '');
        }
      }

      setLoading(false);
    }

    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    if (orgId) {
      const supabase = createClient();
      await supabase
        .from('organizations')
        .update({
          name: orgName,
          email: orgEmail,
          phone: orgPhone,
        })
        .eq('id', orgId);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]"><span className="gradient-text">Indstillinger</span></h1>
        <p className="text-[var(--text-secondary)] mt-1">Konfigurer dashboard og organisation</p>
      </div>

      {/* Organization */}
      <div className="rounded-2xl glass-card overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2"><Building2 size={14} /> Organisation</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label htmlFor="settings-org-name" className="text-xs text-[var(--text-muted)] block mb-1.5">Organisationsnavn</label>
            <input id="settings-org-name" type="text" value={orgName} onChange={e => setOrgName(e.target.value)} className="w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="settings-org-email" className="text-xs text-[var(--text-muted)] block mb-1.5">Kontakt-email</label>
              <input id="settings-org-email" type="email" value={orgEmail} onChange={e => setOrgEmail(e.target.value)} className="w-full" />
            </div>
            <div>
              <label htmlFor="settings-org-phone" className="text-xs text-[var(--text-muted)] block mb-1.5">Telefon</label>
              <input id="settings-org-phone" type="tel" value={orgPhone} onChange={e => setOrgPhone(e.target.value)} className="w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl glass-card overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2"><Bell size={14} /> Notifikationer & Rapporter</h2>
        </div>
        {[
          { label: 'Automatiske påmindelser', desc: 'Send påmindelser til inaktive elever efter 7 dage', value: autoReminders, set: setAutoReminders, color: 'text-purple-400', icon: Bell },
          { label: 'Ugentlig rapport', desc: 'Modtag en email-rapport hver mandag med KPI-oversigt', value: weeklyReport, set: setWeeklyReport, color: 'text-blue-400', icon: Mail },
          { label: 'Anonymiser i eksport', desc: 'Skjul navne ved data-eksport til eksterne parter', value: anonymizeExport, set: setAnonymizeExport, color: 'text-emerald-400', icon: Shield },
        ].map((t, i) => (
          <div key={t.label} className={`flex items-center justify-between px-5 py-4 ${i < 2 ? 'border-b border-white/5' : ''}`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <t.icon size={18} className={t.color} />
              <div><p className="text-sm font-medium text-[var(--text-primary)]">{t.label}</p><p className="text-xs text-[var(--text-muted)]">{t.desc}</p></div>
            </div>
            <button onClick={() => t.set(!t.value)} className="ml-3 shrink-0">
              {t.value ? <ToggleRight size={32} className="text-emerald-400" /> : <ToggleLeft size={32} className="text-[var(--text-muted)]" />}
            </button>
          </div>
        ))}
      </div>

      {/* At-Risk Thresholds */}
      <div className="rounded-2xl glass-card overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2"><Settings size={14} /> At-risk tærskelværdier</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="settings-min-swipes" className="text-xs text-[var(--text-muted)] block mb-1.5">Min. swipes for alarm</label>
              <input id="settings-min-swipes" type="number" defaultValue={30} className="w-full" />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Elever med flere swipes end dette og 0 matches markeres</p>
            </div>
            <div>
              <label htmlFor="settings-inactivity-days" className="text-xs text-[var(--text-muted)] block mb-1.5">Inaktivitetsdage</label>
              <input id="settings-inactivity-days" type="number" defaultValue={7} className="w-full" />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Dage uden aktivitet før eleven markeres som inaktiv</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="rounded-2xl glass-card overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2"><Database size={14} /> Data & GDPR</h2>
        </div>
        <button className="w-full flex items-center justify-between px-5 py-4 border-b border-white/5 hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-3"><Key size={18} className="text-amber-400" /><span className="text-sm text-[var(--text-primary)]">API-nøgler</span></div>
          <ChevronRight size={16} className="text-[var(--text-muted)]" />
        </button>
        <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-3"><Shield size={18} className="text-purple-400" /><span className="text-sm text-[var(--text-primary)]">GDPR Databehandleraftale</span></div>
          <ChevronRight size={16} className="text-[var(--text-muted)]" />
        </button>
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {saved && (
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm text-emerald-400 font-medium"
          >
            Gemt!
          </motion.span>
        )}
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 rounded-xl btn-gradient text-white font-semibold text-sm disabled:opacity-60">
          <Save size={16} /> {saving ? 'Gemmer…' : 'Gem indstillinger'}
        </button>
      </div>
    </motion.div>
  );
}
