'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { INSPIRATION_CHAINS } from '@/lib/data/inspiration-chains';
import ChainWordmark from '@/components/student/ChainWordmark';

export default function InspirationPage() {
  return (
    <div className="max-w-md mx-auto px-4 pt-14">
      <header className="px-1 pb-4">
        <h1 className="text-2xl font-extrabold">Inspiration</h1>
        <p className="text-sm text-[#6E6759] mt-1">
          Udforsk kæderne – tryk på en virksomhed og se deres elevpladser
        </p>
      </header>

      <div className="columns-2 gap-2.5 pb-6">
        {INSPIRATION_CHAINS.map((chain, i) => (
          <motion.div
            key={chain.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="mb-2.5 break-inside-avoid"
          >
            <Link
              href={`/student/inspiration/${chain.id}`}
              aria-label={`Åbn ${chain.name}`}
              className="relative block w-full overflow-hidden rounded-2xl border border-[#EAE4D8] varm-card-shadow active:scale-[0.97] transition-transform"
              style={{
                height: chain.tileHeight,
                background: chain.tileImage
                  ? undefined
                  : `linear-gradient(135deg, ${chain.dark} 0%, ${chain.primary} 100%)`,
              }}
            >
              {chain.tileImage && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={chain.tileImage}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 card-scrim" />
              <div className="absolute bottom-2.5 left-3 right-2 min-w-0">
                <ChainWordmark chainId={chain.id} name={chain.name} size="sm" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
