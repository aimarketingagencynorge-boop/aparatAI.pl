
import React, { useState } from 'react';
import { Camera, Zap, Sparkles, Shield, Rocket, CheckCircle, Globe, Image as ImageIcon, LogIn } from 'lucide-react';
import { translations } from '../translations';
import { Language } from '../types';

interface LandingPageProps {
  onStart: () => void;
  onLoginRequest: () => void;
  language: Language;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLoginRequest, language }) => {
  const [flash, setFlash] = useState(false);
  const t = translations[language];

  const handleStart = () => {
    setFlash(true);
    setTimeout(() => {
      setFlash(false);
      onStart();
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 overflow-x-hidden font-sans selection:bg-blue-500/30">
      {flash && <div className="fixed inset-0 bg-white z-[100] animate-out fade-out duration-300" />}

      {/* Header with Login */}
      <nav className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-20">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
               <Camera size={16} className="text-white" />
            </div>
            <span className="text-sm font-black italic uppercase tracking-tighter">Mój Aparat <span className="text-blue-500">AI</span></span>
         </div>
         <button 
          onClick={onLoginRequest}
          className="flex items-center gap-2 px-6 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all text-zinc-400 hover:text-white"
         >
           <LogIn size={14} />
           LOGOWANIE
         </button>
      </nav>

      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[800px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)] blur-[120px] pointer-events-none" />
        
        <div className="max-w-5xl w-full z-10 text-center space-y-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest">
              <Sparkles size={14} /> {t.freeOffer}
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic uppercase text-white">
              {t.appName.split(' ')[0]} <span className="text-blue-600 drop-shadow-[0_0_30px_rgba(37,99,235,0.4)]">{t.appName.split(' ').slice(1).join(' ')}</span>
            </h1>
            <p className="max-w-2xl mx-auto text-zinc-400 text-lg md:text-xl font-medium leading-relaxed">
              {t.heroDesc}
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <button 
              onClick={handleStart}
              className="group relative flex flex-col items-center justify-center"
            >
              <div className="absolute inset-[-40px] border border-blue-500/5 rounded-full" />
              <div className="absolute inset-[-20px] border border-blue-500/10 rounded-full group-hover:scale-110 transition-transform duration-700" />
              <div className="w-32 h-32 md:w-40 md:h-40 bg-zinc-950 rounded-full border-8 border-zinc-900 flex items-center justify-center relative overflow-hidden shadow-2xl group-active:scale-90 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 group-hover:opacity-90 transition-opacity" />
                <Camera className="w-12 h-12 md:w-16 md:h-16 text-white z-10 group-hover:rotate-12 transition-transform duration-500" />
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="mt-8 text-xs font-black text-blue-500 uppercase tracking-[0.4em] group-hover:text-blue-400 transition-colors">{t.ctaStart}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
