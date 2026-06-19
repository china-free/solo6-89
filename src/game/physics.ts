import type { Vec2, Body, Ship, InputState, GameConfig } from './types';

export const DEFAULT_CONFIG: GameConfig = {
  G: 1200,
  softening: 12,
  dt: 1 / 120,
  trajectorySeconds: 10,
  trajectorySteps: 240,
  maxTrail: 120,
  dockDistance: 28,
  dockMaxSpeed: 35,
  crashMaxSpeed: 95,
  initialFuel: 100,
  maxFuel: 160,
  thrustPower: 220,
  fuelBurnRate: 18,
  turnRate: 2.8,
};

export function vec(x: number, y: number): Vec2 {
  return { x, y };
}

export function vAdd(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function vSub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function vScale(a: Vec2, s: number): Vec2 {
  return { x: a.x * s, y: a.y * s };
}

export function vLen(a: Vec2): number {
  return Math.hypot(a.x, a.y);
}

export function vLenSq(a: Vec2): number {
  return a.x * a.x + a.y * a.y;
}

export function vNorm(a: Vec2): Vec2 {
  const l = vLen(a);
  if (l < 1e-8) return { x: 0, y: 0 };
  return { x: a.x / l, y: a.y / l };
}

export function vDist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function vDistSq(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function gravityAt(
  point: Vec2,
  bodies: Body[],
  G: number,
  softening: number
): Vec2 {
  let ax = 0;
  let ay = 0;
  for (const b of bodies) {
    const dx = b.pos.x - point.x;
    const dy = b.pos.y - point.y;
    const distSq = dx * dx + dy * dy + softening * softening;
    const dist = Math.sqrt(distSq);
    const f = (G * b.mass) / distSq;
    ax += (f * dx) / dist;
    ay += (f * dy) / dist;
  }
  return { x: ax, y: ay };
}

export function integrateShip(
  ship: Ship,
  bodies: Body[],
  input: InputState,
  cfg: GameConfig,
  dt: number
): void {
  if (!ship.alive) return;

  if (input.turnLeft) ship.heading -= ship.turnRate * dt;
  if (input.turnRight) ship.heading += ship.turnRate * dt;

  ship.thrusting = false;
  let thrustAccel = { x: 0, y: 0 };
  if (input.thrust && ship.fuel > 0) {
    ship.thrusting = true;
    const ax = Math.cos(ship.heading) * cfg.thrustPower;
    const ay = Math.sin(ship.heading) * cfg.thrustPower;
    thrustAccel = { x: ax, y: ay };
    ship.fuel = Math.max(0, ship.fuel - cfg.fuelBurnRate * dt);
  }

  const a0 = vAdd(gravityAt(ship.pos, bodies, cfg.G, cfg.softening), thrustAccel);
  const halfDt = dt * 0.5;
  const newPos = {
    x: ship.pos.x + ship.vel.x * dt + a0.x * halfDt * dt,
    y: ship.pos.y + ship.vel.y * dt + a0.y * halfDt * dt,
  };
  const a1 = vAdd(gravityAt(newPos, bodies, cfg.G, cfg.softening), thrustAccel);
  const newVel = {
    x: ship.vel.x + (a0.x + a1.x) * halfDt,
    y: ship.vel.y + (a0.y + a1.y) * halfDt,
  };

  ship.pos = newPos;
  ship.vel = newVel;

  ship.trail.push({ ...ship.pos });
  if (ship.trail.length > cfg.maxTrail) ship.trail.shift();
}

export function predictTrajectory(
  ship: Ship,
  bodies: Body[],
  cfg: GameConfig,
  thrusting: boolean
): Vec2[] {
  const dt = cfg.trajectorySeconds / cfg.trajectorySteps;
  const points: Vec2[] = [];
  let pos = { ...ship.pos };
  let vel = { ...ship.vel };
  const heading = ship.heading;

  const thrustAccel = thrusting
    ? {
        x: Math.cos(heading) * cfg.thrustPower,
        y: Math.sin(heading) * cfg.thrustPower,
      }
    : { x: 0, y: 0 };

  for (let i = 0; i < cfg.trajectorySteps; i++) {
    const a0 = vAdd(gravityAt(pos, bodies, cfg.G, cfg.softening), thrustAccel);
    const halfDt = dt * 0.5;
    const newPos = {
      x: pos.x + vel.x * dt + a0.x * halfDt * dt,
      y: pos.y + vel.y * dt + a0.y * halfDt * dt,
    };
    const a1 = vAdd(gravityAt(newPos, bodies, cfg.G, cfg.softening), thrustAccel);
    const newVel = {
      x: vel.x + (a0.x + a1.x) * halfDt,
      y: vel.y + (a0.y + a1.y) * halfDt,
    };
    pos = newPos;
    vel = newVel;
    points.push({ ...pos });

    for (const b of bodies) {
      if (vDist(pos, b.pos) < b.radius + 2) {
        return points;
      }
    }
  }
  return points;
}

export function stepPlanets(bodies: Body[], dt: number): void {
  for (const b of bodies) {
    if (b.isStar) continue;
    if (b.orbitAngle !== undefined && b.orbitSpeed !== undefined && b.orbitRadius !== undefined) {
      b.orbitAngle += b.orbitSpeed * dt;
      const star = bodies.find((x) => x.isStar);
      if (star) {
        b.pos = {
          x: star.pos.x + Math.cos(b.orbitAngle) * b.orbitRadius,
          y: star.pos.y + Math.sin(b.orbitAngle) * b.orbitRadius,
        };
        const tangent = {
          x: -Math.sin(b.orbitAngle),
          y: Math.cos(b.orbitAngle),
        };
        b.vel = vScale(tangent, b.orbitSpeed * b.orbitRadius);
      }
    }
  }
}
