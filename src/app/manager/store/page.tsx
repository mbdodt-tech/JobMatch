'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Store as StoreIcon,
  MapPin,
  Phone,
  Mail,
  Globe,
  Hash,
  Save,
  Loader2,
  CheckCircle2,
  ImagePlus,
  FileText,
  Upload,
  X,
  ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Store, EducationLine } from '@/lib/types/database';
import { EDUCATION_LINE_LABELS } from '@/lib/types/database';
import DANISH_POSTAL_CODES from '@/lib/data/danish-postal-codes';

const ALL_EDUCATION_LINES: EducationLine[] = [
  'detail',
  'handel_salg',
  'handel_indkoeb',
  'handel_logistik',
  'spedition',
  'kontoradministration',
];

export default function ManagerStorePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [store, setStore] = useState<Partial<Store>>({
    name: '',
    description: '',
    address: '',
    city: '',
    postal_code: '',
    education_lines: [],
    internship_slots: 1,
    phone: '',
    email: '',
    website: '',
    logo_url: '',
    cover_image_url: '',
  });
  const [isNew, setIsNew] = useState(true);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const jobDescInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStore();
  }, []);

  async function loadStore() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { setLoading(false); window.location.href = '/login'; return; }

    const { data } = await supabase
      .from('stores')
      .select('*')
      .eq('manager_id', user.id)
      .single();

    if (data) {
      setStore(data);
      setIsNew(false);
    }
    setLoading(false);
  }

  function toggleEducationLine(line: EducationLine) {
    const current = store.education_lines || [];
    if (current.includes(line)) {
      setStore({ ...store, education_lines: current.filter((l) => l !== line) });
    } else {
      setStore({ ...store, education_lines: [...current, line] });
    }
  }

  async function handleJobDescUpload(file: File) {
    setUploadError('');
    setUploadingPdf(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const path = `store-docs/${user.id}/job-description.${ext}`;
      const { error } = await supabase.storage
        .from('student-media')
        .upload(path, file, { upsert: true });

      if (error) {
        setUploadError(`Upload fejlede: ${error.message}`);
        return;
      }

      const { data } = supabase.storage.from('student-media').getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setStore((prev) => ({ ...prev, job_description_url: url }));

      if (store.id) {
        await supabase.from('stores').update({ job_description_url: url }).eq('id', store.id);
      }
    } finally {
      setUploadingPdf(false);
    }
  }

  async function removeJobDesc() {
    setStore((prev) => ({ ...prev, job_description_url: null }));
    if (store.id) {
      const supabase = createClient();
      await supabase.from('stores').update({ job_description_url: null }).eq('id', store.id);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const storeData = {
      manager_id: user.id,
      name: store.name || '',
      description: store.description || null,
      address: store.address || '',
      city: store.city || '',
      postal_code: store.postal_code || '',
      education_lines: store.education_lines || [],
      internship_slots: store.internship_slots || 1,
      phone: store.phone || null,
      email: store.email || null,
      website: store.website || null,
      logo_url: store.logo_url || null,
      cover_image_url: store.cover_image_url || null,
      job_description_url: store.job_description_url || null,
    };

    if (isNew) {
      const { data } = await supabase
        .from('stores')
        .insert(storeData)
        .select()
        .single();
      if (data) {
        setStore(data);
        setIsNew(false);
      }
    } else {
      await supabase
        .from('stores')
        .update(storeData)
        .eq('id', store.id!);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="aurora-bg aurora-bg-subtle flex items-center justify-center min-h-[100dvh]">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="aurora-bg aurora-bg-subtle min-h-[100dvh]">
    <div className="max-w-md mx-auto px-4 pt-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          {isNew ? (
            <>Opret din <span className="gradient-text">butik</span></>
          ) : (
            <>Min <span className="gradient-text">butik</span></>
          )}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {isNew
            ? 'Udfyld oplysninger om din butik for at komme i gang'
            : 'Rediger din butiksprofil'}
        </p>
      </motion.div>

      <form onSubmit={handleSave}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Basic info card */}
          <div className="p-5 rounded-2xl glass-card space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <StoreIcon className="w-5 h-5 text-violet-400" />
              <h2 className="text-white font-semibold">Butikoplysninger</h2>
            </div>

            {/* Store name */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Butiksnavn *
              </label>
              <input
                type="text"
                value={store.name || ''}
                onChange={(e) => setStore({ ...store, name: e.target.value })}
                placeholder="F.eks. Netto Østerbro"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Beskrivelse
              </label>
              <textarea
                value={store.description || ''}
                onChange={(e) =>
                  setStore({ ...store, description: e.target.value })
                }
                placeholder="Fortæl lidt om butikken og hvad praktikanten kan forvente..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all text-sm resize-none"
              />
            </div>

            {/* Job description PDF upload */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Jobbeskrivelse (PDF) — valgfrit alternativ
              </label>
              <input
                ref={jobDescInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleJobDescUpload(f);
                  e.target.value = '';
                }}
              />
              {store.job_description_url ? (
                <div className="flex items-center gap-2">
                  <a
                    href={store.job_description_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center gap-2 py-2.5 px-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors"
                  >
                    <FileText size={16} /> Se jobbeskrivelse <ExternalLink size={12} className="ml-auto" />
                  </a>
                  <button
                    type="button"
                    onClick={() => jobDescInputRef.current?.click()}
                    disabled={uploadingPdf}
                    className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-[#94A3B8] text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {uploadingPdf ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    Skift
                  </button>
                  <button
                    type="button"
                    onClick={removeJobDesc}
                    className="py-2.5 px-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors flex items-center gap-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => jobDescInputRef.current?.click()}
                  disabled={uploadingPdf}
                  className="w-full py-4 rounded-xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center gap-2 hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors disabled:opacity-50"
                >
                  {uploadingPdf ? (
                    <Loader2 size={18} className="text-violet-400 animate-spin" />
                  ) : (
                    <Upload size={18} className="text-[#94A3B8]" />
                  )}
                  <span className="text-sm text-[#94A3B8] font-medium">
                    {uploadingPdf ? 'Uploader...' : 'Upload jobbeskrivelse (PDF)'}
                  </span>
                </button>
              )}
              {uploadError && (
                <p className="text-xs text-red-400 mt-1.5">{uploadError}</p>
              )}
            </div>
          </div>

          {/* Address card */}
          <div className="p-5 rounded-2xl glass-card space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              <h2 className="text-white font-semibold">Adresse</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Adresse *
              </label>
              <input
                type="text"
                value={store.address || ''}
                onChange={(e) =>
                  setStore({ ...store, address: e.target.value })
                }
                placeholder="Gade og nummer"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all text-sm"
              />
            </div>

            <div className="grid grid-cols-[1fr_1.6fr] gap-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Postnummer *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={store.postal_code || ''}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                    const city = digits.length === 4 && DANISH_POSTAL_CODES[digits]
                      ? DANISH_POSTAL_CODES[digits]
                      : digits.length < 4 ? '' : (store.city || '');
                    setStore({ ...store, postal_code: digits, city });
                  }}
                  placeholder="2100"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  By *
                </label>
                <input
                  type="text"
                  value={store.city || ''}
                  readOnly={!!store.postal_code && store.postal_code.length === 4 && !!DANISH_POSTAL_CODES[store.postal_code]}
                  onChange={(e) =>
                    setStore({ ...store, city: e.target.value })
                  }
                  placeholder="Udfyldes automatisk"
                  required
                  className={`w-full px-4 py-3 rounded-xl border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all text-sm ${
                    store.postal_code && store.postal_code.length === 4 && DANISH_POSTAL_CODES[store.postal_code]
                      ? 'bg-violet-500/10 border-violet-500/20'
                      : 'bg-white/5'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Education lines card */}
          <div className="p-5 rounded-2xl glass-card space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-green-400" />
              <h2 className="text-white font-semibold">Uddannelseslinjer</h2>
            </div>
            <p className="text-text-secondary text-xs">
              Vælg hvilke uddannelseslinjer der er relevante for din butik
            </p>

            <div className="space-y-2">
              {ALL_EDUCATION_LINES.map((line) => {
                const isSelected = (store.education_lines || []).includes(line);
                return (
                  <motion.button
                    key={line}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleEducationLine(line)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left text-sm ${
                      isSelected
                        ? 'bg-violet-500/10 border-violet-500/30 text-white'
                        : 'bg-white/[0.02] border-white/5 text-text-secondary hover:border-white/10'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-violet-500 border-violet-500'
                          : 'border-white/20 bg-transparent'
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                    {EDUCATION_LINE_LABELS[line]}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Internship slots */}
          <div className="p-5 rounded-2xl glass-card space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-5 h-5 text-orange-400" />
              <h2 className="text-white font-semibold">Praktikpladser</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Antal ledige pladser
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={store.internship_slots ?? 1}
                onChange={(e) =>
                  setStore({
                    ...store,
                    internship_slots: parseInt(e.target.value) || 0,
                  })
                }
                className="w-24 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all text-sm text-center"
              />
            </div>
          </div>

          {/* Images card */}
          <div className="p-5 rounded-2xl glass-card space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <ImagePlus className="w-5 h-5 text-cyan-400" />
              <h2 className="text-white font-semibold">Billeder</h2>
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Logo URL
              </label>
              <input
                type="url"
                value={store.logo_url || ''}
                onChange={(e) =>
                  setStore({ ...store, logo_url: e.target.value })
                }
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all text-sm"
              />
            </div>

            {/* Cover image */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Cover-billede URL
              </label>
              <input
                type="url"
                value={store.cover_image_url || ''}
                onChange={(e) =>
                  setStore({ ...store, cover_image_url: e.target.value })
                }
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all text-sm"
              />
            </div>
          </div>

          {/* Contact card */}
          <div className="p-5 rounded-2xl glass-card space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-5 h-5 text-violet-400" />
              <h2 className="text-white font-semibold">Kontakt</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Telefon
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="tel"
                  value={store.phone || ''}
                  onChange={(e) =>
                    setStore({ ...store, phone: e.target.value })
                  }
                  placeholder="+45 12 34 56 78"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  value={store.email || ''}
                  onChange={(e) =>
                    setStore({ ...store, email: e.target.value })
                  }
                  placeholder="butik@email.dk"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Hjemmeside
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="url"
                  value={store.website || ''}
                  onChange={(e) =>
                    setStore({ ...store, website: e.target.value })
                  }
                  placeholder="https://www.butik.dk"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* Save button */}
          <motion.button
            type="submit"
            disabled={saving}
            whileHover={{ scale: saving ? 1 : 1.02 }}
            whileTap={{ scale: saving ? 1 : 0.98 }}
            className={`w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
              saved ? 'bg-emerald-500 glow-green' : 'btn-gradient'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Gemmer...
              </>
            ) : saved ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Gemt!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {isNew ? 'Opret butik' : 'Gem ændringer'}
              </>
            )}
          </motion.button>
        </motion.div>
      </form>
    </div>
    </div>
  );
}
