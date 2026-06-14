'use client';

import { Canvas, ThreeEvent } from '@react-three/fiber';
import { Instance, Instances, OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, SMAA } from '@react-three/postprocessing';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { MATERIALS, VOXELS } from '@/lib/contract';
import { Voxel, voxelKey } from '@/lib/voxel';

const GRID = 16;
const OFF = GRID / 2 - 0.5; // center the grid on the origin
// usable build area: a 12-wide footprint centered in the 16 grid, 12 tall
const LO = 2;
const HI = 13;
const Y_MAX = 11;

const worldPos = (x: number, y: number, z: number): [number, number, number] => [
  x - OFF,
  y + 0.5,
  z - OFF,
];

function inBounds(c: { x: number; y: number; z: number }): boolean {
  return c.x >= LO && c.x <= HI && c.z >= LO && c.z <= HI && c.y >= 0 && c.y <= Y_MAX;
}

interface BuilderSceneProps {
  voxels: Voxel[];
  activeMaterial: number;
  removeMode: boolean;
  onPlace: (v: Voxel) => void;
  onRemove: (key: string) => void;
}

function BuilderScene({ voxels, activeMaterial, removeMode, onPlace, onRemove }: BuilderSceneProps) {
  const [hover, setHover] = useState<{ x: number; y: number; z: number } | null>(null);
  const [hoverRemove, setHoverRemove] = useState(false);

  const occupied = useMemo(() => {
    const s = new Set<string>();
    for (const v of voxels) s.add(voxelKey(v.x, v.y, v.z));
    return s;
  }, [voxels]);

  const byMat = useMemo(() => {
    const m = new Map<number, Voxel[]>();
    for (const v of voxels) {
      const arr = m.get(v.c) ?? [];
      arr.push(v);
      m.set(v.c, arr);
    }
    return Array.from(m.entries());
  }, [voxels]);

  const targetFromNormal = (v: Voxel, n: THREE.Vector3 | undefined) => {
    if (!n) return null;
    return { x: v.x + Math.round(n.x), y: v.y + Math.round(n.y), z: v.z + Math.round(n.z) };
  };

  const onGroundMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (removeMode) {
      setHover(null);
      return;
    }
    const p = e.point;
    const cell = { x: Math.round(p.x + OFF), y: 0, z: Math.round(p.z + OFF) };
    if (!inBounds(cell) || occupied.has(voxelKey(cell.x, cell.y, cell.z))) {
      setHover(null);
      return;
    }
    setHoverRemove(false);
    setHover(cell);
  };

  const onGroundClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (removeMode) return;
    const p = e.point;
    const cell = { x: Math.round(p.x + OFF), y: 0, z: Math.round(p.z + OFF) };
    if (!inBounds(cell) || occupied.has(voxelKey(cell.x, cell.y, cell.z))) return;
    onPlace({ ...cell, c: activeMaterial });
  };

  const onVoxelMove = (v: Voxel) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const remove = removeMode || e.nativeEvent.shiftKey;
    if (remove) {
      setHoverRemove(true);
      setHover({ x: v.x, y: v.y, z: v.z });
      return;
    }
    const t = targetFromNormal(v, e.face?.normal);
    if (!t || !inBounds(t) || occupied.has(voxelKey(t.x, t.y, t.z))) {
      setHover(null);
      return;
    }
    setHoverRemove(false);
    setHover(t);
  };

  const onVoxelClick = (v: Voxel) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const remove = removeMode || e.nativeEvent.shiftKey;
    if (remove) {
      onRemove(voxelKey(v.x, v.y, v.z));
      return;
    }
    const t = targetFromNormal(v, e.face?.normal);
    if (!t || !inBounds(t) || occupied.has(voxelKey(t.x, t.y, t.z))) return;
    onPlace({ ...t, c: activeMaterial });
  };

  const ghostColor = hoverRemove ? '#ff5470' : MATERIALS[activeMaterial].color;

  return (
    <group>
      <ambientLight intensity={0.45} color="#9fb4d8" />
      <directionalLight position={[10, 16, 8]} intensity={1.5} color="#fff1e0" />
      <pointLight position={[-12, 8, -8]} intensity={1.4} color="#3df0e0" distance={48} />

      {/* build floor for first-layer placement */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerMove={onGroundMove}
        onClick={onGroundClick}
        onPointerOut={() => setHover(null)}
      >
        <planeGeometry args={[GRID, GRID]} />
        <meshStandardMaterial
          color="#0c0f17"
          roughness={0.9}
          metalness={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* usable build pad highlight */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[HI - LO + 1, HI - LO + 1]} />
        <meshBasicMaterial color="#3df0e0" transparent opacity={0.05} />
      </mesh>

      <gridHelper args={[GRID, GRID, '#3df0e0', '#222a3a']} position={[0, 0.02, 0]} />

      {byMat.map(([mat, list]) => {
        const meta = MATERIALS[mat];
        return (
          <Instances key={mat} limit={VOXELS.max} range={list.length}>
            <boxGeometry args={[0.96, 0.96, 0.96]} />
            <meshStandardMaterial
              color={meta.color}
              emissive={meta.color}
              emissiveIntensity={0.18}
              roughness={0.35}
              metalness={0.4}
              envMapIntensity={0.65}
            />
            {list.map((v) => (
              <Instance
                key={voxelKey(v.x, v.y, v.z)}
                position={worldPos(v.x, v.y, v.z)}
                onPointerMove={onVoxelMove(v)}
                onClick={onVoxelClick(v)}
              />
            ))}
          </Instances>
        );
      })}

      {/* hovered-cell ghost */}
      {hover && (
        <mesh position={worldPos(hover.x, hover.y, hover.z)}>
          <boxGeometry args={[1.02, 1.02, 1.02]} />
          <meshBasicMaterial color={ghostColor} wireframe transparent opacity={0.9} />
        </mesh>
      )}

      <OrbitControls
        enablePan={false}
        minDistance={10}
        maxDistance={42}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, 2, 0]}
        makeDefault
      />
    </group>
  );
}

export interface VoxelBuilderProps {
  voxels: Voxel[];
  activeMaterial: number;
  removeMode: boolean;
  onPlace: (v: Voxel) => void;
  onRemove: (key: string) => void;
}

export default function VoxelBuilder(props: VoxelBuilderProps) {
  const [reduced, setReduced] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    const onVis = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      mq.removeEventListener('change', onChange);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Builder is interactive, so it renders on demand (pointer + control events)
  // when reduced motion is requested, and pauses entirely when the tab hides.
  const frameloop = hidden ? 'never' : reduced ? 'demand' : 'always';

  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 2]}
      camera={{ position: [16, 14, 18], fov: 45 }}
      gl={{
        antialias: false,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.Fog('#05060a', 30, 70);
      }}
    >
      <Suspense fallback={null}>
        <Environment files="/space-nebula.jpg" />
        <BuilderScene {...props} />
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={0.5} luminanceSmoothing={0.2} intensity={0.7} radius={0.6} />
          <SMAA />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
