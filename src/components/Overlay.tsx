interface OverlayProps {
  state: 'title' | 'gameover' | 'delivery-success' | 'crash' | 'playing';
  score: number;
  deliveries: number;
  message?: string;
  onStart: () => void;
  onRestart: () => void;
}

export default function Overlay({ state, score, deliveries, message, onStart, onRestart }: OverlayProps) {
  if (state === 'playing') return null;

  const isTitle = state === 'title';
  const isGameOver = state === 'gameover';

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm scanline z-10">
      <div className="max-w-xl w-full mx-8 text-center">
        <div className="font-display text-[clamp(2.5rem,6vw,4rem)] font-black text-cyber-cyan glow-text tracking-widest mb-2">
          {isTitle ? 'DEEP SPACE' : state === 'crash' ? 'HIGH ENERGY IMPACT' : isGameOver ? 'MISSION FAILED' : 'DELIVERY CONFIRMED'}
        </div>
        <div className="font-display text-[clamp(1.2rem,2.5vw,1.6rem)] text-cyber-amber glow-text tracking-[0.4em] mb-8">
          {isTitle ? 'EXPRESS' : state === 'crash' ? 'WARNING' : isGameOver ? 'ABORT' : 'COMPLETE'}
        </div>

        {isTitle && (
          <p className="text-white/70 font-mono mb-8 leading-relaxed text-sm">
            你是一名深空快递员。驾驶一艘燃料紧缺的小破飞船，<br />
            在恒星引力场中穿梭，利用行星做引力弹弓，<br />
            算准轨道，减速切入，把货送到。
          </p>
        )}

        {!isTitle && (
          <div className="mb-8">
            <div className="text-white/80 font-mono text-sm mb-4">
              {message || '任务结束'}
            </div>
            <div className="hud-panel inline-block px-8 py-4 font-mono">
              <div className="text-white/60 text-xs mb-1">FINAL SCORE</div>
              <div className="font-display text-4xl text-cyber-amber glow-text">{score}</div>
              <div className="text-white/50 text-xs mt-2">{deliveries} 次成功交付</div>
            </div>
          </div>
        )}

        <div className="font-mono text-xs text-white/50 mb-8 max-w-sm mx-auto leading-relaxed">
          {isTitle ? (
            <>
              <div className="text-cyber-cyan mb-2">/// CONTROLS</div>
              <div><span className="text-cyber-amber">W / ↑</span> · 点火推进 (消耗燃料)</div>
              <div><span className="text-cyber-amber">A / ←</span> · 逆时针转船头</div>
              <div><span className="text-cyber-amber">D / →</span> · 顺时针转船头</div>
              <div className="mt-3 text-white/40">虚线为预测未来 10 秒轨迹 · 点火时实时变形</div>
            </>
          ) : (
            <div className="text-cyber-amber/80">
              提示: 先减速到相对目标速度 35 m/s 以内再靠近
            </div>
          )}
        </div>

        <button
          className="cyber-btn px-8 py-3 text-sm font-bold"
          onClick={isTitle ? onStart : onRestart}
        >
          {isTitle ? 'INITIATE DELIVERY' : 'RESTART MISSION'}
        </button>
      </div>
    </div>
  );
}
