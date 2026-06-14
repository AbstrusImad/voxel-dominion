'use client';

import { CONTRACT_ADDRESS, DEPLOY_TX, EXPLORER, FAUCET } from '@/lib/contract';
import { isClaimed, shortAddress } from '@/lib/format';
import { Copyable, ExtLink } from './Copyable';

export function Footer() {
  const live = isClaimed(CONTRACT_ADDRESS);
  return (
    <footer aria-label="Telemetry" className="relative mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6">
      <div className="panel frame scanlines overflow-hidden rounded-2xl p-5 font-mono text-xs sm:p-6">
        <div className="flex items-center gap-2 text-faint">
          <span className="h-2 w-2 rounded-full bg-success" aria-hidden />
          <span className="uppercase tracking-[0.2em]">voxel-dominion telemetry</span>
        </div>
        <div className="mt-4 space-y-1.5 leading-relaxed text-muted">
          <p>
            <span className="text-faint">network</span> :: GenLayer Bradbury Testnet (chain 4221)
          </p>
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-faint">contract</span> ::{' '}
            {live ? (
              <ExtLink
                href={`${EXPLORER}/address/${CONTRACT_ADDRESS}`}
                className="text-accent2 hover:underline"
              >
                {shortAddress(CONTRACT_ADDRESS, 8)}
              </ExtLink>
            ) : (
              <span className="text-faint">awaiting deployment</span>
            )}
            <Copyable value={CONTRACT_ADDRESS} display="copy" />
          </p>
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-faint">deploy_tx</span> ::{' '}
            {isClaimed(DEPLOY_TX) ? (
              <ExtLink href={`${EXPLORER}/tx/${DEPLOY_TX}`} className="text-accent2 hover:underline">
                {shortAddress(DEPLOY_TX, 8)}
              </ExtLink>
            ) : (
              <span className="text-faint">pending</span>
            )}
          </p>
          <p>
            <span className="text-faint">faucet</span> ::{' '}
            <ExtLink href={FAUCET} className="text-accent2 hover:underline">
              testnet-faucet.genlayer.foundation
            </ExtLink>
          </p>
        </div>
        <p className="mt-5 border-t border-[var(--hairline)] pt-4 text-faint">
          VOXEL DOMINION :: raise, judge, seize :: built on GenLayer
        </p>
      </div>
    </footer>
  );
}
