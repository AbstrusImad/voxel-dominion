'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { ArrowDown } from 'lucide-react';
import { CONTRACT_ADDRESS } from '@/lib/contract';
import { shortAddress, isClaimed } from '@/lib/format';
import { WalletState } from '@/hooks/useWallet';

// The WebGL hero loads client-side only; static export must not try to render
// a canvas during prerender.
const HeroScene = dynamic(() => import('./HeroScene'), {
  ssr: false,
  loading: () => <div className="absolute inset-0" aria-hidden />,
});

export interface HeroProps {
  wallet: WalletState;
  onEnter: () => void;
}

export function Hero({ wallet, onEnter }: HeroProps) {
  const contractLive = isClaimed(CONTRACT_ADDRESS);
  return (
    <section className="relative h-[100svh] min-h-[620px] w-full overflow-hidden" aria-label="Voxel Dominion">
      <div className="absolute inset-0">
        <HeroScene />
      </div>

      {/* gradient floor to seat the title block */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 0%, transparent 40%, rgba(5,6,10,0.55) 100%), linear-gradient(180deg, transparent 45%, rgba(5,6,10,0.92) 100%)',
        }}
        aria-hidden
      />

      {/* offset title block bottom-left */}
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-10 lg:p-14">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-2xl"
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="hud-clip inline-flex items-center gap-1.5 border border-[var(--hairline)] bg-surface2/70 px-2.5 py-1 font-mono text-[11px] text-muted">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: wallet.onChain ? 'var(--success)' : 'var(--accent2)' }}
                aria-hidden
              />
              Live on Bradbury Testnet
            </span>
            <span className="hud-clip inline-flex items-center gap-1.5 border border-[var(--hairline)] bg-surface2/70 px-2.5 py-1 font-mono text-[11px] text-muted">
              {contractLive ? shortAddress(CONTRACT_ADDRESS, 5) : 'awaiting deployment'}
            </span>
          </div>
          <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight text-text text-shadow-deep sm:text-7xl lg:text-8xl">
            VOXEL
            <br />
            <span className="text-accent">DOMINION</span>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            Raise structures. Let the World Spirit judge them. Seize the map.
          </p>
          <button
            type="button"
            onClick={onEnter}
            className="mt-6 inline-flex min-h-[52px] items-center gap-2.5 bg-accent px-7 text-base font-semibold text-void transition-transform hover:scale-[1.03]"
          >
            Enter the war
            <ArrowDown size={18} aria-hidden />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
