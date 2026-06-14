'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Eraser, Hammer, RotateCcw, Send, Trash2 } from 'lucide-react';
import { LIMITS, MATERIALS, Parcel, VOXELS } from '@/lib/contract';
import { Voxel, computeStats, serializeVoxels, starterStructure, voxelKey } from '@/lib/voxel';
import { factionColor, isClaimed, shortAddress } from '@/lib/format';
import { ConfirmDialog } from './ConfirmDialog';

const VoxelBuilder = dynamic(() => import('./VoxelBuilder'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-muted">
      Warming the forge
    </div>
  ),
});

export interface FoundryProps {
  parcels: Parcel[];
  selectedParcelId: string | null;
  onSelectParcel: (id: string) => void;
  connected: boolean;
  submitting: boolean;
  onSubmit: (parcelId: string, title: string, voxels: string, intent: string) => void;
}

export function Foundry({
  parcels,
  selectedParcelId,
  onSelectParcel,
  connected,
  submitting,
  onSubmit,
}: FoundryProps) {
  const [voxels, setVoxels] = useState<Voxel[]>(() => starterStructure());
  const [activeMaterial, setActiveMaterial] = useState(0);
  const [removeMode, setRemoveMode] = useState(false);
  const [title, setTitle] = useState('');
  const [intent, setIntent] = useState('');
  const [confirm, setConfirm] = useState(false);
  const history = useRef<Voxel[][]>([]);

  const stats = useMemo(() => computeStats(voxels), [voxels]);
  const selected = useMemo(
    () => parcels.find((p) => p.id === selectedParcelId) ?? null,
    [parcels, selectedParcelId],
  );

  const place = useCallback((v: Voxel) => {
    setVoxels((prev) => {
      if (prev.length >= VOXELS.max) return prev;
      if (prev.some((p) => p.x === v.x && p.y === v.y && p.z === v.z)) return prev;
      history.current.push(prev);
      return [...prev, v];
    });
  }, []);

  const remove = useCallback((key: string) => {
    setVoxels((prev) => {
      const next = prev.filter((p) => voxelKey(p.x, p.y, p.z) !== key);
      if (next.length === prev.length) return prev;
      history.current.push(prev);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setVoxels((prev) => {
      const last = history.current.pop();
      return last ?? prev;
    });
  }, []);

  const clear = useCallback(() => {
    setVoxels((prev) => {
      history.current.push(prev);
      return [];
    });
  }, []);

  const titleValid = title.trim().length >= LIMITS.title.min && title.length <= LIMITS.title.max;
  const enoughBlocks = voxels.length >= VOXELS.min;
  const canSubmit = connected && !submitting && titleValid && enoughBlocks && !!selectedParcelId;

  const beginSubmit = () => {
    if (!canSubmit) return;
    setConfirm(true);
  };

  const doSubmit = () => {
    setConfirm(false);
    if (!selectedParcelId) return;
    onSubmit(selectedParcelId, title.trim(), serializeVoxels(voxels), intent.trim());
  };

  return (
    <section id="foundry" aria-label="The Foundry" className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-accent">
          <Hammer size={13} aria-hidden /> The Foundry
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold text-text sm:text-4xl">
          Raise a structure worthy of the age
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Place voxels block by block. Orbit to inspect every face. When your work is ready, submit
          it to the World Spirit to contest a parcel on the map.
        </p>
      </motion.div>

      <div className="panel frame overflow-hidden rounded-2xl">
        <div className="grid lg:grid-cols-[1fr_340px]">
          {/* canvas */}
          <div className="relative order-2 h-[420px] border-t border-[var(--hairline)] bg-[#070912] sm:h-[540px] lg:order-1 lg:border-r lg:border-t-0">
            <VoxelBuilder
              voxels={voxels}
              activeMaterial={activeMaterial}
              removeMode={removeMode}
              onPlace={place}
              onRemove={remove}
            />
            <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1">
              <span className="font-mono text-[11px] text-muted">
                blocks{' '}
                <span className={voxels.length >= VOXELS.max ? 'text-danger' : 'text-accent2'}>
                  {voxels.length}
                </span>
                /{VOXELS.max}
              </span>
              <span className="font-mono text-[10px] text-faint">
                {removeMode ? 'remove: tap a block' : 'place: tap a face. shift-tap removes'}
              </span>
            </div>
          </div>

          {/* controls */}
          <div className="order-1 flex flex-col gap-5 p-5 lg:order-2">
            {/* material palette */}
            <div>
              <p className="text-[11px] uppercase tracking-wider text-faint">Material</p>
              <div className="mt-2 grid grid-cols-8 gap-1.5 lg:grid-cols-4">
                {MATERIALS.map((m, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setActiveMaterial(i);
                      setRemoveMode(false);
                    }}
                    aria-label={`Select ${m.name}`}
                    aria-pressed={activeMaterial === i && !removeMode}
                    className="aspect-square rounded-md border transition-transform hover:scale-105"
                    style={{
                      background: m.color,
                      borderColor:
                        activeMaterial === i && !removeMode ? 'var(--text)' : 'transparent',
                      boxShadow:
                        activeMaterial === i && !removeMode ? `0 0 14px ${m.color}` : 'none',
                    }}
                  />
                ))}
              </div>
              <p className="mt-1.5 font-mono text-[11px] text-muted">
                {removeMode ? 'Eraser active' : MATERIALS[activeMaterial].name}
              </p>
            </div>

            {/* tools */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRemoveMode((v) => !v)}
                aria-pressed={removeMode}
                className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-md border px-2 text-xs transition-colors"
                style={{
                  borderColor: removeMode ? 'var(--danger)' : 'var(--hairline-strong)',
                  color: removeMode ? 'var(--danger)' : 'var(--muted)',
                }}
              >
                <Eraser size={14} aria-hidden /> Erase
              </button>
              <button
                type="button"
                onClick={undo}
                className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-md border border-[var(--hairline-strong)] px-2 text-xs text-muted transition-colors hover:text-text"
              >
                <RotateCcw size={14} aria-hidden /> Undo
              </button>
              <button
                type="button"
                onClick={clear}
                className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-md border border-[var(--hairline-strong)] px-2 text-xs text-muted transition-colors hover:text-danger"
              >
                <Trash2 size={14} aria-hidden /> Clear
              </button>
            </div>

            {/* measured stats */}
            <div className="grid grid-cols-4 gap-2 rounded-lg border border-[var(--hairline)] bg-surface/60 p-3 text-center">
              <Stat label="Height" value={stats.height} />
              <Stat label="Foot" value={stats.footprint} />
              <Stat label="Mats" value={stats.materials} />
              <Stat label="Mirror" value={`${stats.symmetry}%`} />
            </div>

            {/* target parcel */}
            <div>
              <label htmlFor="target" className="text-[11px] uppercase tracking-wider text-faint">
                Target parcel
              </label>
              <select
                id="target"
                value={selectedParcelId ?? ''}
                onChange={(e) => onSelectParcel(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded-md border border-[var(--hairline-strong)] bg-surface2 px-3 text-sm text-text outline-none focus:border-accent2"
              >
                <option value="" disabled>
                  Choose a parcel to contest
                </option>
                {parcels.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} {isClaimed(p.owner) ? `(held, score ${p.score})` : '(unclaimed)'}
                  </option>
                ))}
              </select>
              {selected && (
                <div className="mt-2 flex items-center justify-between rounded-md border border-[var(--hairline)] bg-surface/60 px-3 py-2 text-xs">
                  <span className="flex items-center gap-1.5 text-muted">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ background: factionColor(selected.owner) }}
                      aria-hidden
                    />
                    {isClaimed(selected.owner) ? shortAddress(selected.owner) : 'unclaimed'}
                  </span>
                  <span className="font-mono tabular text-text">
                    beat {selected.score}
                  </span>
                </div>
              )}
            </div>

            {/* title */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="title" className="text-[11px] uppercase tracking-wider text-faint">
                  Title
                </label>
                <span className="font-mono text-[10px] text-faint">
                  {title.length}/{LIMITS.title.max}
                </span>
              </div>
              <input
                id="title"
                value={title}
                maxLength={LIMITS.title.max}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Name your work"
                className="mt-1.5 min-h-[44px] w-full rounded-md border border-[var(--hairline-strong)] bg-surface2 px-3 text-sm text-text outline-none focus:border-accent2"
              />
            </div>

            {/* intent */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="intent" className="text-[11px] uppercase tracking-wider text-faint">
                  Intent
                </label>
                <span className="font-mono text-[10px] text-faint">
                  {intent.length}/{LIMITS.intent.max}
                </span>
              </div>
              <textarea
                id="intent"
                value={intent}
                maxLength={LIMITS.intent.max}
                onChange={(e) => setIntent(e.target.value)}
                rows={3}
                placeholder="Tell the World Spirit what the age should see in your structure (optional)"
                className="mt-1.5 w-full resize-none rounded-md border border-[var(--hairline-strong)] bg-surface2 px-3 py-2 text-sm text-text outline-none focus:border-accent2"
              />
            </div>

            <button
              type="button"
              onClick={beginSubmit}
              disabled={!canSubmit}
              className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-bold text-void transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-surface2 disabled:text-faint"
            >
              <Send size={16} aria-hidden />
              {submitting ? 'In consensus' : 'Submit to the World Spirit'}
            </button>
            <p className="text-center text-[11px] leading-relaxed text-faint">
              {!connected
                ? 'Connect a wallet to submit.'
                : !enoughBlocks
                  ? `Place at least ${VOXELS.min} blocks.`
                  : !selectedParcelId
                    ? 'Choose a target parcel.'
                    : !titleValid
                      ? 'Give your work a title.'
                      : 'A capture needs a verdict of Worthy or Masterwork, score 50 or more, above the standing score.'}
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        title="Submit to the World Spirit?"
        message="This submits a transaction on Bradbury Testnet. Network fees apply. The validators will re-run the judgment under consensus. Continue?"
        confirmLabel="Submit build"
        showFaucet
        onConfirm={doSubmit}
        onCancel={() => setConfirm(false)}
      />
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="font-mono text-lg font-bold tabular text-text">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-faint">{label}</p>
    </div>
  );
}
