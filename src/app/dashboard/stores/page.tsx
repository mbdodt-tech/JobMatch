'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Users,
  Loader2,
  Search,
  X,
  Phone,
  Mail,
  Globe,
  FileText,
  ExternalLink,
  GraduationCap,
  Building2,
  Briefcase,
  Store as StoreIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { EDUCATION_LINE_LABELS } from '@/lib/types/database';
import type { EducationLine } from '@/lib/types/database';

interface StoreDisplay {
  id: string;
  name: string;
  city: string;
  address: string;
  postal_code: string;
  education_lines: string[];
  internship_slots: number;
  matches: number;
  swipes_received: number;
  manager: string;
  is_active: boolean;
}

interface StoreDetail {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  postal_code: string;
  education_lines: EducationLine[];
  internship_slots: number;
  logo_url: string | null;
  cover_image_url: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  job_description_url: string | null;
  is_active: boolean;
  created_at: string;
  manager_name: string;
  manager_phone: string | null;
  manager_email: string | null;
  matches: number;
  swipes_received: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

function StoresContent() {
  const searchParams = useSearchParams();
  const [storesData, setStoresData] = useState<StoreDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreDetail | null>(null);
  const [storeLoading, setStoreLoading] = useState(false);

  useEffect(() => {
    async function fetchStores() {
      const supabase = createClient();

      const { data: stores } = await supabase
        .from('stores')
        .select('id, name, city, address, postal_code, education_lines, internship_slots, is_active, manager_id');

      if (!stores) {
        setLoading(false);
        return;
      }

      const enriched: StoreDisplay[] = [];
      for (const s of stores) {
        const { data: manager } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', s.manager_id)
          .single();

        const { count: swipeCount } = await supabase
          .from('swipes')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', s.id)
          .eq('direction', 'right');

        const { count: matchCount } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', s.id);

        const eduLabels = (s.education_lines || []).map(
          (line: string) => EDUCATION_LINE_LABELS[line as EducationLine] || line
        );

        enriched.push({
          id: s.id,
          name: s.name,
          city: s.city,
          address: s.address,
          postal_code: s.postal_code,
          education_lines: eduLabels,
          internship_slots: s.internship_slots,
          matches: matchCount ?? 0,
          swipes_received: swipeCount ?? 0,
          manager: manager?.full_name || 'Ukendt',
          is_active: s.is_active,
        });
      }

      setStoresData(enriched);
      setLoading(false);
    }

    fetchStores();
  }, []);

  async function openStoreDetail(storeId: string) {
    setSelectedStoreId(storeId);
    setStoreLoading(true);

    const supabase = createClient();

    const { data: store } = await supabase
      .from('stores')
      .select('id, name, description, address, city, postal_code, education_lines, internship_slots, logo_url, cover_image_url, phone, email, website, job_description_url, is_active, created_at, manager_id')
      .eq('id', storeId)
      .single();

    if (!store) {
      setStoreLoading(false);
      return;
    }

    const [managerRes, swipeRes, matchRes] = await Promise.all([
      supabase.from('profiles').select('full_name, phone, email').eq('id', store.manager_id).single(),
      supabase.from('swipes').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('direction', 'right'),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('store_id', storeId),
    ]);

    setSelectedStore({
      id: store.id,
      name: store.name,
      description: store.description,
      address: store.address,
      city: store.city,
      postal_code: store.postal_code,
      education_lines: store.education_lines || [],
      internship_slots: store.internship_slots,
      logo_url: store.logo_url,
      cover_image_url: store.cover_image_url,
      phone: store.phone,
      email: store.email,
      website: store.website,
      job_description_url: store.job_description_url,
      is_active: store.is_active,
      created_at: store.created_at,
      manager_name: managerRes.data?.full_name || 'Ukendt',
      manager_phone: managerRes.data?.phone || null,
      manager_email: managerRes.data?.email || null,
      matches: matchRes.count ?? 0,
      swipes_received: swipeRes.count ?? 0,
    });

    setStoreLoading(false);
  }

  function closeDetail() {
    setSelectedStoreId(null);
    setSelectedStore(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  const activeCount = storesData.filter(s => s.is_active).length;
  const totalSlots = storesData.reduce((sum, s) => sum + s.internship_slots, 0);
  const totalMatches = storesData.reduce((sum, s) => sum + s.matches, 0);

  const q = searchQuery.trim().toLowerCase();
  const filteredStores = q
    ? storesData.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.manager.toLowerCase().includes(q)
      )
    : storesData;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">Butikker</h1>
        <p className="text-[var(--text-secondary)] mt-1">Oversigt over alle tilknyttede butikker</p>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Aktive butikker', value: activeCount, color: 'text-green-400' },
          { label: 'Praktik­pladser', value: totalSlots, color: 'text-blue-400' },
          { label: 'Matches', value: totalMatches, color: 'text-purple-400' },
        ].map(stat => (
          <motion.div key={stat.label} variants={itemVariants} className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 text-center min-w-0 overflow-hidden">
            <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 break-words">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div variants={itemVariants} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Søg efter butik, by eller ansvarlig..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-11 !rounded-xl"
        />
      </motion.div>

      {storesData.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[var(--text-muted)]">Ingen butikker endnu</p>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[var(--text-muted)]">Ingen butikker matcher din søgning</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredStores.map(store => (
            <motion.div
              key={store.id}
              variants={itemVariants}
              onClick={() => openStoreDetail(store.id)}
              className={`group relative p-5 rounded-2xl bg-white/5 backdrop-blur-xl border hover:border-white/20 transition-all cursor-pointer ${store.is_active ? 'border-white/10' : 'border-red-500/10 opacity-60'}`}
            >
              {store.is_active && <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 opacity-50 rounded-t-2xl" />}
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1 mr-3">
                  <h3 className="font-semibold text-[var(--text-primary)] text-lg truncate">{store.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[var(--text-secondary)]">
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate">{store.address}, {store.postal_code} {store.city}</span>
                  </div>
                </div>
                <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${store.is_active ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'}`}>
                  {store.is_active ? 'Aktiv' : 'Inaktiv'}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-3">
                <Users size={12} /> Ansvarlig: {store.manager}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {store.education_lines.map(line => (
                  <span key={line} className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-medium text-purple-300">{line}</span>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
                <div className="text-center min-w-0">
                  <p className="text-sm font-bold text-[var(--text-primary)]">{store.internship_slots}</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">Pladser</p>
                </div>
                <div className="text-center min-w-0">
                  <p className="text-sm font-bold text-blue-400">{store.swipes_received}</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">Swipes</p>
                </div>
                <div className="text-center min-w-0">
                  <p className="text-sm font-bold text-green-400">{store.matches}</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">Matches</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Store detail sheet ── */}
      <AnimatePresence>
        {selectedStoreId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeDetail}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 max-h-[90vh] bg-[#12121A] rounded-t-3xl border-t border-white/10 overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 bg-[#12121A] flex justify-center py-3 rounded-t-3xl">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="px-6 pb-10">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={closeDetail}
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-muted hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {storeLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  </div>
                ) : selectedStore ? (
                  <>
                    {/* Logo + name */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                        {selectedStore.logo_url ? (
                          <img
                            src={selectedStore.logo_url}
                            alt={selectedStore.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <StoreIcon className="w-8 h-8 text-white" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl font-bold text-white truncate">{selectedStore.name}</h2>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${selectedStore.is_active ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'}`}>
                            {selectedStore.is_active ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </div>
                        <p className="text-text-secondary text-sm mt-0.5">
                          Oprettet {new Date(selectedStore.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                        <p className="text-lg font-bold text-[var(--text-primary)]">{selectedStore.internship_slots}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">Pladser</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                        <p className="text-lg font-bold text-blue-400">{selectedStore.swipes_received}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">Swipes</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                        <p className="text-lg font-bold text-green-400">{selectedStore.matches}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">Matches</p>
                      </div>
                    </div>

                    {/* Description */}
                    {selectedStore.description && (
                      <div className="mb-5">
                        <h3 className="text-sm font-medium text-text-secondary mb-1.5">Beskrivelse</h3>
                        <div className="text-white text-sm bg-white/5 rounded-xl p-4 border border-white/5">
                          <p>{selectedStore.description}</p>
                        </div>
                      </div>
                    )}

                    {/* Address */}
                    <div className="mb-5">
                      <h3 className="text-sm font-medium text-text-secondary mb-1.5">Adresse</h3>
                      <div className="flex items-start gap-3 text-white text-sm bg-white/5 rounded-xl p-4 border border-white/5">
                        <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span>{selectedStore.address}, {selectedStore.postal_code} {selectedStore.city}</span>
                      </div>
                    </div>

                    {/* Education lines */}
                    {selectedStore.education_lines.length > 0 && (
                      <div className="mb-5">
                        <h3 className="text-sm font-medium text-text-secondary mb-1.5">Uddannelseslinjer</h3>
                        <div className="flex items-start gap-3 text-white text-sm bg-white/5 rounded-xl p-4 border border-white/5">
                          <GraduationCap className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                          <div className="flex flex-wrap gap-1.5">
                            {selectedStore.education_lines.map(line => (
                              <span key={line} className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-medium text-purple-300">
                                {EDUCATION_LINE_LABELS[line] || line}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Internship slots */}
                    <div className="mb-5">
                      <h3 className="text-sm font-medium text-text-secondary mb-1.5">Praktikpladser</h3>
                      <div className="flex items-center gap-3 text-white text-sm bg-white/5 rounded-xl p-4 border border-white/5">
                        <Briefcase className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>{selectedStore.internship_slots} {selectedStore.internship_slots === 1 ? 'plads' : 'pladser'} tilgængelig{selectedStore.internship_slots === 1 ? '' : 'e'}</span>
                      </div>
                    </div>

                    {/* Manager */}
                    <div className="mb-5">
                      <h3 className="text-sm font-medium text-text-secondary mb-1.5">Ansvarlig</h3>
                      <div className="flex items-center gap-3 text-white text-sm bg-white/5 rounded-xl p-4 border border-white/5">
                        <Building2 className="w-4 h-4 text-purple-400 shrink-0" />
                        <span>{selectedStore.manager_name}</span>
                      </div>
                    </div>

                    {/* Job description PDF */}
                    {selectedStore.job_description_url && (
                      <div className="mb-5">
                        <h3 className="text-sm font-medium text-text-secondary mb-1.5">Jobopslag</h3>
                        <a
                          href={selectedStore.job_description_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors"
                        >
                          <FileText className="w-5 h-5" />
                          <span className="font-medium text-sm">Se jobopslag (PDF)</span>
                          <ExternalLink className="w-4 h-4 ml-auto" />
                        </a>
                      </div>
                    )}

                    {/* Contact */}
                    <div className="mb-2">
                      <h3 className="text-sm font-medium text-text-secondary mb-2">Kontaktoplysninger</h3>
                      <div className="space-y-2">
                        {(selectedStore.phone || selectedStore.manager_phone) && (
                          <a
                            href={`tel:${selectedStore.phone || selectedStore.manager_phone}`}
                            className="flex items-center gap-3 p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-colors"
                          >
                            <Phone className="w-5 h-5" />
                            <span className="font-medium text-sm">Ring: {selectedStore.phone || selectedStore.manager_phone}</span>
                          </a>
                        )}
                        {(selectedStore.email || selectedStore.manager_email) && (
                          <a
                            href={`mailto:${selectedStore.email || selectedStore.manager_email}`}
                            className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors"
                          >
                            <Mail className="w-5 h-5" />
                            <span className="font-medium text-sm break-all">Email: {selectedStore.email || selectedStore.manager_email}</span>
                          </a>
                        )}
                        {selectedStore.website && (
                          <a
                            href={selectedStore.website.startsWith('http') ? selectedStore.website : `https://${selectedStore.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors"
                          >
                            <Globe className="w-5 h-5" />
                            <span className="font-medium text-sm break-all">{selectedStore.website}</span>
                            <ExternalLink className="w-4 h-4 ml-auto shrink-0" />
                          </a>
                        )}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function DashboardStores() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      }
    >
      <StoresContent />
    </Suspense>
  );
}
