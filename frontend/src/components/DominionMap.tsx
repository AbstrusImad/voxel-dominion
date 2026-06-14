'use client';

import { motion } from 'framer-motion';
import { Map as MapIcon } from 'lucide-react';
import { Parcel } from '@/lib/contract';
import { factionColor, isClaimed, scoreColor, shortAddress } from '@/lib/format';
import { parseVoxels } from '@/lib/voxel';
import { VoxelGlyph } from './VoxelGlyph';
import { ErrorState } from './ErrorState';
import { Skeleton, LoadingNotice } from './Skeleton';

export interface DominionMapProps {
  parcels: Parcel[];
  loading: boolean;
  error: string | null;
  diagnostic: boolean;
  selectedParcelId: string | null;
  capturedId: string | null;
  onSelect: (id: string) => void;
  onRetry: () => void;
}

export function DominionMap({
  parcels,
  loading,
  error,
  diagnostic,
  selectedParcelId,
  capturedId,
  onSelect,
  onRetry,
}: DominionMapProps) {
  return (
    <section id="map" aria-label="Dominion map" className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-accent2">
          <MapIcon size={13} aria-hidden /> Dominion map
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold text-text sm:text-4xl">
          Twenty-four parcels, one contested world
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Each tile shows the structure that currently holds it, lit in the banner color of its
          owner. Select a parcel to aim your next build at it.
        </p>
      </motion.div>

      {error ? (
        <ErrorState message={error} diagnostic={diagnostic} onRetry={onRetry} />
      ) : loading && parcels.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 24 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
          <div className="col-span-full pt-2">
            <LoadingNotice label="Charting the world" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {parcels.map((p, i) => (
            <ParcelTile
              key={p.id}
              parcel={p}
              index={i}
              selected={selectedParcelId === p.id}
              captured={capturedId === p.id}
              onSelect={() => onSelect(p.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ParcelTile({
  parcel,
  index,
  selected,
  captured,
  onSelect,
}: {
  parcel: Parcel;
  index: number;
  selected: boolean;
  captured: boolean;
  onSelect: () => void;
}) {
  const claimed = isClaimed(parcel.owner);
  const color = factionColor(parcel.owner);
  const voxels = parseVoxels(parcel.voxels);

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.02, 0.4) }}
      aria-label={`Parcel ${parcel.id}, ${claimed ? `held by ${shortAddress(parcel.owner)}` : 'unclaimed'}, score ${parcel.score}`}
      aria-pressed={selected}
      className={`group relative overflow-hidden rounded-xl border bg-surface/70 p-2.5 text-left transition-colors ${
        captured ? 'flash-capture' : ''
      }`}
      style={{
        borderColor: selected ? 'var(--accent)' : claimed ? `${color}` : 'var(--hairline)',
        boxShadow: selected ? '0 0 22px rgba(255,122,24,0.35)' : 'none',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tabular text-faint">{parcel.id}</span>
        <span className="font-mono text-[11px] font-bold tabular" style={{ color: scoreColor(parcel.score) }}>
          {parcel.score}
        </span>
      </div>

      <div className="relative my-1.5 flex aspect-square items-center justify-center">
        {voxels.length > 0 ? (
          <VoxelGlyph
            voxels={voxels}
            color={color}
            wire={!claimed}
            className="h-full w-full transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="text-[10px] uppercase tracking-wider text-faint">empty</span>
        )}
      </div>

      <p className="truncate text-xs font-semibold text-text">
        {parcel.title || (claimed ? 'Unnamed claim' : 'No banner')}
      </p>
      <div className="mt-0.5 flex items-center gap-1.5">
        <span
          className="h-2 w-2 shrink-0 rounded-sm"
          style={{ background: claimed ? color : 'var(--faint)' }}
          aria-hidden
        />
        <span className="truncate font-mono text-[10px] text-muted">
          {claimed ? shortAddress(parcel.owner) : 'unclaimed'}
        </span>
      </div>
    </motion.button>
  );
}
