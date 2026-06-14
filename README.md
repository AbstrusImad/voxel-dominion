# VOXEL DOMINION

A war for a floating voxel world, settled by an AI. You raise a structure block by block, the World Spirit judges how well it embodies the current age, and a strong enough verdict seizes a parcel of the map. The judgment is not a script: it runs as an Intelligent Contract on GenLayer, under validator consensus.

This is a field manual. Read the parts you need.

## I. The premise

The world is twenty four parcels of contested ground. There are no deposits and no stakes; you pay only network fees. What you spend is craft. Each age rewards a different virtue (height, symmetry, density, restraint, color, monolithic purity, sprawl, or spires), and the same tower that conquers in one age is mediocre in the next. Hold ground long enough and the age will turn against you: when an era advances, erosion weakens every standing claim, and the map is open again.

## II. The loop

1. Pick a parcel on the Dominion Map. Empty ground is free to take; held ground must be out-built.
2. Open the Foundry and build. Place and remove voxels in real time on a twelve by twelve pad, up to two hundred fifty six blocks, from a palette of eight materials.
3. Name the work, add a line of intent, and submit it to the World Spirit.
4. The verdict returns as MASTERWORK, WORTHY, WEAK, or REJECT with a score from zero to one hundred. WORTHY or better, at least fifty, and above the current holder's score takes the parcel.
5. Watch the Chronicle. When enough has changed, turn the age and reshape what counts as great.

## III. Where GenLayer does the work

The contract measures your structure deterministically on chain first: block count, height, footprint, materials, and a mirror symmetry percentage. Those trustworthy facts, plus the active age and your untrusted intent text, go to the model.

- The leader runs `gl.nondet.exec_prompt` and returns a strict JSON verdict.
- Every validator re-runs the same judgment and compares: the verdict label must match exactly, and the numeric score must fall within a tolerance band. Disagreement past that band is a deterministic violation, and the round is rejected.
- The capture itself is never trusted to the model. After consensus, code decides whether the score beats the standing claim and applies the state change. Prompt rules deter; the deterministic backstop enforces.

Confidential by design: the prompt treats builder intent as data, never instructions, and an attempt to hijack the judge resolves to REJECT.

## IV. The contract surface

Writes:
- `submit_build(parcel_id, title, voxels, intent)` the consensus write; judges and possibly captures.
- `advance_era()` deterministic, no model; turns the age and erodes every claim.

Reads (paged, consensus-friendly):
- `get_stats()` world totals and the active age.
- `get_era()` the active age, its rule, and what it favors.
- `get_parcels(start)` all twenty four parcels with their winning structure string.
- `get_chronicle(start)` recent verdicts and age turns, newest first.

The voxel wire format is compact on purpose: `x,y,z,c` per block, joined by `|`, with coordinates in zero to fifteen and material in zero to seven.

## V. The build

The frontend is a static single page, no backend, talking to the chain through `genlayer-js`. The hero and the Foundry are real Three.js: instanced cubes, fog, layered lighting, a rotating floating island, and a face raycaster that snaps placement to the grid. The Dominion Map projects each parcel's winning structure as an isometric voxel glyph tinted by its holder, so the board reads at a glance without twenty four live canvases. Reads are paged and polled slowly; polling pauses while a transaction is in flight. The consensus wait is staged as theater, with the leader's draft verdict surfaced from the receipt while the validators seal it.

Stack: Next.js 14 static export, React Three Fiber and drei, framer-motion, genlayer-js, Chakra Petch and Inter and JetBrains Mono. No emojis, no mock data, every button hits the chain.

## VI. Standing orders

Fund a wallet with test GEN before you build; an AI write reserves a fee that is mostly refunded. Claim at the faucet. A write can take one to five minutes under load, and a rotating leader is normal, not a failure. Hold nothing as permanent: the age will turn.

```ini
[deployment]
network   = GenLayer Bradbury Testnet
live      = https://voxel-dominion.pages.dev/
contract  = 0xB060d7Ed7529c6c3Fd3f8F345C13A22A3b220636
explorer  = https://explorer-bradbury.genlayer.com/address/0xB060d7Ed7529c6c3Fd3f8F345C13A22A3b220636
deploy_tx = 0xd7f778e5d7acabfe6f3796a8488179072827036b3aec00c400969b022d74b5aa
faucet    = https://testnet-faucet.genlayer.foundation/
```
