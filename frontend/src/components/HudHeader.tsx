'use client';

import { motion } from 'framer-motion';
import { WalletState } from '@/hooks/useWallet';
import { Era } from '@/lib/contract';
import { WalletControl } from './WalletControl';

export interface HudHeaderProps {
  wallet: WalletState;
  era: Era | null;
}

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const roman = (n: number) => ROMAN[n] ?? String(n);

export function HudHeader({ wallet, era }: HudHeaderProps) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex items-start justify-between p-3 sm:p-5">
      {/* top-left cluster */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="pointer-events-auto"
      >
        <div className="hud-clip-l panel frame px-3 py-2 sm:px-4 sm:py-2.5">
          <div className="flex items-center gap-2">
            <span className="block h-4 w-4 rotate-45 bg-accent shadow-[0_0_12px_rgba(255,122,24,0.7)]" aria-hidden />
            <span className="font-display text-base font-bold tracking-[0.18em] text-text sm:text-lg">
              VOXEL DOMINION
            </span>
          </div>
          {era && (
            <p className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-accent2 sm:text-xs">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent2 pulse-soft" aria-hidden />
              Era {roman(era.era)}: {era.name}
            </p>
          )}
        </div>
      </motion.div>

      {/* top-right cluster */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="pointer-events-auto flex items-center gap-2 sm:gap-3"
      >
        <div className="hud-clip hidden items-center gap-2 border border-[var(--hairline)] bg-surface2/80 px-3 py-2 sm:flex">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: wallet.onChain ? 'var(--success)' : 'var(--faint)' }}
            aria-hidden
          />
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
            {wallet.onChain ? 'Chain 4221' : 'Offline'}
          </span>
        </div>
        <WalletControl wallet={wallet} />
      </motion.div>
    </header>
  );
}
