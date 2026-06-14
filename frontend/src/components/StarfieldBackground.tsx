'use client';

import { useEffect, useRef } from 'react';

// Generative deep-space starfield and nebula painted on a 2D canvas. Cheap
// enough to sit behind every section. The animation loop pauses when the tab
// is hidden and idles entirely under prefers-reduced-motion.
export function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;

    interface Star {
      x: number;
      y: number;
      z: number; // parallax depth 0..1
      r: number;
      tw: number; // twinkle phase
      hue: number;
    }
    interface Neb {
      x: number;
      y: number;
      r: number;
      hue: number;
      a: number;
    }

    let stars: Star[] = [];
    let nebulae: Neb[] = [];

    const build = () => {
      const count = Math.min(260, Math.floor((width * height) / 7000));
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: Math.random(),
          r: Math.random() * 1.4 + 0.2,
          tw: Math.random() * Math.PI * 2,
          hue: Math.random() < 0.5 ? 184 : Math.random() < 0.5 ? 28 : 230,
        });
      }
      nebulae = [];
      const nc = 5;
      const palette = [184, 28, 262, 150];
      for (let i = 0; i < nc; i++) {
        nebulae.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.max(width, height) * (0.28 + Math.random() * 0.3),
          hue: palette[i % palette.length],
          a: 0.05 + Math.random() * 0.05,
        });
      }
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };

    const drawNebulae = () => {
      for (const n of nebulae) {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        g.addColorStop(0, `hsla(${n.hue}, 80%, 55%, ${n.a})`);
        g.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);
      }
    };

    let raf = 0;
    let t = 0;
    const frame = () => {
      t += 0.016;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#05060a';
      ctx.fillRect(0, 0, width, height);
      drawNebulae();
      for (const s of stars) {
        const tw = reduced ? 0.85 : 0.55 + 0.45 * Math.sin(t * (0.6 + s.z) + s.tw);
        ctx.globalAlpha = tw * (0.4 + s.z * 0.6);
        ctx.fillStyle = `hsl(${s.hue}, 70%, ${70 + s.z * 20}%)`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduced) raf = requestAnimationFrame(frame);
    };

    resize();
    frame();

    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else if (!reduced) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
