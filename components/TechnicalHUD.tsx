
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
        <div className="mono text-[9px] text-blue-500/40 uppercase tracking-[0.5em] leading-loose pointer-events-none">
          <div>> NEURAL_CORE: <span className="text-blue-500">READY</span></div>
          <div>> OPTIC_SENSORS: <span className="text-blue-500">ON</span></div>
          <div>> RENDER_LINK: <span className="text-blue-500">STABLE</span></div>
        </div>
        
        <div className="text-right pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-2xl border border-blue-500/20 px-8 py-3 rounded-full mb-4 inline-flex items-center gap-6 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
            <span className={`mono text-[10px] uppercase tracking-widest font-black ${credits > 0 ? "text-blue-500 animate-pulse" : "text-red-500"}`}>
              {credits > 0 ? '⚡ MISSION_ENERGY: PEŁNA (1/1)' : '🪫 ENERGY_EXHAUSTED (0/1)'}
            </span>
          </div>
          <h1 className="text-white font-black text-3xl tracking-tighter italic uppercase leading-none italic">
            M-J <span className="text-blue-600">APARAT AI</span>
          </h1>
          <div className="mt-2 mono text-[8px] text-blue-500/40 uppercase tracking-[0.6em] font-bold">WARSZTAT_BADAWCZY // VER_3.1.2_MASTER</div>
        </div>
      </div>

      {/* Tactical Corner Tracking Brackets */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-blue-500/20"></div>
      <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-blue-500/20"></div>
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-blue-500/20"></div>
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-blue-500/20"></div>

      {/* Bottom Tactical Info */}
      <div className="flex justify-between items-end mb-28 opacity-30">
        <div className="mono text-[8px] uppercase tracking-[0.6em] font-black">AUTH: MJ_PRO_ENCRYPTED</div>
        <div className="mono text-[8px] uppercase tracking-[0.6em] font-black italic">GLOBAL_SYNTHESIS_HUB // 8K_BUFFER_ENABLED</div>
      </div>
    </div>
  );
};

export default TechnicalHUD;
