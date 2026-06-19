export interface Vec2 {
  x: number;
  y: number;
}

export interface Body {
  id: string;
  name: string;
  mass: number;
  radius: number;
  pos: Vec2;
  vel: Vec2;
  color: string;
  glow: string;
  isStar: boolean;
  orbitRadius?: number;
  orbitAngle?: number;
  orbitSpeed?: number;
  isDeliveryTarget?: boolean;
}

export interface Ship {
  pos: Vec2;
  vel: Vec2;
  heading: number;
  thrust: number;
  fuel: number;
  maxFuel: number;
  alive: boolean;
  thrusting: boolean;
  turnRate: number;
  trail: Vec2[];
}

export interface Mission {
  targetId: string;
  reward: number;
  fuelReward: number;
  state: 'active' | 'delivered';
}

export interface InputState {
  turnLeft: boolean;
  turnRight: boolean;
  thrust: boolean;
}

export type GameState = 'title' | 'playing' | 'gameover' | 'delivery-success';

export interface CollisionResult {
  body: Body;
  distance: number;
  relativeSpeed: number;
  normal: Vec2;
}

export interface GameConfig {
  G: number;
  softening: number;
  dt: number;
  trajectorySeconds: number;
  trajectorySteps: number;
  maxTrail: number;
  dockDistance: number;
  dockMaxSpeed: number;
  crashMaxSpeed: number;
  initialFuel: number;
  maxFuel: number;
  thrustPower: number;
  fuelBurnRate: number;
  turnRate: number;
}
