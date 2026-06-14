'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Instance, Instances, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { MATERIALS } from '@/lib/contract';

interface Cube {
  pos: [number, number, number];
  mat: number;
  scale: number;
}

// Deterministic pseudo-random so the island is stable between renders.
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// Build a floating voxel island: a layered disc of terrain with a scatter of
// crystal spires and structures rising from it.
function buildIsland(): Cube[] {
  const rng = makeRng(0xb0a71);
  const cubes: Cube[] = [];
  const R = 9;
  for (let layer = 0; layer < 4; layer++) {
    const r = R - layer * 1.6;
    const y = -layer;
    for (let x = -R; x <= R; x++) {
      for (let z = -R; z <= R; z++) {
        const d = Math.sqrt(x * x + z * z);
        if (d > r) continue;
        // ragged underside
        if (layer > 0 && d > r - 1 && rng() > 0.5) continue;
        const mat = layer === 0 ? (rng() > 0.78 ? 3 : 7) : 7;
        cubes.push({ pos: [x, y, z], mat, scale: 1 });
      }
    }
  }
  // surface structures: a few towers and crystals
  const towers = 7;
  for (let i = 0; i < towers; i++) {
    const tx = Math.floor((rng() - 0.5) * 12);
    const tz = Math.floor((rng() - 0.5) * 12);
    if (Math.sqrt(tx * tx + tz * tz) > R - 2) continue;
    const h = 2 + Math.floor(rng() * 4);
    const mat = [0, 1, 2, 4, 5][Math.floor(rng() * 5)];
    for (let y = 1; y <= h; y++) {
      cubes.push({ pos: [tx, y, tz], mat: y === h ? mat : 6, scale: 1 });
    }
    // crown crystal
    cubes.push({ pos: [tx, h + 1, tz], mat, scale: 0.7 });
  }
  // floating shards above
  for (let i = 0; i < 16; i++) {
    const sx = (rng() - 0.5) * 18;
    const sz = (rng() - 0.5) * 18;
    const sy = 3 + rng() * 6;
    cubes.push({ pos: [sx, sy, sz], mat: Math.floor(rng() * 6), scale: 0.4 + rng() * 0.4 });
  }
  return cubes;
}

function IslandGroup({ paused }: { paused: boolean }) {
  const group = useRef<THREE.Group>(null);
  const cubes = useMemo(buildIsland, []);

  const byMat = useMemo(() => {
    const m = new Map<number, Cube[]>();
    for (const c of cubes) {
      const arr = m.get(c.mat) ?? [];
      arr.push(c);
      m.set(c.mat, arr);
    }
    return Array.from(m.entries());
  }, [cubes]);

  useFrame((_, delta) => {
    if (paused || !group.current) return;
    group.current.rotation.y += delta * 0.12;
    group.current.position.y = Math.sin(performance.now() * 0.0004) * 0.4;
  });

  return (
    <group ref={group}>
      {byMat.map(([mat, list]) => {
        const meta = MATERIALS[mat];
        const bright = mat === 6 || mat === 7;
        return (
          <Instances key={mat} limit={list.length} range={list.length}>
            <boxGeometry args={[0.94, 0.94, 0.94]} />
            <meshStandardMaterial
              color={meta.color}
              emissive={meta.color}
              emissiveIntensity={bright ? 0.08 : 0.55}
              roughness={0.38}
              metalness={0.38}
              envMapIntensity={0.7}
            />
            {list.map((c, i) => (
              <Instance key={i} position={c.pos} scale={c.scale} />
            ))}
          </Instances>
        );
      })}
    </group>
  );
}

// Slow-drifting motes of light dust for depth.
function Dust() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 240;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 44;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 26;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 44;
    }
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.y += d * 0.02;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.09}
        color="#9fb4d8"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export default function HeroScene() {
  const [frameloop, setFrameloop] = useState<'always' | 'never'>('always');
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);

    const onVis = () => setFrameloop(document.hidden ? 'never' : 'always');
    document.addEventListener('visibilitychange', onVis);
    return () => {
      mq.removeEventListener('change', onChange);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const paused = reduced || frameloop === 'never';

  return (
    <Canvas
      frameloop={reduced ? 'demand' : frameloop}
      dpr={[1, 2]}
      camera={{ position: [14, 11, 16], fov: 42 }}
      gl={{
        antialias: false,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.Fog('#05060a', 24, 54);
      }}
    >
      <Suspense fallback={null}>
        <Environment files="/space-nebula.jpg" background backgroundBlurriness={0} />
        <ambientLight intensity={0.25} color="#9fb4d8" />
        <directionalLight position={[12, 18, 8]} intensity={1.5} color="#fff1e0" />
        <pointLight position={[-14, 6, -10]} intensity={2.0} color="#3df0e0" distance={50} />
        <pointLight position={[8, -4, 12]} intensity={1.0} color="#ff7a18" distance={40} />
        <IslandGroup paused={paused} />
        <Dust />
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={0.35} luminanceSmoothing={0.2} intensity={0.95} radius={0.7} />
          <Vignette eskil={false} offset={0.25} darkness={0.7} />
          <SMAA />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
