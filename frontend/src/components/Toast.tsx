'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, ExternalLink, Info, Loader2, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { EXPLORER } from '@/lib/contract';

export type ToastKind = 'loading' | 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
  hash?: string;
  onRetry?: () => void;
}

const ICONS = {
  loading: Loader2,
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
} as const;

const ACCENT: Record<ToastKind, string> = {
  loading: 'var(--accent-2)',
  success: 'var(--success)',
  error: 'var(--danger)',
  info: 'var(--muted)',
};

export interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-[min(94vw,360px)] flex-col gap-2.5">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = ICONS[t.kind];
          const accent = ACCENT[t.kind];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              className="panel frame pointer-events-auto relative overflow-hidden rounded-lg p-3.5"
              role={t.kind === 'error' ? 'alert' : 'status'}
            >
              <span
                className="absolute inset-y-0 left-0 w-1"
                style={{ background: accent }}
                aria-hidden
              />
              <div className="flex items-start gap-2.5 pl-1.5">
                <Icon
                  size={16}
                  className={t.kind === 'loading' ? 'mt-0.5 animate-spin' : 'mt-0.5'}
                  style={{ color: accent }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text">{t.title}</p>
                  {t.message && (
                    <p className="mt-0.5 break-words text-xs leading-relaxed text-muted">
                      {t.message}
                    </p>
                  )}
                  {t.hash && (
                    <a
                      href={`${EXPLORER}/tx/${t.hash}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-1.5 inline-flex items-center gap-1 font-mono text-[11px] text-accent2 hover:underline"
                    >
                      View on explorer
                      <ExternalLink size={11} aria-hidden />
                    </a>
                  )}
                  {t.onRetry && (
                    <button
                      type="button"
                      onClick={t.onRetry}
                      className="mt-2 rounded border border-[var(--hairline-strong)] px-2.5 py-1 text-[11px] uppercase tracking-wider text-accent2 transition-colors hover:bg-[rgba(61,240,224,0.1)]"
                    >
                      Retry
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onDismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="text-muted transition-colors hover:text-text"
                >
                  <X size={15} aria-hidden />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ---- toast controller hook ----------------------------------------------

export interface ToastController {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, 'id'> & { id?: string }) => string;
  update: (id: string, patch: Partial<ToastItem>) => void;
  dismiss: (id: string) => void;
}

export function useToasts(): ToastController {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<ToastItem, 'id'> & { id?: string }) => {
      counter.current += 1;
      const id = t.id ?? `t${counter.current}-${Date.now()}`;
      setToasts((prev) => {
        const next = prev.filter((p) => p.id !== id);
        return [...next, { ...t, id }];
      });
      if (t.kind === 'info' || t.kind === 'success') {
        window.setTimeout(() => dismiss(id), 8000);
      }
      return id;
    },
    [dismiss],
  );

  const update = useCallback(
    (id: string, patch: Partial<ToastItem>) => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      if (patch.kind === 'info' || patch.kind === 'success') {
        window.setTimeout(() => dismiss(id), 8000);
      }
    },
    [dismiss],
  );

  return { toasts, push, update, dismiss };
}
