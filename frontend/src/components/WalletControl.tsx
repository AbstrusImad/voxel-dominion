'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, LogOut, Wallet } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { WalletState } from '@/hooks/useWallet';
import { Copyable } from './Copyable';
import { shortAddress } from '@/lib/format';

export interface WalletControlProps {
  wallet: WalletState;
}

export function WalletControl({ wallet }: WalletControlProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  if (!wallet.address) {
    return (
      <button
        type="button"
        onClick={wallet.connect}
        disabled={wallet.connecting}
        className="hud-clip inline-flex min-h-[40px] items-center gap-2 bg-accent px-4 text-sm font-semibold text-void transition-transform hover:scale-[1.03] disabled:opacity-60"
      >
        <Wallet size={15} aria-hidden />
        {wallet.connecting ? 'Connecting' : 'Connect'}
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="hud-clip inline-flex min-h-[40px] items-center gap-2 border border-[var(--hairline-strong)] bg-surface2 px-3 text-sm text-text transition-colors hover:border-accent2"
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: wallet.onChain ? 'var(--success)' : 'var(--danger)' }}
          aria-hidden
        />
        <span className="font-mono text-xs tabular">{shortAddress(wallet.address)}</span>
        <ChevronDown size={14} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="panel frame absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-lg p-4"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-faint">Commander</p>
            <div className="mt-1.5">
              <Copyable
                value={wallet.address}
                display={wallet.address}
                className="block break-all text-left leading-relaxed"
                label="Copy full address"
              />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[var(--hairline)] pt-3">
              <span className="text-xs text-muted">Balance</span>
              <span className="font-mono text-xs tabular text-text">
                {wallet.balance ?? '0'} GEN
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-xs text-muted">Network</span>
              <span
                className="font-mono text-xs"
                style={{ color: wallet.onChain ? 'var(--success)' : 'var(--danger)' }}
              >
                {wallet.onChain ? 'Bradbury 4221' : 'Wrong chain'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                wallet.disconnect();
                setOpen(false);
              }}
              className="mt-4 inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-md border border-[var(--hairline-strong)] text-sm text-muted transition-colors hover:border-danger hover:text-danger"
            >
              <LogOut size={14} aria-hidden />
              Disconnect
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
