'use client';

import { motion } from 'framer-motion';
import { MapPin, Users, ExternalLink, Package, ArrowUpRight } from 'lucide-react';

const storesData = [
  { id: '1', name: 'Magasin du Nord', city: 'København', address: 'Kongens Nytorv 13', postal_code: '1095', education_lines: ['Detail', 'Handel & Salg'], internship_slots: 3, active_slots: 1, matches: 12, swipes_received: 78, manager: 'Lars Eriksen', is_active: true },
  { id: '2', name: 'Matas Strøget', city: 'København', address: 'Strøget 24', postal_code: '1160', education_lines: ['Detail'], internship_slots: 2, active_slots: 2, matches: 9, swipes_received: 65, manager: 'Anne Sørensen', is_active: true },
  { id: '3', name: 'IKEA Gentofte', city: 'Gentofte', address: 'Ørnegårdsvej 6', postal_code: '2820', education_lines: ['Detail', 'Handel & Logistik'], internship_slots: 5, active_slots: 3, matches: 7, swipes_received: 52, manager: 'Peter Olsen', is_active: true },
  { id: '4', name: 'Normal Østerbro', city: 'København', address: 'Østerbrogade 62', postal_code: '2100', education_lines: ['Detail'], internship_slots: 1, active_slots: 0, matches: 6, swipes_received: 48, manager: 'Maja Thomsen', is_active: true },
  { id: '5', name: 'Flying Tiger', city: 'Frederiksberg', address: 'Falkoner Allé 21', postal_code: '2000', education_lines: ['Detail', 'Kontoradministration'], internship_slots: 2, active_slots: 1, matches: 5, swipes_received: 41, manager: 'Jonas Christensen', is_active: true },
  { id: '6', name: 'Elgiganten Glostrup', city: 'Glostrup', address: 'Hovedvejen 112', postal_code: '2600', education_lines: ['Detail', 'Handel & Salg'], internship_slots: 4, active_slots: 4, matches: 0, swipes_received: 15, manager: 'Mikkel Hansen', is_active: false },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export default function DashboardStores() {
  const activeCount = storesData.filter(s => s.is_active).length;
  const totalSlots = storesData.reduce((sum, s) => sum + s.internship_slots, 0);
  const filledSlots = storesData.reduce((sum, s) => sum + (s.internship_slots - s.active_slots), 0);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">Butikker</h1>
        <p className="text-[var(--text-secondary)] mt-1">Oversigt over alle tilknyttede butikker</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Aktive butikker', value: activeCount, color: 'text-green-400' },
          { label: 'Praktikpladser', value: totalSlots, color: 'text-blue-400' },
          { label: 'Besat', value: filledSlots, color: 'text-purple-400' },
        ].map(stat => (
          <motion.div key={stat.label} variants={itemVariants} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
            <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Store Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {storesData.map(store => (
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
    </motion.div>
  );
}
