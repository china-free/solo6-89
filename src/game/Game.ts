import type { Body, Ship, GameState, Mission, Vec2, InputState, GameConfig, CollisionResult } from './types';
import { DEFAULT_CONFIG, integrateShip, predictTrajectory, stepPlanets, checkShipCollision, vDist, vSub, vLen } from './physics';
import { createBodies, createShip, generateStars } from './entities';
import { drawBackground, drawBody, drawTrajectory, drawShip } from './renderer';
import { pickRandomTarget, createMission, getMissionInfo } from './mission';
import { createInput } from './input';

export interface GameStats {
  score: number;
  deliveries: number;
  state: GameState;
  fuel: number;
  maxFuel: number;
  speed: number;
  relativeSpeed: number;
  distanceToTarget: number;
  targetName: string;
  missionReward: number;
  lastMessage?: string;
  lastMessageTime?: number;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cfg: GameConfig = DEFAULT_CONFIG;
  private bodies: Body[] = [];
  private ship!: Ship;
  private stars: Array<{ x: number; y: number; size: number; brightness: number }> = [];
  private input: { state: InputState; onKeyDown: (e: KeyboardEvent) => void; onKeyUp: (e: KeyboardEvent) => void; reset: () => void };
  private camera: Vec2 = { x: 0, y: 0 };
  private zoom = 1;
  private trajectory: Vec2[] = [];
  private mission!: Mission;
  private time = 0;
  private lastFrame = 0;
  private accumulator = 0;
  private animationId = 0;
  private stats: GameStats;
  private statsCallback: (s: GameStats) => void;
  private width = 0;
  private height = 0;
  private dpr = 1;

  constructor(canvas: HTMLCanvasElement, onStats: (s: GameStats) => void) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.input = createInput();
    this.statsCallback = onStats;
    this.stats = {
      score: 0,
      deliveries: 0,
      state: 'title',
      fuel: 100,
      maxFuel: 160,
      speed: 0,
      relativeSpeed: 0,
      distanceToTarget: 0,
      targetName: '',
      missionReward: 0,
    };
    this.resize();
    this.init();
    window.addEventListener('resize', this.resize);
    window.addEventListener('keydown', this.input.onKeyDown);
    window.addEventListener('keyup', this.input.onKeyUp);
  }

  resize = (): void => {
    this.dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.stars.length === 0 || this.bodies.length === 0) return;
    this.stars = generateStars(280, this.width, this.height);
    const star = this.bodies.find((b) => b.isStar);
    if (star) {
      star.pos = { x: this.width / 2, y: this.height / 2 };
    }
  };

  worldToScreen = (p: Vec2): Vec2 => {
    return {
      x: (p.x - this.camera.x) * this.zoom + this.width / 2,
      y: (p.y - this.camera.y) * this.zoom + this.height / 2,
    };
  };

  init(): void {
    const center = { x: this.width / 2, y: this.height / 2 };
    this.bodies = createBodies(center);
    const startPlanet = this.bodies.find((b) => b.id === 'planet-1');
    if (!startPlanet) throw new Error('No starting planet');
    this.ship = createShip(startPlanet);
    this.stars = generateStars(280, this.width, this.height);
    const target = pickRandomTarget(this.bodies, startPlanet.id);
    if (target) {
      this.mission = createMission(target);
      this.stats.targetName = target.name;
      this.stats.missionReward = this.mission.reward;
    }
    this.camera = { ...this.ship.pos };
    this.updateStats();
  }

  reset(): void {
    this.input.reset();
    this.time = 0;
    this.stats.score = 0;
    this.stats.deliveries = 0;
    this.stats.state = 'playing';
    this.stats.lastMessage = undefined;
    if (this.deliveryTimerId) {
      clearTimeout(this.deliveryTimerId);
      this.deliveryTimerId = null;
    }
    this.init();
  }

  start(): void {
    this.stats.state = 'playing';
    this.lastFrame = performance.now();
    this.accumulator = 0;
    this.loop();
  }

  stop(): void {
    cancelAnimationFrame(this.animationId);
  }

  destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('keydown', this.input.onKeyDown);
    window.removeEventListener('keyup', this.input.onKeyUp);
  }

  private loop = (): void => {
    const now = performance.now();
    let dt = (now - this.lastFrame) / 1000;
    if (dt > 0.1) dt = 0.1;
    this.lastFrame = now;
    this.time += dt;

    if (this.stats.state === 'playing') {
      this.accumulator += dt;
      const fixedDt = this.cfg.dt;
      while (this.accumulator >= fixedDt) {
        stepPlanets(this.bodies, fixedDt);
        integrateShip(this.ship, this.bodies, this.input.state, this.cfg, fixedDt);
        this.checkCollisions();
        this.accumulator -= fixedDt;
      }

      const thrusting = this.input.state.thrust && this.ship.fuel > 0;
      this.trajectory = predictTrajectory(this.ship, this.bodies, this.cfg, thrusting);

      this.camera.x += (this.ship.pos.x - this.camera.x) * Math.min(1, dt * 4);
      this.camera.y += (this.ship.pos.y - this.camera.y) * Math.min(1, dt * 4);

      const info = getMissionInfo(this.mission, this.bodies, this.ship);
      this.stats.relativeSpeed = info.relativeSpeed;
      this.stats.distanceToTarget = Math.max(0, info.distance);

      if (this.ship.fuel <= 0 && this.stats.state === 'playing') {
        const canReach = this.canReachAnyPlanet();
        if (!canReach) {
          this.stats.state = 'gameover';
          this.stats.lastMessage = '燃料耗尽 · 漂流深空';
        }
      }
    }

    this.render();
    this.updateStats();
    this.animationId = requestAnimationFrame(this.loop);
  };

  private checkCollisions(): void {
    const hit = checkShipCollision(this.ship, this.bodies);
    if (!hit) return;

    const { body, relativeSpeed, normal } = hit;
    const isTarget = body.id === this.mission.targetId;

    if (body.isStar) {
      this.killShip('恒星吞噬 · 气化殆尽');
      return;
    }

    if (isTarget) {
      if (relativeSpeed <= this.cfg.dockMaxSpeed) {
        this.onDelivery(hit);
      } else if (relativeSpeed > this.cfg.crashMaxSpeed) {
        this.killShip(`任务失败 · 高速撞击 ${body.name}`);
      } else {
        this.bounceOff(body, normal, 20);
      }
    } else {
      if (relativeSpeed > this.cfg.crashMaxSpeed) {
        this.killShip(`撞击 ${body.name} · 粉身碎骨`);
      } else {
        this.bounceOff(body, normal, 20);
      }
    }
  }

  private killShip(message: string): void {
    this.ship.alive = false;
    this.stats.state = 'gameover';
    this.stats.lastMessage = message;
  }

  private bounceOff(body: Body, normal: Vec2, speed: number): void {
    this.ship.pos.x = body.pos.x + normal.x * (body.radius + 3);
    this.ship.pos.y = body.pos.y + normal.y * (body.radius + 3);
    this.ship.vel.x = body.vel.x + normal.x * speed;
    this.ship.vel.y = body.vel.y + normal.y * speed;
  }

  private deliveryTimerId: ReturnType<typeof setTimeout> | null = null;

  private onDelivery(hit: CollisionResult): void {
    const target = hit.body;
    this.stats.score += this.mission.reward;
    this.stats.deliveries += 1;
    this.ship.fuel = Math.min(this.ship.maxFuel, this.ship.fuel + this.mission.fuelReward);
    this.stats.state = 'delivery-success';
    this.stats.lastMessage = `送达 ${target.name} · +${this.mission.reward} 分 · +${this.mission.fuelReward} 燃料`;
    this.stats.lastMessageTime = this.time;

    this.bounceOff(target, hit.normal, 25);

    this.deliveryTimerId = setTimeout(() => {
      this.nextMission();
    }, 1800);
  }

  private nextMission(): void {
    const currentTarget = this.mission.targetId;
    const next = pickRandomTarget(this.bodies, currentTarget);
    if (next) {
      this.mission = createMission(next);
      this.stats.targetName = next.name;
      this.stats.missionReward = this.mission.reward;
      this.mission.state = 'active';
      if (this.stats.state === 'delivery-success') {
        this.stats.state = 'playing';
      }
    }
    this.deliveryTimerId = null;
  }

  skipDeliveryAnimation(): void {
    if (this.stats.state !== 'delivery-success') return;
    if (this.deliveryTimerId) {
      clearTimeout(this.deliveryTimerId);
      this.deliveryTimerId = null;
    }
    this.nextMission();
  }

  private canReachAnyPlanet(): boolean {
    const pred = predictTrajectory(this.ship, this.bodies, this.cfg, false);
    for (const p of pred) {
      for (const b of this.bodies) {
        if (b.isStar) continue;
        if (vDist(p, b.pos) < b.radius + this.cfg.dockDistance) {
          const relVel = vLen(vSub(this.ship.vel, b.vel));
          if (relVel < this.cfg.crashMaxSpeed * 1.3) return true;
        }
      }
    }
    return false;
  }

  private updateStats(): void {
    const target = this.bodies.find((b) => b.id === this.mission?.targetId);
    this.stats.fuel = this.ship.fuel;
    this.stats.maxFuel = this.ship.maxFuel;
    this.stats.speed = vLen(this.ship.vel);
    if (target) {
      this.stats.targetName = target.name;
      this.stats.relativeSpeed = vLen(vSub(this.ship.vel, target.vel));
      this.stats.distanceToTarget = Math.max(0, vDist(this.ship.pos, target.pos) - target.radius);
    }
    this.statsCallback({ ...this.stats });
  }

  private render(): void {
    const ctx = this.ctx;
    drawBackground(ctx, this.width, this.height, this.stars);

    for (const b of this.bodies) {
      drawBody(ctx, b, this.worldToScreen, this.time, b.id === this.mission?.targetId);
    }

    drawTrajectory(ctx, this.trajectory, this.worldToScreen, 220);
    drawShip(ctx, this.ship, this.worldToScreen, this.time);
  }
}
