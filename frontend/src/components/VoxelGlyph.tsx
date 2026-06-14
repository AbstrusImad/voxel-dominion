'use client';

import { useMemo } from 'react';
import { Voxel } from '@/lib/voxel';

// PERFORMANCE CHOICE:
// The Dominion Map renders 24 parcels at once. Twenty-four live WebGL canvases
// would thrash the GPU and drop well below 60fps, so each parcel's winning
// structure is drawn here as a crisp isometric SVG voxel projection instead,
// tinted by the owner's faction color. Full Three.js is reserved for the hero
// and the Foundry builder, where a single rich scene can hold 60fps.

const W = 14; // half tile width
const H = 7; // half tile height
const CUBE = 15; // vertical face height

interface P2 {
  x: number;
  y: number;
}

function project(px: number, py: number, pz: number): P2 {
  return { x: (px - pz) * W, y: (px + pz) * H - py * CUBE };
}

interface Face {
  pts: string;
  shade: number; // 0 = full, higher = darker overlay alpha
  depth: number;
}

export interface VoxelGlyphProps {
  voxels: Voxel[];
  color: string; // faction or neutral color
  wire?: boolean; // unclaimed parcels render as wireframe
  className?: string;
}

export function VoxelGlyph({ voxels, color, wire, className }: VoxelGlyphProps) {
  const { faces, viewBox } = useMemo(() => {
    const sorted = [...voxels].sort((a, b) => a.x + a.y + a.z - (b.x + b.y + b.z));
    const fs: Face[] = [];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const note = (p: P2) => {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    };
    const poly = (ps: P2[]) => {
      ps.forEach(note);
      return ps.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    };

    for (const v of sorted) {
      const { x, y, z } = v;
      const A = project(x, y + 1, z);
      const B = project(x + 1, y + 1, z);
      const C = project(x + 1, y + 1, z + 1);
      const D = project(x, y + 1, z + 1);
      const Bb = project(x + 1, y, z);
      const Cb = project(x + 1, y, z + 1);
      const Db = project(x, y, z + 1);
      const depth = x + y + z;
      fs.push({ pts: poly([A, B, C, D]), shade: 0, depth });
      fs.push({ pts: poly([B, C, Cb, Bb]), shade: 0.26, depth });
      fs.push({ pts: poly([D, C, Cb, Db]), shade: 0.46, depth });
    }

    if (!Number.isFinite(minX)) {
      return { faces: fs, viewBox: '0 0 1 1' };
    }
    const pad = 6;
    const vb = `${(minX - pad).toFixed(1)} ${(minY - pad).toFixed(1)} ${(
      maxX - minX + pad * 2
    ).toFixed(1)} ${(maxY - minY + pad * 2).toFixed(1)}`;
    return { faces: fs, viewBox: vb };
  }, [voxels]);

  if (voxels.length === 0) {
    return null;
  }

  return (
    <svg
      viewBox={viewBox}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      {faces.map((f, i) =>
        wire ? (
          <polygon
            key={i}
            points={f.pts}
            fill="none"
            stroke={color}
            strokeOpacity={0.55}
            strokeWidth={0.7}
            strokeLinejoin="round"
          />
        ) : (
          <g key={i}>
            <polygon points={f.pts} fill={color} stroke="rgba(5,6,10,0.5)" strokeWidth={0.4} />
            {f.shade > 0 && <polygon points={f.pts} fill={`rgba(5,6,10,${f.shade})`} />}
          </g>
        ),
      )}
    </svg>
  );
}
