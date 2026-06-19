import type { Body, Ship, Mission } from './types';
import { vDist, vSub, vLen } from './physics';

export function pickRandomTarget(bodies: Body[], currentId?: string): Body | undefined {
  const planets = bodies.filter((b) => !b.isStar && b.id !== currentId);
  if (planets.length === 0) return undefined;
  return planets[Math.floor(Math.random() * planets.length)];
}

export function createMission(target: Body): Mission {
  return {
    targetId: target.id,
    reward: 100 + Math.floor(Math.random() * 150),
    fuelReward: 25 + Math.floor(Math.random() * 35),
    state: 'active',
  };
}

export interface MissionInfo {
  target: Body | undefined;
  relativeSpeed: number;
  distance: number;
}

export function getMissionInfo(mission: Mission, bodies: Body[], ship: Ship): MissionInfo {
  const target = bodies.find((b) => b.id === mission.targetId);
  if (!target) return { target: undefined, relativeSpeed: 0, distance: Infinity };

  const distance = vDist(ship.pos, target.pos) - target.radius;
  const relativeSpeed = vLen(vSub(ship.vel, target.vel));

  return { target, relativeSpeed, distance };
}

export function formatSpeed(v: number): string {
  return v.toFixed(1).padStart(5, ' ');
}

export function formatDistance(d: number): string {
  if (d > 1000) return `${(d / 1000).toFixed(1)}k`;
  return Math.floor(d).toString().padStart(4, ' ');
}
