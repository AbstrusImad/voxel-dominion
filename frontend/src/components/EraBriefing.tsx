'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowUpCircle, Hourglass, Scale, Sparkles } from 'lucide-react';
import { Era, Stats } from '@/lib/contract';
import { ConfirmDialog } from './ConfirmDialog';

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const roman = (n: number) => ROMAN[n] ?? String(n);

const ERA_TARGET = 6; // captures that ripen an age before it can turn

export interface EraBriefingProps {
  era: Era | null;
  stats: Stats | null;
  connected: boolean;
  advancing: boolean;
  onAdvance: () => void;
}

export function EraBriefing({ era, stats, connected, advancing, onAdvance }: EraBriefingProps) {
  const [confirm, setConfirm] = useState(false);
  const captures = era?.eraCaptures ?? stats?.eraCaptures ?? 0;
  const pct = Math.min(100, Math.round((captures / ERA_TARGET) * 100));

  return (
    <section aria-label="Current era" className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.55 }}
        className="panel frame scanlines relative overflow-hidden rounded-2xl p-6 sm:p-8"
      >
        <span className="absolute inset-y-0 left-0 w-1.5 bg-accent2" aria-hidden />
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-faint">
              <Hourglass size={13} aria-hidden />
              The living age
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-text sm:text-4xl">
              {era ? (
                <>
                  Era {roman(era.era)}
                  <span className="text-accent2">: {era.name}</span>
                </>
              ) : (
                'Reading the age'
              )}
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-[var(--hairline)] bg-surface/60 p-4">
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-faint">
                  <Scale size={12} aria-hidden /> Rewards
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-text">
                  {era?.rule || 'The World Spirit weighs each claim against the age.'}
                </p>
              </div>
              <div className="rounded-lg border border-[var(--hairline)] bg-surface/60 p-4">
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-faint">
                  <Sparkles size={12} aria-hidden /> Favors
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-text">
                  {era?.favors || 'Builders who read the mood of the world.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-end justify-between">
                <p className="text-[11px] uppercase tracking-[0.2em] text-faint">Age maturity</p>
                <p className="font-mono text-sm tabular text-accent2">
                  {captures}
                  <span className="text-faint"> / {ERA_TARGET} captures</span>
                </p>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface2">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-accent2"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                When the age turns, erosion weakens every standing claim. Hold nothing for granted.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setConfirm(true)}
                disabled={!connected || advancing}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-[var(--hairline-strong)] bg-surface2 px-5 text-sm font-semibold text-text transition-colors hover:border-accent2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <ArrowUpCircle size={16} aria-hidden />
                {advancing ? 'Turning the age' : 'Advance the age'}
              </button>
              {!connected && (
                <p className="mt-2 text-xs text-faint">Connect a wallet to turn the age.</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <ConfirmDialog
        open={confirm}
        title="Turn the age?"
        message="Advancing the age moves the world into its next era and erodes every standing claim across the map. This submits a transaction on Bradbury Testnet. Network fees apply. Continue?"
        confirmLabel="Turn the age"
        accent="var(--accent-2)"
        onConfirm={() => {
          setConfirm(false);
          onAdvance();
        }}
        onCancel={() => setConfirm(false)}
      />
    </section>
  );
}
