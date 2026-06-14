'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, CircleDot, ExternalLink, Loader2, X } from 'lucide-react';
import { EXPLORER } from '@/lib/contract';
import { TxState } from '@/hooks/useTransaction';
import { verdictMeta } from '@/lib/format';

const STAGES = [
  { key: 'cast', label: 'Submission cast', detail: 'Your structure is sent to the World Spirit.' },
  { key: 'draft', label: 'Leader drafts the verdict', detail: 'A leader weighs the work against the age.' },
  {
    key: 'validate',
    label: 'Validators re-run the judgment',
    detail: 'Independent nodes repeat the ruling and compare.',
  },
  { key: 'seal', label: 'Consensus seals the ruling', detail: 'The verdict is written to the chain.' },
];

function stageIndex(state: TxState): number {
  if (state.phase === 'wallet') return 0;
  if (state.phase === 'confirmed') return 3;
  const s = state.liveStatus;
  if (s === 'ACCEPTED' || s === 'FINALIZED') return 3;
  if (s === 'COMMITTING' || s === 'REVEALING') return 2;
  if (s === 'PROPOSING') return 1;
  return 1; // PENDING and the rest sit at the leader draft stage
}

const isTimeout = (s: string) => s === 'LEADER_TIMEOUT' || s === 'VALIDATORS_TIMEOUT';

export interface ConsensusTheaterProps {
  open: boolean;
  state: TxState;
  captured: boolean | null;
  onClose: () => void;
  onRetry: () => void;
}

export function ConsensusTheater({ open, state, captured, onClose, onRetry }: ConsensusTheaterProps) {
  const active = stageIndex(state);
  const timeout = isTimeout(state.liveStatus);
  const done = state.phase === 'confirmed';
  const errored = state.phase === 'error';
  const draft = state.draft;
  const meta = draft ? verdictMeta(draft.verdict) : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[140] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Consensus in progress"
        >
          <div className="absolute inset-0 bg-[rgba(5,6,10,0.92)] backdrop-blur-md" aria-hidden />
          <motion.div
            initial={{ scale: 0.95, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="panel frame scanlines relative w-full max-w-lg overflow-hidden rounded-2xl p-6 sm:p-8"
          >
            {(done || errored) && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 text-muted transition-colors hover:text-text"
              >
                <X size={18} aria-hidden />
              </button>
            )}

            {/* animated centerpiece */}
            <div className="relative mx-auto mb-6 h-28 w-28">
              <motion.div
                className="absolute inset-0 rounded-2xl border-2"
                style={{ borderColor: errored ? 'var(--danger)' : 'var(--accent-2)' }}
                animate={
                  done || errored
                    ? { rotate: 0, scale: 1 }
                    : { rotate: [0, 90, 180, 270, 360], scale: [1, 1.06, 1] }
                }
                transition={{ duration: 5, repeat: done || errored ? 0 : Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute inset-4 rounded-xl"
                style={{
                  background: errored
                    ? 'var(--danger)'
                    : done
                      ? 'var(--success)'
                      : 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                }}
                animate={done || errored ? { scale: 1 } : { scale: [0.9, 1, 0.9] }}
                transition={{ duration: 2.4, repeat: done || errored ? 0 : Infinity }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-void">
                {errored ? (
                  <X size={34} aria-hidden />
                ) : done ? (
                  <Check size={34} aria-hidden />
                ) : (
                  <Loader2 size={30} className="animate-spin text-void" aria-hidden />
                )}
              </div>
            </div>

            <h3 className="text-center font-display text-2xl font-bold text-text">
              {errored
                ? 'The ruling faltered'
                : done
                  ? captured
                    ? 'The parcel is seized'
                    : 'The ruling is sealed'
                  : 'The World Spirit deliberates'}
            </h3>

            {!done && !errored && (
              <p className="mt-1 text-center text-sm text-muted">
                {timeout
                  ? 'The leader rotates, the spirits still confer. This can take a few minutes.'
                  : 'Validators are reaching consensus. This can take a few minutes.'}
              </p>
            )}

            {/* stage ladder */}
            {!done && !errored && (
              <ol className="mt-6 space-y-3">
                {STAGES.map((st, i) => {
                  const state2 = i < active ? 'done' : i === active ? 'active' : 'idle';
                  return (
                    <li key={st.key} className="flex items-start gap-3">
                      <span className="mt-0.5">
                        {state2 === 'done' ? (
                          <Check size={16} className="text-success" aria-hidden />
                        ) : state2 === 'active' ? (
                          <Loader2 size={16} className="animate-spin text-accent2" aria-hidden />
                        ) : (
                          <CircleDot size={16} className="text-faint" aria-hidden />
                        )}
                      </span>
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{
                            color:
                              state2 === 'idle' ? 'var(--faint)' : 'var(--text)',
                          }}
                        >
                          {st.label}
                        </p>
                        {state2 === 'active' && (
                          <p className="text-xs text-muted">{st.detail}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {/* leader draft peek */}
            {draft && meta && !errored && (
              <div
                className="mt-6 rounded-xl border p-4"
                style={{ borderColor: meta.color, background: meta.bg }}
              >
                <p className="text-[10px] uppercase tracking-wider text-faint">
                  {done ? 'Verdict' : 'Leader draft, sealing under consensus'}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-display text-xl font-bold" style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                  {draft.score !== undefined && (
                    <span className="font-mono text-lg font-bold tabular text-text">
                      {draft.score}
                    </span>
                  )}
                </div>
                {draft.note && <p className="mt-1.5 text-sm leading-relaxed text-muted">{draft.note}</p>}
              </div>
            )}

            {errored && (
              <p className="mt-4 rounded-lg border border-[rgba(255,84,112,0.3)] bg-[rgba(255,84,112,0.08)] p-3 text-center text-sm text-danger">
                {state.error}
              </p>
            )}

            {/* actions */}
            <div className="mt-6 flex items-center justify-center gap-3">
              {state.hash && (
                <a
                  href={`${EXPLORER}/tx/${state.hash}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 text-xs text-accent2 hover:underline"
                >
                  View on explorer
                  <ExternalLink size={12} aria-hidden />
                </a>
              )}
              {errored && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="rounded-md border border-[var(--hairline-strong)] px-4 py-2 text-sm font-semibold text-accent2 transition-colors hover:bg-[rgba(61,240,224,0.1)]"
                >
                  Retry
                </button>
              )}
              {done && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md bg-accent px-5 py-2 text-sm font-bold text-void transition-transform hover:scale-[1.03]"
                >
                  Return to the map
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
