'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
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
  ChevronDown,
  ChevronRight,
  Upload,
  Download,
  Plus,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/client';
import { EDUCATION_LINE_LABELS } from '@/lib/types/database';
import type { EducationLine } from '@/lib/types/database';
import DANISH_POSTAL_CODES from '@/lib/data/danish-postal-codes';

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
  chain_id: string | null;
}

interface ChainDisplay {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  stores: StoreDisplay[];
  totalSlots: number;
  totalMatches: number;
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
  chain_name: string | null;
}

interface ManagerOption {
  id: string;
  full_name: string;
  email: string;
}

interface ImportRow {
  name: string;
  address: string;
  postal_code: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  education_lines: string;
  internship_slots: number;
  description: string;
  valid: boolean;
  error: string;
}

const EDUCATION_LINE_KEYS: Record<string, EducationLine> = {
  'detail': 'detail',
  'handel & salg': 'handel_salg',
  'handel og salg': 'handel_salg',
  'handel_salg': 'handel_salg',
  'handel & indkøb': 'handel_indkoeb',
  'handel og indkøb': 'handel_indkoeb',
  'handel_indkoeb': 'handel_indkoeb',
  'handel & logistik': 'handel_logistik',
  'handel og logistik': 'handel_logistik',
  'handel_logistik': 'handel_logistik',
  'spedition': 'spedition',
  'kontoradministration': 'kontoradministration',
  'kontor': 'kontoradministration',
};

function parseEducationLines(raw: string): EducationLine[] {
  if (!raw) return [];
  return raw
    .split(/[,;]/)
    .map(s => s.trim().toLowerCase())
    .map(s => EDUCATION_LINE_KEYS[s])
    .filter((v): v is EducationLine => !!v);
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
  const [chains, setChains] = useState<ChainDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [expandedChains, setExpandedChains] = useState<Set<string>>(new Set());

  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreDetail | null>(null);
  const [storeLoading, setStoreLoading] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [importChainId, setImportChainId] = useState<string>('');
  const [newChainName, setNewChainName] = useState('');
  const [creatingChain, setCreatingChain] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStores();
  }, []);

  async function fetchStores() {
    const supabase = createClient();

    const [storesRes, chainsRes] = await Promise.all([
      supabase.from('stores').select('id, name, city, address, postal_code, education_lines, internship_slots, is_active, manager_id, chain_id'),
      supabase.from('store_chains').select('id, name, logo_url, website'),
    ]);

    const stores = storesRes.data || [];
    const chainsList = chainsRes.data || [];

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
        chain_id: s.chain_id,
      });
    }

    const chainMap = new Map<string, ChainDisplay>();
    for (const c of chainsList) {
      chainMap.set(c.id, {
        id: c.id,
        name: c.name,
        logo_url: c.logo_url,
        website: c.website,
        stores: [],
        totalSlots: 0,
        totalMatches: 0,
      });
    }

    for (const store of enriched) {
      if (store.chain_id && chainMap.has(store.chain_id)) {
        const chain = chainMap.get(store.chain_id)!;
        chain.stores.push(store);
        chain.totalSlots += store.internship_slots;
        chain.totalMatches += store.matches;
      }
    }

    setStoresData(enriched);
    setChains(Array.from(chainMap.values()).sort((a, b) => b.stores.length - a.stores.length));
    setLoading(false);
  }

  async function openStoreDetail(storeId: string) {
    setSelectedStoreId(storeId);
    setStoreLoading(true);

    const supabase = createClient();

    const { data: store } = await supabase
      .from('stores')
      .select('id, name, description, address, city, postal_code, education_lines, internship_slots, logo_url, cover_image_url, phone, email, website, job_description_url, is_active, created_at, manager_id, chain_id')
      .eq('id', storeId)
      .single();

    if (!store) {
      setStoreLoading(false);
      return;
    }

    const promises: Promise<any>[] = [
      supabase.from('profiles').select('full_name, phone, email').eq('id', store.manager_id).single(),
      supabase.from('swipes').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('direction', 'right'),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('store_id', storeId),
    ];

    if (store.chain_id) {
      promises.push(supabase.from('store_chains').select('name').eq('id', store.chain_id).single());
    }

    const results = await Promise.all(promises);
    const [managerRes, swipeRes, matchRes] = results;
    const chainRes = store.chain_id ? results[3] : null;

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
      chain_name: chainRes?.data?.name || null,
    });

    setStoreLoading(false);
  }

  function closeDetail() {
    setSelectedStoreId(null);
    setSelectedStore(null);
  }

  function toggleChain(chainId: string) {
    setExpandedChains(prev => {
      const next = new Set(prev);
      if (next.has(chainId)) next.delete(chainId);
      else next.add(chainId);
      return next;
    });
  }

  async function openImportModal() {
    setShowImportModal(true);
    setImportStep(1);
    setImportChainId('');
    setNewChainName('');
    setSelectedManagerId('');
    setImportRows([]);
    setImportResult(null);

    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'store_manager');
    setManagers(data || []);
  }

  async function createNewChain() {
    if (!newChainName.trim()) return;
    setCreatingChain(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('store_chains')
      .insert({ name: newChainName.trim() })
      .select('id, name, logo_url, website')
      .single();

    if (data) {
      setChains(prev => [...prev, { ...data, stores: [], totalSlots: 0, totalMatches: 0 }]);
      setImportChainId(data.id);
      setNewChainName('');
    }
    setCreatingChain(false);
  }

  function downloadTemplate() {
    const templateData = [
      {
        Butiksnavn: 'Eksempel Butik',
        Adresse: 'Strøget 1',
        Postnummer: '1000',
        By: 'København K',
        Telefon: '12345678',
        Email: 'butik@example.dk',
        Hjemmeside: 'www.example.dk',
        Uddannelseslinjer: 'Detail, Handel & Salg',
        Praktikpladser: 2,
        Beskrivelse: 'En kort beskrivelse af butikken',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const colWidths = [
      { wch: 20 }, { wch: 25 }, { wch: 12 }, { wch: 15 },
      { wch: 12 }, { wch: 25 }, { wch: 20 }, { wch: 30 },
      { wch: 14 }, { wch: 40 },
    ];
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Butikker');
    XLSX.writeFile(wb, 'butik-import-skabelon.xlsx');
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

      const parsed: ImportRow[] = raw.map(row => {
        const name = String(row['Butiksnavn'] || row['Navn'] || row['name'] || '').trim();
        const address = String(row['Adresse'] || row['address'] || '').trim();
        const postalCode = String(row['Postnummer'] || row['postal_code'] || row['Postnr'] || '').trim();
        const rawCity = String(row['By'] || row['city'] || row['City'] || '').trim();
        const city = rawCity || DANISH_POSTAL_CODES[postalCode] || '';
        const phone = String(row['Telefon'] || row['phone'] || row['Tlf'] || '').trim();
        const email = String(row['Email'] || row['E-mail'] || row['email'] || '').trim();
        const website = String(row['Hjemmeside'] || row['website'] || row['Website'] || '').trim();
        const eduRaw = String(row['Uddannelseslinjer'] || row['education_lines'] || '').trim();
        const slots = parseInt(String(row['Praktikpladser'] || row['internship_slots'] || row['Antal pladser'] || '1'), 10) || 1;
        const description = String(row['Beskrivelse'] || row['description'] || '').trim();

        const errors: string[] = [];
        if (!name) errors.push('Mangler butiksnavn');
        if (!address) errors.push('Mangler adresse');
        if (!postalCode) errors.push('Mangler postnummer');

        return {
          name,
          address,
          postal_code: postalCode,
          city,
          phone: phone === 'undefined' ? '' : phone,
          email: email === 'undefined' ? '' : email,
          website: website === 'undefined' ? '' : website,
          education_lines: eduRaw,
          internship_slots: slots,
          description: description === 'undefined' ? '' : description,
          valid: errors.length === 0,
          error: errors.join(', '),
        };
      });

      setImportRows(parsed);
    };
    reader.readAsArrayBuffer(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function executeImport() {
    if (!selectedManagerId || !importChainId) return;
    setImporting(true);

    const supabase = createClient();
    const validRows = importRows.filter(r => r.valid);
    let success = 0;
    let failed = 0;

    for (const row of validRows) {
      const eduLines = parseEducationLines(row.education_lines);

      const { error } = await supabase.from('stores').insert({
        manager_id: selectedManagerId,
        chain_id: importChainId,
        name: row.name,
        address: row.address,
        city: row.city || DANISH_POSTAL_CODES[row.postal_code] || '',
        postal_code: row.postal_code,
        education_lines: eduLines,
        internship_slots: row.internship_slots,
        phone: row.phone || null,
        email: row.email || null,
        website: row.website || null,
        description: row.description || null,
        is_active: true,
      });

      if (error) {
        failed++;
      } else {
        success++;
      }
    }

    setImportResult({ success, failed });
    setImporting(false);

    if (success > 0) {
      fetchStores();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  const activeCount = storesData.filter(s => s.is_active).length;
  const totalSlots = storesData.reduce((sum, s) => sum + s.internship_slots, 0);
  const totalMatches = storesData.reduce((sum, s) => sum + s.matches, 0);

  const q = searchQuery.trim().toLowerCase();
  const ungroupedStores = storesData.filter(s => !s.chain_id);
  const filteredUngrouped = q
    ? ungroupedStores.filter(s => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.manager.toLowerCase().includes(q))
    : ungroupedStores;

  const filteredChains = chains
    .map(chain => {
      const filteredStores = q
        ? chain.stores.filter(s => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.manager.toLowerCase().includes(q) || chain.name.toLowerCase().includes(q))
        : chain.stores;
      return { ...chain, stores: filteredStores };
    })
    .filter(chain => chain.stores.length > 0);

  const validImportCount = importRows.filter(r => r.valid).length;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]"><span className="gradient-text">Butikker</span></h1>
        <p className="text-[var(--text-secondary)] mt-1">Oversigt over alle tilknyttede butikker og kæder</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Aktive butikker', value: activeCount, color: 'text-emerald-400' },
          { label: 'Praktik­pladser', value: totalSlots, color: 'text-blue-400' },
          { label: 'Matches', value: totalMatches, color: 'text-purple-400' },
        ].map(stat => (
          <motion.div key={stat.label} variants={itemVariants} className="p-3 sm:p-4 rounded-2xl glass-card glass-card-hover text-center min-w-0 overflow-hidden">
            <p className={`text-2xl font-extrabold tabular-nums ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 break-words">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Search + Import */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Søg efter butik, kæde, by eller ansvarlig..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 !rounded-xl"
          />
        </div>
        <button
          onClick={openImportModal}
          className="flex items-center gap-2 px-5 py-3 rounded-xl btn-gradient text-white text-sm font-medium shrink-0"
        >
          <Upload className="w-4 h-4" />
          Importér butikker
        </button>
      </motion.div>

      {storesData.length === 0 && chains.length === 0 ? (
        <div className="py-16 text-center">
          <StoreIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)]">Ingen butikker endnu</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Brug &quot;Importér butikker&quot; for at tilføje en hel kæde</p>
        </div>
      ) : (
        <>
          {/* Chain sections */}
          {filteredChains.map(chain => (
            <motion.div key={chain.id} variants={itemVariants} className="rounded-2xl glass-card overflow-hidden">
              <button
                onClick={() => toggleChain(chain.id)}
                className="w-full flex items-center gap-4 p-5 hover:bg-white/[0.04] transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {chain.logo_url ? (
                    <img src={chain.logo_url} alt={chain.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-5 h-5 text-purple-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-[var(--text-primary)] text-lg truncate">{chain.name}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {chain.stores.length} butik{chain.stores.length !== 1 ? 'ker' : ''} · {chain.totalSlots} pladser · {chain.totalMatches} matches
                  </p>
                </div>
                <div className="shrink-0 text-[var(--text-muted)]">
                  {expandedChains.has(chain.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </button>

              <AnimatePresence>
                {expandedChains.has(chain.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {chain.stores.map(store => (
                        <StoreCard key={store.id} store={store} onClick={() => openStoreDetail(store.id)} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {/* Ungrouped stores */}
          {filteredUngrouped.length > 0 && (
            <>
              {filteredChains.length > 0 && (
                <motion.div variants={itemVariants}>
                  <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)] mb-3">Øvrige butikker</h2>
                </motion.div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredUngrouped.map(store => (
                  <motion.div key={store.id} variants={itemVariants}>
                    <StoreCard store={store} onClick={() => openStoreDetail(store.id)} />
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {filteredChains.length === 0 && filteredUngrouped.length === 0 && q && (
            <div className="py-16 text-center">
              <p className="text-[var(--text-muted)]">Ingen butikker matcher din søgning</p>
            </div>
          )}
        </>
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
              className="absolute bottom-0 left-0 right-0 max-h-[90dvh] bg-[#0E0E18] rounded-t-3xl border-t border-white/10 overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 bg-[#0E0E18] flex justify-center py-3 rounded-t-3xl">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="px-6 pb-10">
                <div className="flex justify-end mb-2">
                  <button onClick={closeDetail} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-muted hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {storeLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  </div>
                ) : selectedStore ? (
                  <>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                        {selectedStore.logo_url ? (
                          <img src={selectedStore.logo_url} alt={selectedStore.name} className="w-full h-full object-cover" />
                        ) : (
                          <StoreIcon className="w-8 h-8 text-white" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl font-bold text-white truncate">{selectedStore.name}</h2>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${selectedStore.is_active ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'}`}>
                            {selectedStore.is_active ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </div>
                        {selectedStore.chain_name && (
                          <p className="text-purple-400 text-sm mt-0.5 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            {selectedStore.chain_name}
                          </p>
                        )}
                        <p className="text-text-secondary text-xs mt-0.5">
                          Oprettet {new Date(selectedStore.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

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
                        <p className="text-lg font-bold text-emerald-400">{selectedStore.matches}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">Matches</p>
                      </div>
                    </div>

                    {selectedStore.description && (
                      <div className="mb-5">
                        <h3 className="text-sm font-medium text-text-secondary mb-1.5">Beskrivelse</h3>
                        <div className="text-white text-sm bg-white/5 rounded-xl p-4 border border-white/5">
                          <p>{selectedStore.description}</p>
                        </div>
                      </div>
                    )}

                    <div className="mb-5">
                      <h3 className="text-sm font-medium text-text-secondary mb-1.5">Adresse</h3>
                      <div className="flex items-start gap-3 text-white text-sm bg-white/5 rounded-xl p-4 border border-white/5">
                        <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span>{selectedStore.address}, {selectedStore.postal_code} {selectedStore.city}</span>
                      </div>
                    </div>

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

                    <div className="mb-5">
                      <h3 className="text-sm font-medium text-text-secondary mb-1.5">Praktikpladser</h3>
                      <div className="flex items-center gap-3 text-white text-sm bg-white/5 rounded-xl p-4 border border-white/5">
                        <Briefcase className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>{selectedStore.internship_slots} {selectedStore.internship_slots === 1 ? 'plads' : 'pladser'} tilgængelig{selectedStore.internship_slots === 1 ? '' : 'e'}</span>
                      </div>
                    </div>

                    <div className="mb-5">
                      <h3 className="text-sm font-medium text-text-secondary mb-1.5">Ansvarlig</h3>
                      <div className="flex items-center gap-3 text-white text-sm bg-white/5 rounded-xl p-4 border border-white/5">
                        <Building2 className="w-4 h-4 text-purple-400 shrink-0" />
                        <span>{selectedStore.manager_name}</span>
                      </div>
                    </div>

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

                    <div className="mb-2">
                      <h3 className="text-sm font-medium text-text-secondary mb-2">Kontaktoplysninger</h3>
                      <div className="space-y-2">
                        {(selectedStore.phone || selectedStore.manager_phone) && (
                          <a
                            href={`tel:${selectedStore.phone || selectedStore.manager_phone}`}
                            className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
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

      {/* ── Import modal ── */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => !importing && setShowImportModal(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full sm:max-w-lg bg-[#0E0E18] rounded-t-3xl sm:rounded-3xl border border-white/10 max-h-[90dvh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 bg-[#0E0E18] rounded-t-3xl sm:rounded-t-3xl">
                <div className="flex justify-center py-3 sm:hidden">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>
                <div className="flex items-center justify-between px-6 pb-4 pt-2 sm:pt-6">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-purple-400" />
                      Importér butikker
                    </h2>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {importStep === 1 && 'Vælg eller opret en kæde'}
                      {importStep === 2 && 'Vælg ansvarlig butikschef'}
                      {importStep === 3 && 'Upload Excel-fil med butikker'}
                      {importStep === 4 && 'Bekræft og importér'}
                    </p>
                  </div>
                  {!importing && (
                    <button onClick={() => setShowImportModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-muted hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Step indicator */}
                <div className="flex items-center px-6 pb-4">
                  {[1, 2, 3, 4].map(step => (
                    <div key={step} className={`flex items-center ${step > 1 ? 'flex-1' : ''}`}>
                      {step > 1 && (
                        <div className={`h-px flex-1 mx-2 transition-colors ${step <= importStep ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-white/10'}`} />
                      )}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                          step <= importStep
                            ? `bg-gradient-to-br from-purple-500 to-blue-500 text-white ${step === importStep ? 'glow-violet' : ''}`
                            : 'bg-white/10 text-[var(--text-muted)]'
                        }`}
                      >
                        {step}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 pb-8">
                {/* Step 1: Chain selection */}
                {importStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-text-secondary block mb-2">Vælg eksisterende kæde</label>
                      <div className="space-y-2">
                        {chains.map(chain => (
                          <button
                            key={chain.id}
                            onClick={() => setImportChainId(chain.id)}
                            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                              importChainId === chain.id
                                ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                                : 'bg-white/5 border-white/10 text-[var(--text-secondary)] hover:bg-white/10'
                            }`}
                          >
                            <Building2 className="w-4 h-4 shrink-0" />
                            <span className="font-medium text-sm">{chain.name}</span>
                            <span className="text-xs ml-auto opacity-60">{chain.stores.length} butikker</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative flex items-center gap-3 py-2">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-xs text-text-muted">eller</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <div>
                      <label className="text-sm text-text-secondary block mb-2">Opret ny kæde</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newChainName}
                          onChange={e => setNewChainName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && createNewChain()}
                          placeholder="F.eks. Matas, Magasin, IKEA..."
                          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                        />
                        <button
                          onClick={createNewChain}
                          disabled={!newChainName.trim() || creatingChain}
                          className="px-4 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-40"
                        >
                          {creatingChain ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => setImportStep(2)}
                      disabled={!importChainId}
                      className="w-full py-3.5 rounded-xl btn-gradient text-white font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed mt-4"
                    >
                      Næste
                    </button>
                  </div>
                )}

                {/* Step 2: Manager selection */}
                {importStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-text-secondary block mb-2">
                        Vælg butikschef for de importerede butikker
                      </label>
                      {managers.length === 0 ? (
                        <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                          <AlertCircle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                          <p className="text-sm text-amber-300">Ingen butikschefer fundet</p>
                          <p className="text-xs text-text-muted mt-1">Der skal oprettes mindst én butikschefkonto først</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {managers.map(m => (
                            <button
                              key={m.id}
                              onClick={() => setSelectedManagerId(m.id)}
                              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                                selectedManagerId === m.id
                                  ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                                  : 'bg-white/5 border-white/10 text-[var(--text-secondary)] hover:bg-white/10'
                              }`}
                            >
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold shrink-0">
                                {m.full_name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{m.full_name}</p>
                                <p className="text-xs opacity-60 truncate">{m.email}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => setImportStep(1)}
                        className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 text-[var(--text-secondary)] font-medium text-sm hover:bg-white/10 transition-colors"
                      >
                        Tilbage
                      </button>
                      <button
                        onClick={() => setImportStep(3)}
                        disabled={!selectedManagerId}
                        className="flex-1 py-3.5 rounded-xl btn-gradient text-white font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Næste
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: File upload */}
                {importStep === 3 && (
                  <div className="space-y-4">
                    <button
                      onClick={downloadTemplate}
                      className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Download Excel-skabelon
                    </button>

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-purple-500/30 hover:bg-purple-500/5 transition-all cursor-pointer"
                    >
                      <Upload className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
                      <p className="text-sm text-[var(--text-secondary)]">Klik for at vælge en Excel-fil</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">.xlsx eller .xls</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    {importRows.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-text-secondary">
                            {importRows.length} rækker fundet · <span className="text-emerald-400">{validImportCount} gyldige</span>
                            {importRows.length - validImportCount > 0 && (
                              <> · <span className="text-rose-400">{importRows.length - validImportCount} fejl</span></>
                            )}
                          </p>
                        </div>
                        <div className="max-h-52 overflow-y-auto rounded-xl border border-white/10">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-white/5 text-text-muted">
                                <th className="px-3 py-2 text-left">Butiksnavn</th>
                                <th className="px-3 py-2 text-left">Adresse</th>
                                <th className="px-3 py-2 text-left">Postnr.</th>
                                <th className="px-3 py-2 text-left">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {importRows.map((row, i) => (
                                <tr key={i} className={`border-t border-white/5 ${row.valid ? '' : 'bg-rose-500/5'}`}>
                                  <td className="px-3 py-2 text-white truncate max-w-[120px]">{row.name || '—'}</td>
                                  <td className="px-3 py-2 text-text-secondary truncate max-w-[140px]">{row.address || '—'}</td>
                                  <td className="px-3 py-2 text-text-secondary">{row.postal_code || '—'}</td>
                                  <td className="px-3 py-2">
                                    {row.valid ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <span className="text-rose-400" title={row.error}>
                                        <AlertCircle className="w-3.5 h-3.5 inline" /> {row.error}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => setImportStep(2)}
                        className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 text-[var(--text-secondary)] font-medium text-sm hover:bg-white/10 transition-colors"
                      >
                        Tilbage
                      </button>
                      <button
                        onClick={() => setImportStep(4)}
                        disabled={validImportCount === 0}
                        className="flex-1 py-3.5 rounded-xl btn-gradient text-white font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Næste
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Confirm */}
                {importStep === 4 && !importResult && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">Kæde</span>
                        <span className="text-sm text-white font-medium">
                          {chains.find(c => c.id === importChainId)?.name || '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">Ansvarlig</span>
                        <span className="text-sm text-white font-medium">
                          {managers.find(m => m.id === selectedManagerId)?.full_name || '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">Butikker der oprettes</span>
                        <span className="text-sm text-emerald-400 font-bold">{validImportCount}</span>
                      </div>
                      {importRows.length - validImportCount > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text-secondary">Springes over (fejl)</span>
                          <span className="text-sm text-rose-400 font-medium">{importRows.length - validImportCount}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => setImportStep(3)}
                        disabled={importing}
                        className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 text-[var(--text-secondary)] font-medium text-sm hover:bg-white/10 transition-colors disabled:opacity-40"
                      >
                        Tilbage
                      </button>
                      <button
                        onClick={executeImport}
                        disabled={importing}
                        className="flex-1 py-3.5 rounded-xl btn-gradient-emerald text-white font-medium text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                      >
                        {importing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Importerer...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Importér {validImportCount} butikker
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Import result */}
                {importResult && (
                  <div className="space-y-4 text-center py-4">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                    <div>
                      <h3 className="text-lg font-bold text-white">Import fuldført</h3>
                      <p className="text-sm text-text-secondary mt-1">
                        <span className="text-emerald-400 font-semibold">{importResult.success}</span> butikker oprettet
                        {importResult.failed > 0 && (
                          <> · <span className="text-rose-400 font-semibold">{importResult.failed}</span> fejlede</>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowImportModal(false)}
                      className="w-full py-3.5 rounded-xl btn-gradient text-white font-medium text-sm"
                    >
                      Luk
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StoreCard({ store, onClick }: { store: StoreDisplay; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`group relative p-5 rounded-2xl glass-card glass-card-hover cursor-pointer ${store.is_active ? '' : '!border-rose-500/10 opacity-60'}`}
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
        <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${store.is_active ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'}`}>
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
          <p className="text-sm font-bold text-emerald-400">{store.matches}</p>
          <p className="text-[10px] text-[var(--text-muted)] truncate">Matches</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardStores() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60dvh]">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      }
    >
      <StoresContent />
    </Suspense>
  );
}
