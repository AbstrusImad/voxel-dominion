import { Verdict } from './contract';

export function shortAddress(addr: string | null | undefined, size = 4): string {
  if (!addr) return '';
  const a = String(addr);
  if (a.length <= size * 2 + 2) return a;
  return `${a.slice(0, size + 2)}...${a.slice(-size)}`;
}

export function formatFigure(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return new Intl.NumberFormat('en-US').format(Math.round(n));
}

export function sameAddress(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

export function isClaimed(owner: string | null | undefined): boolean {
  if (!owner) return false;
  const o = String(owner);
  return o.length > 0 && !/^0x0+$/.test(o);
}

// Derive a stable faction color from an owner address hash. Unclaimed
// parcels are rendered with a neutral grey elsewhere.
const FACTION_HUES = [12, 174, 268, 142, 48, 342, 200, 96, 24, 308, 160, 220];

export function factionColor(addr: string | null | undefined): string {
  if (!isClaimed(addr)) return '#5d6781';
  const a = String(addr).toLowerCase();
  let h = 0;
  for (let i = 2; i < a.length; i++) {
    h = (h * 31 + a.charCodeAt(i)) >>> 0;
  }
  const hue = FACTION_HUES[h % FACTION_HUES.length];
  const sat = 62 + (h % 18);
  const light = 56 + ((h >> 5) % 12);
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

export interface VerdictMeta {
  color: string;
  label: string;
  bg: string;
}

export const VERDICT_META: Record<Exclude<Verdict, ''>, VerdictMeta> = {
  MASTERWORK: { color: 'var(--accent-2)', label: 'Masterwork', bg: 'rgba(61, 240, 224, 0.12)' },
  WORTHY: { color: 'var(--success)', label: 'Worthy', bg: 'rgba(70, 224, 138, 0.12)' },
  WEAK: { color: 'var(--accent)', label: 'Weak', bg: 'rgba(255, 122, 24, 0.12)' },
  REJECT: { color: 'var(--danger)', label: 'Reject', bg: 'rgba(255, 84, 112, 0.12)' },
  ERA: { color: '#9b6bff', label: 'Age Turned', bg: 'rgba(155, 107, 255, 0.14)' },
};

export function verdictMeta(v: Verdict): VerdictMeta {
  if (v && v in VERDICT_META) return VERDICT_META[v as Exclude<Verdict, ''>];
  return { color: 'var(--muted)', label: 'Pending', bg: 'rgba(154, 166, 189, 0.1)' };
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'var(--accent-2)';
  if (score >= 50) return 'var(--success)';
  if (score > 0) return 'var(--accent)';
  return 'var(--faint)';
}
