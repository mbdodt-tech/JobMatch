'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, GraduationCap, MapPin, Search } from 'lucide-react';
import { getChain } from '@/lib/data/inspiration-chains';
import ChainWordmark from '@/components/student/ChainWordmark';

export default function ChainPage() {
  const params = useParams<{ chainId: string }>();
  const chain = getChain(params.chainId);
  const [query, setQuery] = useState('');

  const jobs = useMemo(() => {
    if (!chain) return [];
    const q = query.trim().toLowerCase();
    if (!q) return chain.jobs;
    return chain.jobs.filter((j) =>
      `${j.role} ${j.city} ${j.education}`.toLowerCase().includes(q)
    );
  }, [chain, query]);

  if (!chain) {
    return (
      <div className="max-w-md mx-auto px-4 pt-24 text-center">
        <p className="text-[#6E6759]">Virksomheden blev ikke fundet.</p>
        <Link
          href="/student/inspiration"
          className="mt-4 inline-block font-semibold text-[#0B6B60]"
        >
          Tilbage til Inspiration
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div
        className="relative flex min-h-[210px] flex-col justify-end"
        style={{
          background: chain.heroImage
            ? undefined
            : `linear-gradient(130deg, ${chain.dark} 0%, ${chain.primary} 100%)`,
        }}
      >
        {chain.heroImage && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={chain.heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 card-scrim" />
        <Link
          href="/student/inspiration"
          aria-label="Tilbage til Inspiration"
          className="absolute left-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 varm-card-shadow"
          style={{ top: 'calc(1rem + env(safe-area-inset-top, 0px))' }}
        >
          <ArrowLeft size={18} className="text-[#211F1A]" />
        </Link>
        <div className="relative px-5 pb-5 pt-16">
          <ChainWordmark chainId={chain.id} name={chain.name} size="lg" />
          <p className="mt-1.5 text-[13px] italic text-white/95">{chain.tagline}</p>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8471]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Søg i ${chain.name} elevpladser…`}
            className="w-full rounded-2xl border border-[#EAE4D8] bg-[#FAF7F1] py-4 pl-11 pr-4 text-base focus:border-[#0E8578] focus:ring-2 focus:ring-[#0E8578]/30"
          />
        </div>
        <p className="px-1 pt-2 text-xs text-[#8B8471]">
          {jobs.length} {jobs.length === 1 ? 'elevplads' : 'elevpladser'}
        </p>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-6 pt-2">
        {jobs.map((job, i) => (
          <motion.div
            key={`${job.role}-${job.city}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-[#EAE4D8] bg-white p-4 varm-card-shadow"
          >
            <h2 className="text-[15px] font-bold">{job.role}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF7F1] border border-[#EAE4D8] px-2.5 py-1 text-xs font-medium text-[#6E6759]">
                <MapPin size={12} aria-hidden="true" /> {job.city}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF7F1] border border-[#EAE4D8] px-2.5 py-1 text-xs font-medium text-[#6E6759]">
                <GraduationCap size={12} aria-hidden="true" /> {job.education}
              </span>
              <span className="inline-flex items-center rounded-full bg-[#E1F2EF] border border-[#C4E4DE] px-2.5 py-1 text-xs font-semibold text-[#0B6B60]">
                Start: {job.start}
              </span>
            </div>
            <button
              type="button"
              className="mt-3 rounded-xl px-4 py-2.5 text-sm font-bold text-white active:scale-[0.98] transition-transform"
              style={{ background: chain.primary }}
            >
              Søg elevplads
            </button>
          </motion.div>
        ))}
        {jobs.length === 0 && (
          <p className="py-8 text-center text-sm text-[#8B8471]">
            Ingen elevpladser matcher din søgning.
          </p>
        )}
      </div>
    </div>
  );
}
