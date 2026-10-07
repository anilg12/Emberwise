// small confetti burst on a temp canvas, ~2s and then it removes itself

const COLORS = ['#f0743e', '#f6a43a', '#ffd166', '#3e9b6e', '#4a78c2', '#d0567c', '#8a6bd1'];

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  vr: number;
  w: number;
  h: number;
  c: string;
  shape: 0 | 1;
}

let active = 0;

export function burst(opts: { x?: number; y?: number; count?: number; spread?: number } = {}) {
  if (typeof document === 'undefined' || active > 2) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth;
  const H = window.innerHeight;
  const canvas = document.createElement('canvas');
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);
  active++;

  const ox = opts.x ?? W / 2;
  const oy = opts.y ?? H * 0.42;
  const count = opts.count ?? 110;
  const spread = opts.spread ?? 1;
  const pieces: Piece[] = [];
  for (let i = 0; i < count; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1 * spread;
    const speed = 6 + Math.random() * 9;
    pieces.push({
      x: ox,
      y: oy,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 2,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 5,
      c: COLORS[(Math.random() * COLORS.length) | 0],
      shape: Math.random() < 0.3 ? 1 : 0,
    });
  }

  const start = performance.now();
  const life = 2100;
  let last = start;
  const frame = (now: number) => {
    const dt = Math.min(2.2, (now - last) / 16.67);
    last = now;
    const age = now - start;
    ctx.clearRect(0, 0, W, H);
    const fade = age > life - 500 ? Math.max(0, (life - age) / 500) : 1;
    for (const p of pieces) {
      p.vy += 0.32 * dt;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.r += p.vr * dt;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      if (p.shape === 1) {
        ctx.beginPath();
        ctx.arc(0, 0, p.h * 0.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)) + 1);
      }
      ctx.restore();
    }
    if (age < life) requestAnimationFrame(frame);
    else {
      canvas.remove();
      active--;
    }
  };
  requestAnimationFrame(frame);
}
