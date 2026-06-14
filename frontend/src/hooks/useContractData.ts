'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChronicleEntry,
  Era,
  Parcel,
  Stats,
  fetchChronicle,
  fetchEra,
  fetchParcels,
  fetchStats,
} from '@/lib/contract';

const POLL_MS = 90_000;

interface Classified {
  message: string;
  diagnostic: boolean;
}

function classifyError(e: unknown): Classified {
  const msg = String(e);
  if (/contract not found|execution reverted|no contract/i.test(msg)) {
    return {
      message:
        'No contract exists at the configured address on Bradbury, the deployment must be repaired.',
      diagnostic: true,
    };
  }
  if (/rate limit|429|too many/i.test(msg)) {
    return { message: 'The network is rate limiting reads. Retrying shortly.', diagnostic: false };
  }
  return {
    message: 'The world map is unreachable. Check your connection and retry.',
    diagnostic: false,
  };
}

export interface WorldData {
  stats: Stats | null;
  era: Era | null;
  parcels: Parcel[];
  chronicle: ChronicleEntry[];
  loading: boolean;
  error: string | null;
  diagnostic: boolean;
  refresh: () => Promise<void>;
  setBusy: (busy: boolean) => void;
}

// One world poll drives every chain-reading section. Polling pauses while a
// transaction is in flight to avoid clobbering the live consensus view.
export function useWorldData(): WorldData {
  const [stats, setStats] = useState<Stats | null>(null);
  const [era, setEra] = useState<Era | null>(null);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [chronicle, setChronicle] = useState<ChronicleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState(false);

  const alive = useRef(true);
  const busy = useRef(false);

  const load = useCallback(async () => {
    try {
      const [st, er, ps, ch] = await Promise.all([
        fetchStats(),
        fetchEra(),
        fetchParcels(0),
        fetchChronicle(0),
      ]);
      if (!alive.current) return;
      setStats(st);
      setEra(er);
      setParcels(ps);
      setChronicle(ch);
      setError(null);
      setDiagnostic(false);
    } catch (e) {
      if (!alive.current) return;
      const c = classifyError(e);
      setError(c.message);
      setDiagnostic(c.diagnostic);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const setBusy = useCallback((b: boolean) => {
    busy.current = b;
  }, []);

  useEffect(() => {
    alive.current = true;
    load();
    const id = setInterval(() => {
      if (busy.current) return; // pause polling entirely while a tx is in flight
      load();
    }, POLL_MS);
    return () => {
      alive.current = false;
      clearInterval(id);
    };
  }, [load]);

  return { stats, era, parcels, chronicle, loading, error, diagnostic, refresh, setBusy };
}
