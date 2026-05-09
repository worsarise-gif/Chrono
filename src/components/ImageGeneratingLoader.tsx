"use client";
import { useEffect, useRef } from "react";

const DOT_SPACING = 36, DOT_SIZE = 5, INERTIA = 0.88;
const REPEL_RADIUS = 90, REPEL_STRENGTH = 18;
const WAVE_AMPLITUDE = 6, WAVE_SPEED = 0.0018, WAVE_FREQ = 0.012;

interface Dot {
  ox: number;
  oy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export default function ImageGeneratingLoader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -999, y: -999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    let dots: Dot[] = [];
    let animId: number;

    function resize() {
      if (!canvas) return;
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      const cols = Math.ceil(W / DOT_SPACING) + 1;
      const rows = Math.ceil(H / DOT_SPACING) + 1;
      dots = Array.from({ length: cols * rows }, (_, i) => {
        const ox = (i % cols) * DOT_SPACING + DOT_SPACING / 2;
        const oy = Math.floor(i / cols) * DOT_SPACING + DOT_SPACING / 2;
        return { ox, oy, x: ox, y: oy, vx: 0, vy: 0 };
      });
    }

    function draw(t: number) {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const W = canvas.width / dpr, H = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const { x: mx, y: my } = mouseRef.current;

      dots.forEach(d => {
        const dx = d.ox - cx, dy = d.oy - cy;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const wave = Math.sin(dist * WAVE_FREQ - t * WAVE_SPEED) * WAVE_AMPLITUDE;
        const tx = d.ox + Math.cos(angle) * wave;
        const ty = d.oy + Math.sin(angle) * wave;
        const md = Math.hypot(d.x - mx, d.y - my);
        if (md < REPEL_RADIUS && md > 0) {
          const f = (1 - md / REPEL_RADIUS) * REPEL_STRENGTH;
          d.vx += ((d.x - mx) / md) * f;
          d.vy += ((d.y - my) / md) * f;
        }
        d.vx += (tx - d.x) * 0.05; d.vy += (ty - d.y) * 0.05;
        d.vx *= INERTIA; d.vy *= INERTIA;
        d.x += d.vx; d.y += d.vy;
        const edist = Math.hypot(d.x - cx, d.y - cy);
        const maxDist = Math.hypot(cx, cy);
        const alpha = Math.min(1, (0.25 + 0.75 * (1 - edist / maxDist)) *
          (0.7 + 0.3 * Math.sin(dist * WAVE_FREQ - t * WAVE_SPEED)));
        ctx.beginPath();
        ctx.arc(d.x, d.y, DOT_SIZE / 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const handleMouseLeave = () => { mouseRef.current = { x: -999, y: -999 }; };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="w-full max-w-lg rounded-2xl overflow-hidden relative aspect-square border border-border bg-black">
      <canvas ref={canvasRef} className="w-full h-full block cursor-none" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h1 className="text-white text-4xl font-bold">Generating</h1>
      </div>
    </div>
  );
}
