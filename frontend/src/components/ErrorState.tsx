'use client';

import { ExternalLink, RotateCcw, Unplug } from 'lucide-react';
import { CONTRACT_ADDRESS, EXPLORER } from '@/lib/contract';

export interface ErrorStateProps {
  message: string;
  diagnostic?: boolean;
  onRetry: () => void;
  compact?: boolean;
}

export function ErrorState({ message, diagnostic, onRetry, compact }: ErrorStateProps) {
  return (
    <div
      className={`panel frame mx-auto rounded-xl p-6 text-center ${compact ? 'max-w-md' : 'max-w-lg p-8'}`}
      role="alert"
    >
      <Unplug size={compact ? 24 : 30} className="mx-auto text-danger" aria-hidden />
      <h3 className="mt-4 font-display text-xl font-semibold text-text sm:text-2xl">
        The signal is lost
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p>
      {diagnostic && (
        <p className="mt-3 break-all rounded-md border border-[rgba(255,84,112,0.3)] bg-[rgba(255,84,112,0.08)] px-3 py-2 font-mono text-xs text-danger">
          Configured address: {CONTRACT_ADDRESS}
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-[var(--hairline-strong)] px-5 text-sm font-semibold text-accent2 transition-colors hover:bg-[rgba(61,240,224,0.1)]"
        >
          <RotateCcw size={15} aria-hidden />
          Retry
        </button>
        <a
          href={`${EXPLORER}/address/${CONTRACT_ADDRESS}`}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-muted hover:text-text hover:underline"
        >
          Explorer
          <ExternalLink size={13} aria-hidden />
        </a>
      </div>
    </div>
  );
}
