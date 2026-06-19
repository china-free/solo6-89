import type { Body, Ship, Vec2 } from './types';
import { vec } from './physics';

const PLANET_DATA = [
  { name: 'Aegir', color: '#6ad2ff', glow: '#6ad2ff', orbitRadius: 140, mass: 380, radius: 14 },
  { name: 'Baldr', color: '#ffb454', glow: '#ffd48a', orbitRadius: 230, mass: 620, radius: 18 },
  { name: 'Cassiopeia', color: '#c88cff', glow: '#e0b8ff', orbitRadius: 330, mass: 460, radius: 15 },
  { name: 'Draugr', color: '#5dffb0', glow: '#9fffc9', orbitRadius: 440, mass: 720, radius: 20 },
];

export function createBodies(center: Vec2): Body[] {
  const bodies: Body[] = [
    {
      id: 'star',
      name: 'Helios',
      mass: 2800,
      radius: 28,
      pos: { ...center },
      vel: vec(0, 0),
      color: '#ffdd66',
      glow: '#fff0a0',
      isStar: true,
    },
  ];

  for (let i = 0; i < PLANET_DATA.length; i++) {
    const d = PLANET_DATA[i];
    const orbitSpeed = Math.sqrt(2800 * 1200) / (d.orbitRadius * Math.sqrt(d.orbitRadius));
    const angle = (i / PLANET_DATA.length) * Math.PI * 2;
    bodies.push({
      id: `planet-${i}`,
      name: d.name,
      mass: d.mass,
      radius: d.radius,
      pos: {
        x: center.x + Math.cos(angle) * d.orbitRadius,
        y: center.y + Math.sin(angle) * d.orbitRadius,
      },
      vel: vec(0, 0),
      color: d.color,
      glow: d.glow,
      isStar: false,
      orbitRadius: d.orbitRadius,
      orbitAngle: angle,
      orbitSpeed,
    });
  }

  return bodies;
}

export function createShip(origin: Body): Ship {
  const offsetAngle = origin.orbitAngle !== undefined ? origin.orbitAngle + Math.PI / 2 : 0;
  const dist = origin.radius + 30;
  const pos = {
    x: origin.pos.x + Math.cos(offsetAngle) * dist,
    y: origin.pos.y + Math.sin(offsetAngle) * dist,
  };
  const tangent = { x: -Math.sin(offsetAngle), y: Math.cos(offsetAngle) };
  const orbitalSpeed = (origin.orbitSpeed ?? 0) * (origin.orbitRadius ?? 0);
  const vel = { x: tangent.x * orbitalSpeed, y: tangent.y * orbitalSpeed };

  return {
    pos,
    vel,
    heading: offsetAngle,
    thrust: 220,
    fuel: 100,
    maxFuel: 160,
    alive: true,
    thrusting: false,
    turnRate: 2.8,
    trail: [],
  };
}

export function generateStars(count: number, width: number, height: number): Array<{ x: number; y: number; size: number; brightness: number }> {
  const stars: Array<{ x: number; y: number; size: number; brightness: number }> = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.3,
      brightness: Math.random() * 0.7 + 0.3,
    });
  }
  return stars;
}
