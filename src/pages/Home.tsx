import { useEffect, useRef, useState } from 'react';
import { Game, type GameStats } from '@/game/Game';
import HUD from '@/components/HUD';
import Overlay from '@/components/Overlay';

const initialStats: GameStats = {
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

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<Game | null>(null);
  const [stats, setStats] = useState<GameStats>(initialStats);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const game = new Game(canvasRef.current, setStats);
    gameRef.current = game;
    return () => {
      game.destroy();
    };
  }, []);

  const handleStart = () => {
    if (!gameRef.current || startedRef.current) return;
    startedRef.current = true;
    gameRef.current.start();
  };

  const handleRestart = () => {
    if (!gameRef.current) return;
    gameRef.current.reset();
    gameRef.current.start();
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <HUD stats={stats} />
      <Overlay
        state={stats.state}
        score={stats.score}
        deliveries={stats.deliveries}
        message={stats.lastMessage}
        onStart={handleStart}
        onRestart={handleRestart}
      />
    </div>
  );
}
