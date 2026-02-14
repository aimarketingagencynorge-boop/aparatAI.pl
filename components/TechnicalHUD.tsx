
import React from 'react';

interface TechnicalHUDProps {
  credits: number;
  isPro?: boolean;
}

const TechnicalHUD: React.FC<TechnicalHUDProps> = ({ credits, isPro }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[120] p-6 md:p-10 flex flex-col justify-between">
      {/* Top HUD */}
      <div className="flex justify-between items-start w-full">
        <div className="mono text-[9px] md:text-[10px] text-blue-500/60 uppercase tracking-[0.4em] leading-loose pointer-events-auto bg-black/40 backdrop-blur-md p-4 md:p-6 border-l border-blue-500/20 rounded-br-3xl">
          <div className="flex items-center gap-3"><span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span> SYSTEM_STATUS: ONLINE</div>
          <div className="flex items-center gap-3"><span className="w-2 h-2 bg-blue-500/40 rounded-full"></span> NEURAL_LINK: STABLE</div>
          <div className="flex items-center gap-3"><span className="w-2 h-2 bg-blue-500/40 rounded-full"></span> COLD_STORAGE: LINKED</div>
        </div>
        
        <div className="text-right pointer-events-auto">
          <div className="bg-black/80 backdrop-blur-2xl border border-blue-500/20 px-6 md:px-8 py-2 md:py-3 rounded-full mb-4 md:mb-6 inline-flex items-center gap-4 md:gap-6 shadow-[0_0_30px_rgba(37,99,235,0.2)]">
            <span className={`mono text-[10px] md:text-[11px] uppercase tracking-widest font-black ${credits > 0 ? "text-blue-500 animate-pulse" : "text-red-500"}`}>
              {credits > 0 ? '⚡ MISSION_ENERGY: 100%' : '🪫 ENERGY_EXHAUSTED'}
            </span>
            {credits === 0 && <span className="px-3 py-1 bg-blue-600 rounded-full text-[7px] mono text-white font-black animate-bounce">BUY_PRO</span>}
          </div>
          <h1 className="text-3xl md:text-5xl tracking-tighter uppercase leading-none font-black italic">
            <span className="text-blue-500 logo-glow">Aparat</span> <span className="text-white">AI</span>
          </h1>
          <div className="mono text-[8px] md:text-[9px] text-blue-500/40 uppercase tracking-[0.6em] font-bold mt-2">GALACTIC_WORKSHOP // MASTER_HD</div>
        </div>
      </div>

      {/* Corner Brackets */}
      <div className="absolute top-8 left-8 w-16 md:w-24 h-16 md:h-24 border-t-2 border-l-2 border-blue-500/10"></div>
      <div className="absolute top-8 right-8 w-16 md:w-24 h-16 md:h-24 border-t-2 border-r-2 border-blue-500/10"></div>
      <div className="absolute bottom-8 left-8 w-16 md:w-24 h-16 md:h-24 border-b-2 border-l-2 border-blue-500/10"></div>
      <div className="absolute bottom-8 right-8 w-16 md:w-24 h-16 md:h-24 border-b-2 border-r-2 border-blue-500/10"></div>

      {/* Bottom Tactical Info */}
      <div className="flex justify-between items-end mb-24 opacity-20 px-4">
        <div className="mono text-[7px] md:text-[8px] uppercase tracking-[0.6em] font-black">ENCRYPTED_SIGNAL_STREAM_MASTER_2025</div>
        <div className="mono text-[7px] md:text-[8px] uppercase tracking-[0.6em] font-black italic">AUTHO_LEVEL: MASTER_DOWODCA</div>
      </div>
    </div>
  );
};

export default TechnicalHUD;
