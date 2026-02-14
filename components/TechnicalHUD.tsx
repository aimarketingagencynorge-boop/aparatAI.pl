
import React from 'react';

interface TechnicalHUDProps {
  credits: number;
  isPro?: boolean;
}

const TechnicalHUD: React.FC<TechnicalHUDProps> = ({ credits, isPro }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[120] p-10 flex flex-col justify-between">
      {/* Top HUD */}
      <div className="flex justify-between items-start w-full">
        <div className="mono text-[9px] text-blue-500/40 uppercase tracking-[0.4em] leading-loose">
          <div>> NEURAL_LINK: ACTIVE</div>
          <div>> OPTIC_SENSORS: CALIBRATED</div>
          <div>> RENDER_ENGINE: 8K_READY</div>
        </div>
        
        <div className="text-right">
          <div className="bg-black/40 backdrop-blur-xl border border-blue-500/20 px-6 py-2 rounded-full mb-3 inline-flex items-center gap-4">
            <span className={`mono text-[9px] uppercase tracking-widest ${credits > 0 ? "text-blue-500 animate-pulse" : "text-red-500 font-bold"}`}>
              {credits > 0 ? '⚡ ENERGIA MISJI: PEŁNA (1/1)' : '🪫 ENERGIA: 0/1'}
            </span>
          </div>
          <h1 className="text-white font-black text-3xl tracking-tighter italic uppercase">
            M-J <span className="text-blue-600">APARAT AI</span>
          </h1>
          <div className="mono text-[8px] text-blue-400 opacity-40 uppercase tracking-[0.6em]">COLD_DIGITAL_HUB // V3.1</div>
        </div>
      </div>

      {/* Corner Brackets */}
      <div className="absolute top-10 left-10 w-20 h-20 border-t border-l border-blue-500/10"></div>
      <div className="absolute top-10 right-10 w-20 h-20 border-t border-r border-blue-500/10"></div>
      <div className="absolute bottom-10 left-10 w-20 h-20 border-b border-l border-blue-500/10"></div>
      <div className="absolute bottom-10 right-10 w-20 h-20 border-b border-r border-blue-500/10"></div>

      {/* Bottom HUD - moved slightly up to avoid dock overlap */}
      <div className="flex justify-between items-end mb-24">
        <div className="mono text-[8px] text-blue-500/30 uppercase tracking-[0.5em]">
          AUTHORIZATION: MJ_PRO_ACTIVE_SCANNER
        </div>
        <div className="mono text-[8px] text-blue-400/30 uppercase tracking-[0.5em]">
          COORD: 52.22° N, 21.01° E // SECURITY: AES-256
        </div>
      </div>
    </div>
  );
};

export default TechnicalHUD;
