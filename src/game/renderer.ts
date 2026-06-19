import type { Body, Ship, Vec2 } from './types';

export interface RenderState {
  bodies: Body[];
  ship: Ship;
  trajectory: Vec2[];
  camera: Vec2;
  stars: Array<{ x: number; y: number; size: number; brightness: number }>;
  time: number;
  targetId?: string;
  width: number;
  height: number;
  worldToScreen: (p: Vec2) => Vec2;
}

function speedToColor(speedRatio: number): string {
  const t = Math.max(0, Math.min(1, speedRatio));
  const r = Math.floor(94 + t * 161);
  const g = Math.floor(242 - t * 148);
  const b = Math.floor(255 - t * 160);
  return `rgb(${r},${g},${b})`;
}

export function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, stars: RenderState['stars']): void {
  const grad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h) * 0.8);
  grad.addColorStop(0, '#0a0d25');
  grad.addColorStop(0.6, '#06081a');
  grad.addColorStop(1, '#02030a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (const s of stars) {
    ctx.globalAlpha = s.brightness;
    ctx.fillStyle = '#cfe9ff';
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }
  ctx.globalAlpha = 1;
}

export function drawBody(ctx: CanvasRenderingContext2D, b: Body, worldToScreen: (p: Vec2) => Vec2, time: number, isTarget: boolean): void {
  const screen = worldToScreen(b.pos);
  const scale = 1;
  const r = b.radius * scale;

  if (b.orbitRadius !== undefined && !b.isStar) {
    const starScreen = worldToScreen({ x: b.pos.x - Math.cos(b.orbitAngle ?? 0) * b.orbitRadius, y: b.pos.y - Math.sin(b.orbitAngle ?? 0) * b.orbitRadius });
    ctx.beginPath();
    ctx.arc(starScreen.x, starScreen.y, b.orbitRadius * scale, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(94, 242, 255, 0.14)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (b.isStar) {
    const glowR = r + 40 + Math.sin(time * 1.5) * 6;
    const g1 = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, glowR);
    g1.addColorStop(0, 'rgba(255, 230, 130, 0.9)');
    g1.addColorStop(0.3, 'rgba(255, 190, 80, 0.5)');
    g1.addColorStop(0.7, 'rgba(255, 120, 40, 0.12)');
    g1.addColorStop(1, 'rgba(255, 80, 20, 0)');
    ctx.fillStyle = g1;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, glowR, 0, Math.PI * 2);
    ctx.fill();

    const g2 = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, r);
    g2.addColorStop(0, '#fff4c0');
    g2.addColorStop(0.6, b.color);
    g2.addColorStop(1, '#ff9530');
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, r, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const g1 = ctx.createRadialGradient(screen.x - r * 0.3, screen.y - r * 0.3, 0, screen.x, screen.y, r * 1.6);
    g1.addColorStop(0, b.glow);
    g1.addColorStop(0.5, b.color);
    g1.addColorStop(1, '#0a0e22');
    ctx.fillStyle = g1;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, r, 0, Math.PI * 2);
    ctx.clip();
    const atmosphere = ctx.createRadialGradient(screen.x, screen.y, r * 0.3, screen.x, screen.y, r);
    atmosphere.addColorStop(0, 'rgba(255,255,255,0)');
    atmosphere.addColorStop(0.7, `${b.glow}18`);
    atmosphere.addColorStop(1, `${b.glow}55`);
    ctx.fillStyle = atmosphere;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (isTarget) {
    const pulse = 1 + Math.sin(time * 4) * 0.12;
    ctx.strokeStyle = '#5ef2ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#5ef2ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, (r + 10) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const innerR = r + 16;
    for (let i = 0; i < 4; i++) {
      const ang = time * 1.2 + (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(screen.x + Math.cos(ang) * (innerR - 4), screen.y + Math.sin(ang) * (innerR - 4));
      ctx.lineTo(screen.x + Math.cos(ang) * (innerR + 8), screen.y + Math.sin(ang) * (innerR + 8));
      ctx.stroke();
    }
  }
}

export function drawTrajectory(ctx: CanvasRenderingContext2D, points: Vec2[], worldToScreen: (p: Vec2) => Vec2, maxSpeed: number): void {
  if (points.length < 2) return;
  for (let i = 1; i < points.length; i++) {
    const p1 = worldToScreen(points[i - 1]);
    const p2 = worldToScreen(points[i]);
    const progress = i / points.length;
    const speed = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y) * 120;
    const color = speedToColor(speed / maxSpeed);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.7 - progress * 0.55;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);

  const last = points[points.length - 1];
  const lastScreen = worldToScreen(last);
  ctx.fillStyle = 'rgba(94, 242, 255, 0.7)';
  ctx.shadowColor = '#5ef2ff';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(lastScreen.x, lastScreen.y, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

export function drawShip(ctx: CanvasRenderingContext2D, ship: Ship, worldToScreen: (p: Vec2) => Vec2, time: number): void {
  const screen = worldToScreen(ship.pos);

  if (ship.trail.length > 1) {
    for (let i = 1; i < ship.trail.length; i++) {
      const p1 = worldToScreen(ship.trail[i - 1]);
      const p2 = worldToScreen(ship.trail[i]);
      const alpha = i / ship.trail.length;
      ctx.strokeStyle = `rgba(94, 242, 255, ${alpha * 0.35})`;
      ctx.lineWidth = alpha * 2;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  if (ship.thrusting) {
    const flameLen = 14 + Math.random() * 10;
    const fx = screen.x - Math.cos(ship.heading) * flameLen;
    const fy = screen.y - Math.sin(ship.heading) * flameLen;
    const perpX = -Math.sin(ship.heading);
    const perpY = Math.cos(ship.heading);

    const g = ctx.createRadialGradient(screen.x, screen.y, 0, fx, fy, flameLen);
    g.addColorStop(0, 'rgba(255, 220, 120, 0.95)');
    g.addColorStop(0.4, 'rgba(255, 140, 60, 0.7)');
    g.addColorStop(1, 'rgba(255, 60, 30, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(screen.x + perpX * 4, screen.y + perpY * 4);
    ctx.lineTo(fx, fy);
    ctx.lineTo(screen.x - perpX * 4, screen.y - perpY * 4);
    ctx.closePath();
    ctx.fill();

    for (let p = 0; p < 4; p++) {
      const t = Math.random();
      const px = screen.x - Math.cos(ship.heading) * flameLen * t;
      const py = screen.y - Math.sin(ship.heading) * flameLen * t;
      ctx.fillStyle = `rgba(255, 190, 100, ${0.6 - t * 0.6})`;
      ctx.beginPath();
      ctx.arc(px + (Math.random() - 0.5) * 4, py + (Math.random() - 0.5) * 4, 2 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.save();
  ctx.translate(screen.x, screen.y);
  ctx.rotate(ship.heading);

  ctx.shadowColor = '#5ef2ff';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#e8f7ff';
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-10, -7);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-10, 7);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#5ef2ff';
  ctx.beginPath();
  ctx.arc(2, 0, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#5ef2ff';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();

  if (!ship.alive) {
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + time;
      const d = 20 + (time % 1) * 30;
      ctx.fillStyle = `rgba(255, 120, 80, ${1 - (time % 1)})`;
      ctx.beginPath();
      ctx.arc(screen.x + Math.cos(ang) * d, screen.y + Math.sin(ang) * d, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawGravityOverlay(ctx: CanvasRenderingContext2D, bodies: Body[], _worldToScreen: (p: Vec2) => Vec2, w: number, h: number): void {
  const step = 36;
  for (let x = 0; x < w; x += step) {
    for (let y = 0; y < h; y += step) {
      let fx = 0;
      let fy = 0;
      for (const b of bodies) {
        const dx = b.pos.x - x;
        const dy = b.pos.y - y;
        const distSq = dx * dx + dy * dy + 20 * 20;
        const dist = Math.sqrt(distSq);
        const f = (1200 * b.mass) / distSq;
        fx += (f * dx) / dist;
        fy += (f * dy) / dist;
      }
      const mag = Math.hypot(fx, fy);
      if (mag < 2) continue;
      const len = Math.min(14, mag * 0.04);
      const nx = fx / mag;
      const ny = fy / mag;
      ctx.strokeStyle = `rgba(94, 242, 255, ${Math.min(0.4, mag * 0.0008)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - nx * len * 0.5, y - ny * len * 0.5);
      ctx.lineTo(x + nx * len * 0.5, y + ny * len * 0.5);
      ctx.stroke();
    }
  }
}
