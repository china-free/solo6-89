import type { GameStats } from '@/game/Game';

interface HUDProps {
  stats: GameStats;
}

export default function HUD({ stats }: HUDProps) {
  if (stats.state === 'title') return null;

  const fuelPct = Math.max(0, Math.min(1, stats.fuel / stats.maxFuel));
  const fuelColor = fuelPct > 0.5 ? 'text-cyber-cyan' : fuelPct > 0.2 ? 'text-cyber-amber' : 'text-cyber-red';
  const fuelBg = fuelPct > 0.5 ? 'bg-cyber-cyan' : fuelPct > 0.2 ? 'bg-cyber-amber' : 'bg-cyber-red';

  return (
    <>
      <div className="absolute top-4 left-4 hud-panel px-4 py-3 min-w-[240px] font-mono text-sm">
        <div className="text-cyber-cyan font-display tracking-wider text-xs mb-2">/// ACTIVE MISSION</div>
        <div className="text-white/90">目标: <span className="text-cyber-cyan glow-text">{stats.targetName}</span></div>
        <div className="text-white/70 text-xs mt-1">奖励: <span className="text-cyber-amber">{stats.missionReward}</span> c</div>
        {stats.distanceToTarget < Infinity && (
          <div className="text-white/70 text-xs mt-1">
            距离: <span className={stats.distanceToTarget < 60 ? 'text-cyber-green' : 'text-white/80'}>{Math.floor(stats.distanceToTarget)}</span> km
          </div>
        )}
        {stats.relativeSpeed > 0 && (
          <div className="text-xs mt-1">
            相对速度:
            <span className={stats.relativeSpeed < 35 ? 'text-cyber-green' : stats.relativeSpeed < 95 ? 'text-cyber-amber' : 'text-cyber-red'}>
              {' '}{stats.relativeSpeed.toFixed(1)}
            </span>{' '}
            <span className="text-white/50">m/s</span>
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 hud-panel px-4 py-3 text-right font-mono text-sm">
        <div className="text-cyber-cyan font-display tracking-wider text-xs mb-2">/// TELEMETRY</div>
        <div className="text-white/90">
          得分: <span className="text-cyber-amber">{stats.score}</span>
        </div>
        <div className="text-white/70 text-xs">
          已交付: <span className="text-cyber-green">{stats.deliveries}</span>
        </div>
        <div className="text-white/70 text-xs mt-1">
          速度: <span className="text-white/90">{stats.speed.toFixed(1)}</span> m/s
        </div>
      </div>

      <div className="absolute bottom-4 left-4 hud-panel px-4 py-3 min-w-[280px] font-mono text-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-cyber-cyan font-display tracking-wider text-xs">/// FUEL</span>
          <span className={`font-display text-lg ${fuelColor} glow-text`}>
            {Math.floor(stats.fuel)} / {stats.maxFuel}
          </span>
        </div>
        <div className="w-full h-2 bg-black/50 border border-space-border rounded-sm overflow-hidden">
          <div
            className={`h-full ${fuelBg} transition-all duration-100`}
            style={{ width: `${fuelPct * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] mt-1.5 text-white/40">
          <span>W / ↑ · 点火推进</span>
          <span>A D / ← → · 旋转船头</span>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 hud-panel px-4 py-3 font-mono text-xs text-white/60 max-w-[240px]">
        <div className="text-cyber-cyan font-display tracking-wider text-xs mb-2">/// OPERATIONS</div>
        <div>· 虚线为预测 10 秒轨迹</div>
        <div>· 点火时虚线实时变形</div>
        <div>· 低速切入目标轨道完成交付</div>
        <div>· 相对速度过高会撞击</div>
      </div>

      {stats.lastMessage && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="font-display text-xl text-cyber-cyan glow-text text-center animate-pulse-slow">
            {stats.lastMessage}
          </div>
        </div>
      )}
    </>
  );
}
