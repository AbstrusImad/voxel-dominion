'use client';

import { motion } from 'framer-motion';
import { ScrollText, Swords } from 'lucide-react';
import { ChronicleEntry } from '@/lib/contract';
import { shortAddress, verdictMeta } from '@/lib/format';
import { ErrorState } from './ErrorState';
import { Skeleton } from './Skeleton';

export interface ChronicleProps {
  entries: ChronicleEntry[];
  loading: boolean;
  error: string | null;
  diagnostic: boolean;
  onRetry: () => void;
}

export function Chronicle({ entries, loading, error, diagnostic, onRetry }: ChronicleProps) {
  return (
    <section id="chronicle" aria-label="Chronicle of events" className="relative mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-accent2">
          <ScrollText size={13} aria-hidden /> Chronicle
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold text-text sm:text-4xl">
          Every ruling the World Spirit has spoken
        </h2>
      </motion.div>

      {error ? (
        <ErrorState message={error} diagnostic={diagnostic} onRetry={onRetry} />
      ) : loading && entries.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="panel frame rounded-2xl p-10 text-center">
          <Swords size={28} className="mx-auto text-faint" aria-hidden />
          <p className="mt-3 font-display text-xl text-text">The chronicle is silent</p>
          <p className="mt-1 text-sm text-muted">
            No structure has yet been laid before the World Spirit. The first ruling will be
            inscribed here for all to read.
          </p>
        </div>
      ) : (
        <ol className="relative space-y-3 border-l border-[var(--hairline)] pl-5">
          {entries.map((e, i) => {
            const meta = verdictMeta(e.verdict);
            const isEra = e.verdict === 'ERA';
            return (
              <motion.li
                key={`${e.parcel}-${i}`}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.3) }}
                className="relative"
              >
                <span
                  className="absolute -left-[27px] top-2 h-3 w-3 rounded-full border-2"
                  style={{ borderColor: meta.color, background: 'var(--void)' }}
                  aria-hidden
                />
                <div
                  className="panel rounded-xl border p-4"
                  style={{
                    borderColor: isEra ? 'rgba(155,107,255,0.4)' : 'var(--hairline)',
                    background: isEra ? 'rgba(155,107,255,0.06)' : undefined,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: meta.color, background: meta.bg }}
                    >
                      {meta.label}
                    </span>
                    <span className="flex items-center gap-2 font-mono text-[10px] text-faint">
                      <span>{e.parcel}</span>
                      {!isEra && (
                        <span style={{ color: e.captured ? 'var(--success)' : 'var(--faint)' }}>
                          {e.captured ? 'captured' : 'held off'}
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="mt-2 font-display text-lg font-semibold text-text">
                    {e.title || (isEra ? 'The age has turned' : 'Untitled work')}
                  </p>
                  {e.note && <p className="mt-1 text-sm leading-relaxed text-muted">{e.note}</p>}
                  <div className="mt-2 flex items-center justify-between text-[11px] text-faint">
                    <span className="font-mono">{e.builder ? shortAddress(e.builder) : 'the world'}</span>
                    {!isEra && (
                      <span className="font-mono tabular" style={{ color: meta.color }}>
                        score {e.score}
                      </span>
                    )}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
