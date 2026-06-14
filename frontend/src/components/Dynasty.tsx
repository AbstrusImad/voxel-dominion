'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Crown, Flag } from 'lucide-react';
import { Parcel } from '@/lib/contract';
import { factionColor, isClaimed, sameAddress, shortAddress } from '@/lib/format';
import { Copyable } from './Copyable';
import { ErrorState } from './ErrorState';
import { Skeleton } from './Skeleton';

export interface DynastyProps {
  parcels: Parcel[];
  walletAddress: string | null;
  loading: boolean;
  error: string | null;
  diagnostic: boolean;
  onRetry: () => void;
}

interface Faction {
  owner: string;
  held: number;
  score: number;
}

export function Dynasty({ parcels, walletAddress, loading, error, diagnostic, onRetry }: DynastyProps) {
  const factions = useMemo(() => {
    const m = new Map<string, Faction>();
    for (const p of parcels) {
      if (!isClaimed(p.owner)) continue;
      const key = p.owner.toLowerCase();
      const f = m.get(key) ?? { owner: p.owner, held: 0, score: 0 };
      f.held += 1;
      f.score += p.score;
      m.set(key, f);
    }
    return Array.from(m.values()).sort((a, b) => b.held - a.held || b.score - a.score);
  }, [parcels]);

  return (
    <section id="dynasty" aria-label="Dynasty standings" className="relative mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-accent">
          <Crown size={13} aria-hidden /> Dynasty
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold text-text sm:text-4xl">
          The banners that rule the map
        </h2>
      </motion.div>

      {error ? (
        <ErrorState message={error} diagnostic={diagnostic} onRetry={onRetry} />
      ) : loading && parcels.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : factions.length === 0 ? (
        <div className="panel frame rounded-2xl p-10 text-center">
          <Flag size={28} className="mx-auto text-faint" aria-hidden />
          <p className="mt-3 font-display text-xl text-text">The map lies fallow</p>
          <p className="mt-1 text-sm text-muted">
            No banner has been planted. Raise the first structure that the World Spirit deems
            worthy, and the dominion is yours to name.
          </p>
        </div>
      ) : (
        <div className="panel frame overflow-hidden rounded-2xl">
          {factions.map((f, i) => {
            const color = factionColor(f.owner);
            const mine = sameAddress(f.owner, walletAddress);
            return (
              <motion.div
                key={f.owner}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3) }}
                className="flex items-center gap-4 border-b border-[var(--hairline)] px-4 py-3.5 last:border-0 sm:px-6"
                style={{ background: mine ? 'rgba(255,122,24,0.06)' : 'transparent' }}
              >
                <span className="w-6 text-center font-mono text-sm font-bold tabular text-faint">
                  {i + 1}
                </span>
                <span
                  className="h-8 w-8 shrink-0 rounded-md"
                  style={{ background: color, boxShadow: `0 0 14px ${color}55` }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Copyable value={f.owner} display={shortAddress(f.owner, 6)} />
                    {mine && (
                      <span className="rounded border border-accent/40 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-accent">
                        You
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-base font-bold tabular text-text">{f.held}</p>
                  <p className="text-[10px] uppercase tracking-wider text-faint">parcels</p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="font-mono text-base font-bold tabular" style={{ color }}>
                    {f.score}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-faint">score</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
