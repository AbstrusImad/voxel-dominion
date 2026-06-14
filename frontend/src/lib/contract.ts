import { createClient } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';

// Live VOXEL DOMINION contract on GenLayer Bradbury Testnet.
// The deploy pipeline replaces these two placeholders with the real values.
export const CONTRACT_ADDRESS =
  '0xB060d7Ed7529c6c3Fd3f8F345C13A22A3b220636' as const;
export const DEPLOY_TX =
  '0xd7f778e5d7acabfe6f3796a8488179072827036b3aec00c400969b022d74b5aa' as const;
export const EXPLORER = 'https://explorer-bradbury.genlayer.com';
export const FAUCET = 'https://testnet-faucet.genlayer.foundation/';

export const readClient = createClient({ chain: testnetBradbury });

export const makeWalletClient = (account: `0x${string}`) =>
  createClient({ chain: testnetBradbury, account });

export type WalletClient = ReturnType<typeof makeWalletClient>;

const ADDRESS = CONTRACT_ADDRESS as `0x${string}`;

// ---- char and voxel limits mirrored from the contract --------------------

export const LIMITS = {
  title: { min: 1, max: 60 },
  intent: { min: 0, max: 300 },
} as const;

export const VOXELS = {
  min: 3,
  max: 256,
  gridMax: 15, // coordinate range 0..15
  buildSpan: 12, // usable build footprint cap for sanity
  materials: 8,
} as const;

// Eight voxel material colors (index 0..7). Same values as --mat-0..7.
export const MATERIALS: { name: string; color: string }[] = [
  { name: 'Molten', color: '#ff7a18' },
  { name: 'Cyan', color: '#3df0e0' },
  { name: 'Amethyst', color: '#9b6bff' },
  { name: 'Verdant', color: '#46e08a' },
  { name: 'Sunflare', color: '#ffd23f' },
  { name: 'Rose', color: '#ff5470' },
  { name: 'Bone', color: '#e8ecf5' },
  { name: 'Slate', color: '#5d6781' },
];

// ---- shapes returned by the contract views -------------------------------

export type Verdict = 'MASTERWORK' | 'WORTHY' | 'WEAK' | 'REJECT' | 'ERA' | '';

export interface Stats {
  parcels: number;
  held: number;
  builds: number;
  captures: number;
  era: number;
  eraName: string;
  eraRule: string;
  eraCaptures: number;
}

export interface Era {
  era: number;
  name: string;
  rule: string;
  favors: string;
  eraCaptures: number;
}

export interface Parcel {
  id: string;
  row: number;
  col: number;
  owner: string; // hex address or ""
  title: string;
  score: number;
  voxels: string; // "x,y,z,c|..."
  captures: number;
  era: number;
}

export interface ChronicleEntry {
  parcel: string;
  builder: string;
  title: string;
  verdict: Verdict;
  score: number;
  note: string;
  captured: boolean;
  era: number;
}

// ---- resilient reads -----------------------------------------------------

export async function withRpcRetry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!/rate limit|429|timeout|network|fetch|too many/i.test(String(e))) throw e;
      // backoff: 2.5s, 5s, 10s, 20s
      await new Promise((r) => setTimeout(r, 2500 * 2 ** i));
    }
  }
  throw last;
}

function toRecord<T>(value: unknown): T {
  if (value instanceof Map) {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of value.entries()) obj[String(k)] = normalize(v);
    return obj as T;
  }
  return value as T;
}

function normalize(value: unknown): unknown {
  if (value instanceof Map) return toRecord(value);
  if (Array.isArray(value)) return value.map(normalize);
  if (typeof value === 'bigint') return value.toString();
  return value;
}

function num(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'bigint') return Number(v);
  const n = Number(String(v ?? '0'));
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
  return String(v ?? '');
}

function asVerdict(v: unknown): Verdict {
  const s = str(v).toUpperCase();
  if (s === 'MASTERWORK' || s === 'WORTHY' || s === 'WEAK' || s === 'REJECT' || s === 'ERA') return s;
  return '';
}

function asParcel(raw: unknown): Parcel {
  const r = toRecord<Record<string, unknown>>(raw);
  return {
    id: str(r.id),
    row: num(r.row),
    col: num(r.col),
    owner: str(r.owner),
    title: str(r.title),
    score: num(r.score),
    voxels: str(r.voxels),
    captures: num(r.captures),
    era: num(r.era),
  };
}

function asChronicle(raw: unknown): ChronicleEntry {
  const r = toRecord<Record<string, unknown>>(raw);
  return {
    parcel: str(r.parcel),
    builder: str(r.builder),
    title: str(r.title),
    verdict: asVerdict(r.verdict),
    score: num(r.score),
    note: str(r.note),
    captured: Boolean(r.captured),
    era: num(r.era),
  };
}

export async function fetchStats(): Promise<Stats> {
  const raw = await withRpcRetry(() =>
    readClient.readContract({ address: ADDRESS, functionName: 'get_stats', args: [] }),
  );
  const r = toRecord<Record<string, unknown>>(normalize(raw));
  return {
    parcels: num(r.parcels),
    held: num(r.held),
    builds: num(r.builds),
    captures: num(r.captures),
    era: num(r.era),
    eraName: str(r.eraName),
    eraRule: str(r.eraRule),
    eraCaptures: num(r.eraCaptures),
  };
}

export async function fetchEra(): Promise<Era> {
  const raw = await withRpcRetry(() =>
    readClient.readContract({ address: ADDRESS, functionName: 'get_era', args: [] }),
  );
  const r = toRecord<Record<string, unknown>>(normalize(raw));
  return {
    era: num(r.era),
    name: str(r.name),
    rule: str(r.rule),
    favors: str(r.favors),
    eraCaptures: num(r.eraCaptures),
  };
}

export async function fetchParcels(start = 0): Promise<Parcel[]> {
  const raw = await withRpcRetry(() =>
    readClient.readContract({
      address: ADDRESS,
      functionName: 'get_parcels',
      args: [BigInt(start)],
    }),
  );
  const arr = (normalize(raw) as unknown[]) ?? [];
  return arr.map(asParcel);
}

export async function fetchChronicle(start = 0): Promise<ChronicleEntry[]> {
  const raw = await withRpcRetry(() =>
    readClient.readContract({
      address: ADDRESS,
      functionName: 'get_chronicle',
      args: [BigInt(start)],
    }),
  );
  const arr = (normalize(raw) as unknown[]) ?? [];
  return arr.map(asChronicle);
}

// ---- writes --------------------------------------------------------------

export function submitBuild(
  client: WalletClient,
  parcelId: string,
  title: string,
  voxels: string,
  intent: string,
) {
  return client.writeContract({
    address: ADDRESS,
    functionName: 'submit_build',
    args: [parcelId, title, voxels, intent],
    value: 0n,
  });
}

export function advanceEra(client: WalletClient) {
  return client.writeContract({
    address: ADDRESS,
    functionName: 'advance_era',
    args: [],
    value: 0n,
  });
}

// ---- transaction polling -------------------------------------------------

const STATUS_NAME: Record<string, string> = {
  '1': 'PENDING',
  '2': 'PROPOSING',
  '3': 'COMMITTING',
  '4': 'REVEALING',
  '5': 'ACCEPTED',
  '6': 'UNDETERMINED',
  '7': 'FINALIZED',
  '8': 'CANCELED',
  '12': 'VALIDATORS_TIMEOUT',
  '13': 'LEADER_TIMEOUT',
};

export const statusName = (s: unknown): string =>
  STATUS_NAME[String(s)] ?? String(s ?? 'PENDING').toUpperCase();

// LEADER_TIMEOUT / VALIDATORS_TIMEOUT are intentionally absent here: the
// network rotates the leader and retries, so keep polling through them.
const TERMINAL = new Set(['ACCEPTED', 'FINALIZED', 'UNDETERMINED', 'CANCELED']);

export interface LeaderDraft {
  verdict: Verdict;
  score?: number;
  note?: string;
}

function pick(obj: unknown, key: string): unknown {
  if (obj instanceof Map) return obj.get(key);
  if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[key];
  return undefined;
}

export function extractLeaderDraft(tx: unknown): LeaderDraft | null {
  try {
    const receipts = pick(pick(tx, 'consensus_data'), 'leader_receipt');
    const first = Array.isArray(receipts) ? receipts[0] : receipts;
    const b64 = pick(pick(first, 'eq_outputs'), '0');
    if (typeof b64 !== 'string' || b64.length === 0) return null;
    const text = atob(b64);
    for (let i = text.length - 1; i >= 0; i--) {
      if (text[i] !== '{') continue;
      try {
        const obj = JSON.parse(text.slice(i)) as Record<string, unknown>;
        if (obj && typeof obj === 'object' && 'verdict' in obj) {
          return {
            verdict: asVerdict(obj.verdict),
            score: obj.score !== undefined ? num(obj.score) : undefined,
            note: obj.note !== undefined ? str(obj.note) : undefined,
          };
        }
      } catch {
        /* keep scanning toward the start for a parseable object */
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function pollUntilDecided(
  client: WalletClient,
  hash: `0x${string}`,
  onUpdate?: (status: string, draft: LeaderDraft | null) => void,
): Promise<{ status: string; draft: LeaderDraft | null }> {
  let draft: LeaderDraft | null = null;
  for (let i = 0; i < 150; i++) {
    const tx = await client
      .getTransaction({ hash } as Parameters<typeof client.getTransaction>[0])
      .catch(() => null);
    const status = statusName(tx ? (tx as { status?: unknown }).status : 'PENDING');
    draft = extractLeaderDraft(tx) ?? draft;
    onUpdate?.(status, draft);
    if (TERMINAL.has(status)) return { status, draft };
    await new Promise((r) => setTimeout(r, 8000));
  }
  return { status: 'TIMEOUT', draft };
}
