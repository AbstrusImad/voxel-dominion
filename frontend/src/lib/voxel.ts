import { VOXELS } from './contract';

export interface Voxel {
  x: number;
  y: number;
  z: number;
  c: number;
}

const clampCoord = (n: number) => Math.max(0, Math.min(VOXELS.gridMax, Math.round(n)));
const clampMat = (n: number) => Math.max(0, Math.min(VOXELS.materials - 1, Math.round(n)));

export function voxelKey(x: number, y: number, z: number): string {
  return `${x},${y},${z}`;
}

// Parse a "x,y,z,c|x,y,z,c|..." string into voxels, ignoring duplicates by
// (x,y,z) and silently dropping malformed segments. Capped at VOXELS.max.
export function parseVoxels(raw: string | null | undefined): Voxel[] {
  if (!raw) return [];
  const out: Voxel[] = [];
  const seen = new Set<string>();
  for (const seg of String(raw).split('|')) {
    const parts = seg.split(',');
    if (parts.length < 4) continue;
    const x = clampCoord(Number(parts[0]));
    const y = clampCoord(Number(parts[1]));
    const z = clampCoord(Number(parts[2]));
    const c = clampMat(Number(parts[3]));
    if (![x, y, z, c].every(Number.isFinite)) continue;
    const k = voxelKey(x, y, z);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ x, y, z, c });
    if (out.length >= VOXELS.max) break;
  }
  return out;
}

// Serialize voxels back into the contract string format.
export function serializeVoxels(voxels: Voxel[]): string {
  return voxels.map((v) => `${v.x},${v.y},${v.z},${v.c}`).join('|');
}

export interface BuildStats {
  count: number;
  height: number;
  footprint: number; // distinct (x,z) cells
  materials: number; // distinct materials used
  symmetry: number; // approx mirror symmetry percent across the X axis (0..100)
}

// Client-side measured stats so a builder understands what an era rewards.
export function computeStats(voxels: Voxel[]): BuildStats {
  const count = voxels.length;
  if (count === 0) {
    return { count: 0, height: 0, footprint: 0, materials: 0, symmetry: 0 };
  }
  let maxY = 0;
  const cells = new Set<string>();
  const mats = new Set<number>();
  let minX = Infinity;
  let maxX = -Infinity;
  for (const v of voxels) {
    if (v.y > maxY) maxY = v.y;
    cells.add(`${v.x},${v.z}`);
    mats.add(v.c);
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
  }
  // mirror across the mid-plane of the occupied X span
  const occupied = new Set(voxels.map((v) => voxelKey(v.x, v.y, v.z)));
  const axis = minX + maxX; // mirror x -> axis - x
  let matched = 0;
  for (const v of voxels) {
    const mx = axis - v.x;
    if (occupied.has(voxelKey(mx, v.y, v.z))) matched += 1;
  }
  const symmetry = Math.round((matched / count) * 100);
  return {
    count,
    height: maxY + 1,
    footprint: cells.size,
    materials: mats.size,
    symmetry,
  };
}

// A neat default starter structure so the Foundry is never empty.
export function starterStructure(): Voxel[] {
  const out: Voxel[] = [];
  // a 3x3 plinth
  for (let x = 5; x <= 7; x++) {
    for (let z = 5; z <= 7; z++) {
      out.push({ x, y: 0, z, c: 7 });
    }
  }
  // a small spire
  out.push({ x: 6, y: 1, z: 6, c: 0 });
  out.push({ x: 6, y: 2, z: 6, c: 4 });
  return out;
}
