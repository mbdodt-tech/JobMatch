'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, Users, Loader2, Search } from 'lucide-react';
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

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Aktive butikker', value: activeCount, color: 'text-green-400' },
          { label: 'Praktikpladser', value: totalSlots, color: 'text-blue-400' },
          { label: 'Matches', value: totalMatches, color: 'text-purple-400' },
        ].map(stat => (
          <motion.div key={stat.label} variants={itemVariants} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
            <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{stat.label}</p>
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
            <motion.div key={store.id} variants={itemVariants} className={`group relative p-5 rounded-2xl bg-white/5 backdrop-blur-xl border hover:border-white/20 transition-all ${store.is_active ? 'border-white/10' : 'border-red-500/10 opacity-60'}`}>
              {store.is_active && <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 opacity-50 rounded-t-2xl" />}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] text-lg">{store.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[var(--text-secondary)]">
                    <MapPin size={12} /> {store.address}, {store.postal_code} {store.city}
                  </div>
                </div>
                <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${store.is_active ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'}`}>
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
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/5">
                <div className="text-center">
                  <p className="text-sm font-bold text-[var(--text-primary)]">{store.internship_slots}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Pladser</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-blue-400">{store.swipes_received}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Swipes</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-green-400">{store.matches}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Matches</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
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
