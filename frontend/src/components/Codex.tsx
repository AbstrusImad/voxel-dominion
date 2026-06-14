'use client';

import { motion } from 'framer-motion';
import { BookOpen, ExternalLink } from 'lucide-react';
import { FAUCET } from '@/lib/contract';

const ENTRIES: { n: string; title: string; body: string }[] = [
  {
    n: '01',
    title: 'Raise a structure',
    body: 'Open the Foundry and place voxels block by block. Every coordinate from 0 to 15, every one of the eight materials, is yours to command. Three blocks is the minimum, two hundred fifty-six the limit.',
  },
  {
    n: '02',
    title: 'The World Spirit judges fit to the age',
    body: 'Submit your work against a parcel. An on-chain AI weighs the structure against the living era, the rule it rewards and the form it favors, and returns a verdict: Masterwork, Worthy, Weak, or Reject, with a score.',
  },
  {
    n: '03',
    title: 'Beat the standing score to capture',
    body: 'A claim is seized when the verdict is Worthy or Masterwork, the score is at least fifty, and it exceeds the parcel current score. Fall short and the holder keeps the ground.',
  },
  {
    n: '04',
    title: 'Ages turn and erode claims',
    body: 'As captures accumulate the age matures. Anyone may turn it. When it turns, the rule changes and erosion weakens every standing claim, opening the map to fresh conquest.',
  },
  {
    n: '05',
    title: 'Consensus rules every verdict',
    body: 'A leader drafts the judgment, then validators independently re-run it. They compare the verdict exactly and the score within tolerance. Only a ruling that survives consensus is written to the chain.',
  },
  {
    n: '06',
    title: 'You pay only network fees',
    body: 'There is no entry price and no stake. Each transaction costs ordinary Bradbury Testnet fees, most of which are refunded. Claim test GEN from the faucet to begin.',
  },
];

export function Codex() {
  return (
    <section id="codex" aria-label="Field manual" className="relative mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-accent">
          <BookOpen size={13} aria-hidden /> Codex
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold text-text sm:text-4xl">Field manual</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          How the world turns, from the first voxel to the falling of an age.
        </p>
      </motion.div>

      <div className="panel frame divide-y divide-[var(--hairline)] overflow-hidden rounded-2xl">
        {ENTRIES.map((e, i) => (
          <motion.div
            key={e.n}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3) }}
            className="flex gap-5 p-5 sm:p-6"
          >
            <span className="font-display text-2xl font-bold tabular text-accent2/70">{e.n}</span>
            <div>
              <h3 className="font-display text-lg font-semibold text-text">{e.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{e.body}</p>
              {e.n === '06' && (
                <a
                  href={FAUCET}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-accent2 px-3 py-2 text-xs font-bold text-void transition-transform hover:scale-[1.03]"
                >
                  Open the testnet faucet
                  <ExternalLink size={12} aria-hidden />
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
