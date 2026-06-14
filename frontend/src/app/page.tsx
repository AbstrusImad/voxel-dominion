'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { StarfieldBackground } from '@/components/StarfieldBackground';
import { HudHeader } from '@/components/HudHeader';
import { Hero } from '@/components/Hero';
import { EraBriefing } from '@/components/EraBriefing';
import { Foundry } from '@/components/Foundry';
import { DominionMap } from '@/components/DominionMap';
import { Dynasty } from '@/components/Dynasty';
import { Chronicle } from '@/components/Chronicle';
import { Codex } from '@/components/Codex';
import { Footer } from '@/components/Footer';
import { ConsensusTheater } from '@/components/ConsensusTheater';
import { ToastStack, useToasts } from '@/components/Toast';
import { DataErrorBoundary } from '@/components/DataErrorBoundary';
import { useWallet } from '@/hooks/useWallet';
import { useWorldData } from '@/hooks/useContractData';
import { useTransaction } from '@/hooks/useTransaction';
import { advanceEra, fetchParcels, submitBuild } from '@/lib/contract';
import { sameAddress } from '@/lib/format';

type ActionKind = 'build' | 'era' | null;

export default function Page() {
  const wallet = useWallet();
  const world = useWorldData();
  const tx = useTransaction();
  const toasts = useToasts();

  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [capturedId, setCapturedId] = useState<string | null>(null);
  const [captured, setCaptured] = useState<boolean | null>(null);
  const [theaterOpen, setTheaterOpen] = useState(false);

  const action = useRef<ActionKind>(null);
  const targetRef = useRef<string | null>(null);
  const toastId = useRef<string | null>(null);

  // default the Foundry target to the first parcel once data arrives
  useEffect(() => {
    if (!selectedParcelId && world.parcels.length > 0) {
      setSelectedParcelId(world.parcels[0].id);
    }
  }, [world.parcels, selectedParcelId]);

  const scrollToFoundry = useCallback(() => {
    document.getElementById('foundry')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const onSelectFromMap = useCallback(
    (id: string) => {
      setSelectedParcelId(id);
      scrollToFoundry();
    },
    [scrollToFoundry],
  );

  // toast lifecycle driven by the live transaction phase
  useEffect(() => {
    const { phase, hash, error } = tx.state;
    const title = action.current === 'era' ? 'Turning the age' : 'Submitting build';
    if (phase === 'idle') return;
    const id = toastId.current ?? `tx-${Date.now()}`;
    toastId.current = id;

    if (phase === 'wallet') {
      toasts.push({ id, kind: 'loading', title, message: 'Confirm in your wallet' });
    } else if (phase === 'submitted' || phase === 'consensus') {
      toasts.push({
        id,
        kind: 'loading',
        title,
        message: 'The validators deliberate',
        hash: hash ?? undefined,
      });
    } else if (phase === 'confirmed') {
      toasts.push({
        id,
        kind: 'success',
        title: action.current === 'era' ? 'The age has turned' : 'The ruling is sealed',
        message: 'The chronicle has been updated.',
        hash: hash ?? undefined,
      });
      toastId.current = null;
    } else if (phase === 'error') {
      toasts.push({
        id,
        kind: 'error',
        title: 'Transaction failed',
        message: error ?? 'Please try again.',
        hash: hash ?? undefined,
      });
      toastId.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tx.state.phase]);

  const handleSubmitBuild = useCallback(
    (parcelId: string, title: string, voxels: string, intent: string) => {
      if (!wallet.address) return;
      action.current = 'build';
      targetRef.current = parcelId;
      setCaptured(null);
      setCapturedId(null);
      setTheaterOpen(true);
      tx.run({
        account: wallet.address,
        onBusy: world.setBusy,
        send: (c) => submitBuild(c, parcelId, title, voxels, intent),
        onConfirmed: async () => {
          // read the authoritative parcel state back to learn the outcome
          const fresh = await fetchParcels(0).catch(() => []);
          const tp = fresh.find((p) => p.id === targetRef.current);
          const won = tp ? sameAddress(tp.owner, wallet.address) : false;
          setCaptured(won);
          if (won && tp) {
            setCapturedId(tp.id);
            window.setTimeout(() => setCapturedId(null), 2600);
          }
          world.refresh();
        },
      });
    },
    [wallet.address, tx, world],
  );

  const handleAdvanceEra = useCallback(() => {
    if (!wallet.address) return;
    action.current = 'era';
    tx.run({
      account: wallet.address,
      onBusy: world.setBusy,
      send: (c) => advanceEra(c),
      onConfirmed: () => {
        world.refresh();
      },
    });
  }, [wallet.address, tx, world]);

  const closeTheater = useCallback(() => {
    setTheaterOpen(false);
    tx.reset();
  }, [tx]);

  const retryFromTheater = useCallback(() => {
    setTheaterOpen(false);
    tx.reset();
    scrollToFoundry();
  }, [tx, scrollToFoundry]);

  const buildSubmitting =
    action.current === 'build' &&
    (tx.state.phase === 'wallet' ||
      tx.state.phase === 'submitted' ||
      tx.state.phase === 'consensus');
  const eraAdvancing =
    action.current === 'era' &&
    (tx.state.phase === 'wallet' ||
      tx.state.phase === 'submitted' ||
      tx.state.phase === 'consensus');

  return (
    <>
      <StarfieldBackground />
      <HudHeader wallet={wallet} era={world.era} />

      <main>
        <Hero wallet={wallet} onEnter={scrollToFoundry} />

        <DataErrorBoundary label="era briefing">
          <EraBriefing
            era={world.era}
            stats={world.stats}
            connected={!!wallet.address}
            advancing={eraAdvancing}
            onAdvance={handleAdvanceEra}
          />
        </DataErrorBoundary>

        <Foundry
          parcels={world.parcels}
          selectedParcelId={selectedParcelId}
          onSelectParcel={setSelectedParcelId}
          connected={!!wallet.address}
          submitting={buildSubmitting}
          onSubmit={handleSubmitBuild}
        />

        <DataErrorBoundary label="dominion map">
          <DominionMap
            parcels={world.parcels}
            loading={world.loading}
            error={world.error}
            diagnostic={world.diagnostic}
            selectedParcelId={selectedParcelId}
            capturedId={capturedId}
            onSelect={onSelectFromMap}
            onRetry={world.refresh}
          />
        </DataErrorBoundary>

        <DataErrorBoundary label="dynasty">
          <Dynasty
            parcels={world.parcels}
            walletAddress={wallet.address}
            loading={world.loading}
            error={world.error}
            diagnostic={world.diagnostic}
            onRetry={world.refresh}
          />
        </DataErrorBoundary>

        <DataErrorBoundary label="chronicle">
          <Chronicle
            entries={world.chronicle}
            loading={world.loading}
            error={world.error}
            diagnostic={world.diagnostic}
            onRetry={world.refresh}
          />
        </DataErrorBoundary>

        <Codex />
        <Footer />
      </main>

      <ConsensusTheater
        open={theaterOpen}
        state={tx.state}
        captured={captured}
        onClose={closeTheater}
        onRetry={retryFromTheater}
      />

      <ToastStack toasts={toasts.toasts} onDismiss={toasts.dismiss} />

      {wallet.error && (
        <div
          role="alert"
          className="fixed bottom-4 left-4 z-[120] max-w-xs rounded-lg border border-[rgba(255,84,112,0.4)] bg-surface2 p-3 text-sm text-danger"
        >
          {wallet.error}
        </div>
      )}
    </>
  );
}
