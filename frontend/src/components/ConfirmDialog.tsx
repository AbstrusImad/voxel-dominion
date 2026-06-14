'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { ExternalLink, ShieldAlert } from 'lucide-react';
import { FAUCET } from '@/lib/contract';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  accent?: string;
  showFaucet?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  accent = 'var(--accent)',
  showFaucet = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[130] flex items-end justify-center p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-[rgba(5,6,10,0.8)] backdrop-blur-sm"
            onClick={onCancel}
            aria-hidden
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            initial={{ scale: 0.94, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="panel frame relative w-full max-w-md rounded-t-2xl p-6 sm:rounded-xl"
          >
            <div className="flex items-start gap-3">
              <ShieldAlert size={22} style={{ color: accent }} aria-hidden />
              <div>
                <h3 className="font-display text-2xl font-semibold text-text">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p>
                {showFaucet && (
                  <a
                    href={FAUCET}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-accent2 hover:underline"
                  >
                    Open the testnet faucet
                    <ExternalLink size={11} aria-hidden />
                  </a>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="min-h-[44px] rounded-md border border-[var(--hairline-strong)] px-4 text-sm text-muted transition-colors hover:text-text"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="min-h-[44px] rounded-md px-5 text-sm font-semibold text-void transition-transform hover:scale-[1.02]"
                style={{ background: accent }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
