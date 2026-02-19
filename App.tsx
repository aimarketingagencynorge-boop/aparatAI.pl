
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppState, MissionType, ProcessingResult, Scenography } from './types.ts';
import { cloudService } from './services/cloudService.ts';
import TechnicalHUD from './components/TechnicalHUD.tsx';
import DropZone from './components/DropZone.tsx';
import { GoogleGenAI } from "@google/genai";

const ORBIT_MODULES = [
  { 
    id: 'PERCEPTION' as MissionType, 
    label: 'NEURALNA PERCEPCJA', 
    icon: '👁️', 
    angle: -90, 
    title: 'NEURALNA PERCEPCJA', 
    desc: 'Neural Clipping & Scanning. System precyzyjnie identyfikuje produkt, izoluje go od otoczenia i przygotowuje do nowej syntezy.',
    status: 'SENSORS: ACTIVE'
  },
  { 
    id: 'SCENOGRAPHY' as MissionType, 
    label: 'SCENOGRAFIA', 
    icon: '🎬', 
    angle: -18, 
    title: 'SYNEZJA SCENOGRAFII', 
    desc: 'Twoje studio 24/7. System nałoży fizycznie poprawne odbicia, cienie i głębię ostrości w jakości 8K.',
    status: 'STUDIO: READY'
  },
  { 
    id: 'SOCIAL_LAB' as MissionType, 
    label: 'SOCIAL MEDIA', 
    icon: '📱', 
    angle: 54, 
    title: 'SOCIAL MEDIA LAB', 
    desc: 'Automatyczne kadrowanie do formatów 9:16 (TikTok/Reels) i 1:1 (Instagram). Reklama gotowa w 15 sekund.',
    status: 'FORMATS: OK'
  },
  { 
    id: 'BRAND_LAB' as MissionType, 
    label: 'BRANDING', 
    icon: '🧬', 
    angle: 126, 
    title: 'BRAND IDENTITY LAB', 
    desc: 'Dostosuj paletę barw i DNA marki. Aparat AI dba o spójność wizualną Twojej całej oferty.',
    status: 'DNA: LINKED'
  },
  { 
    id: 'MISSION' as MissionType, 
    label: 'MENU', 
    icon: '🚀', 
    angle: 198, 
    title: 'MENU WARSZTATU', 
    desc: 'Poznaj pełną metodologię pracy z naszym silnikiem Neural Engine i zdominuj e-commerce.',
    status: 'CORE: READY'
  }
];

const FAQS = [
  { q: 'Czy muszę mieć profesjonalny aparat?', a: 'Nie. Aparat AI optymalizuje surowe pliki z telefonu do jakości renderów studyjnych.' },
  { q: 'Co jeśli na zdjęciu widać dłoń?', a: 'Neuralna Percepcja automatycznie izoluje produkt i usuwa zbędne elementy.' },
  { q: 'Jakie formaty obsługuje Social Media Lab?', a: 'TikTok/Reels (9:16), Instagram (1:1) oraz Facebook Ads (16:9).' }
];

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppState>(AppState.LENS);
  const [activeModule, setActiveModule] = useState<MissionType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [credits, setCredits] = useState(1);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(false);

  const homeRef = useRef<HTMLDivElement>(null);
  const manualRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStartMission = useCallback(() => {
    setCurrentStep(AppState.MISSION_HUB);
    setTimeout(() => {
      homeRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const handleKeySelection = async () => {
    try {
        if (typeof (window as any).aistudio?.openSelectKey === 'function') {
            await (window as any).aistudio.openSelectKey();
        } else {
            alert("Funkcja wyboru klucza dostępna w AI Studio.");
        }
    } catch (e) {
        console.error("Key selection failed", e);
    }
  };

  const handleMainUpload = async (file: File) => {
    if (credits === 0) return;

    // Tryb prezentacyjny / symulacja
    if (isSimulationMode) {
        setIsProcessing(true);
        const uploaded = await cloudService.uploadImage(file);
        setTimeout(() => {
            setResult({ 
                url: uploaded.url, 
                originalUrl: uploaded.url, 
                badge: 'SIMULATED MASTER',
                isExample: true 
            });
            setCredits(0);
            setIsProcessing(false);
            setCurrentStep(AppState.RESULT);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 2500);
        return;
    }

    setIsProcessing(true);
    try {
      const uploaded = await cloudService.uploadImage(file);
      
      // Inicjalizacja z dostępnym kluczem process.env.API_KEY
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = uploaded.url.split(',')[1];
      const mimeType = uploaded.url.split(';')[0].split(':')[1];

      // Używamy modelu gemini-2.5-flash-image, który nie wymaga wymuszonego wyboru klucza przez użytkownika
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: "Professional luxury studio photography. Cinematic lighting, soft shadows, expensive minimalist satin anthracite background. 8k hyper-detailed resolution. Clean studio floor. High-end e-commerce style." }
          ]
        },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      let genUrl = '';
      if (response.candidates?.[0]?.content?.parts) {
        for (const p of response.candidates[0].content.parts) {
          if (p.inlineData) { 
            genUrl = `data:image/png;base64,${p.inlineData.data}`; 
            break; 
          }
        }
      }

      if (!genUrl) throw new Error("Empty AI response.");

      setResult({ url: genUrl, originalUrl: uploaded.url, badge: '8K MASTER' });
      setCredits(0);
      setIsProcessing(false);
      setCurrentStep(AppState.RESULT);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) { 
      setIsProcessing(false); 
      console.error("SYNTHESIS_ERROR:", e);
      
      if (e.message?.includes("not found") || e.message?.includes("API_KEY") || e.message?.includes("401")) {
          alert("BŁĄD AUTORYZACJI: Połącz klucz API w menu bocznym lub włącz tryb DEMO dla prezentacji.");
      } else {
          alert("BŁĄD SYSTEMU: Signal Lost. Spróbuj ponownie za chwilę.");
      }
    }
  };

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    if (currentStep === AppState.LENS) setCurrentStep(AppState.MISSION_HUB);
    setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const isMobile = windowSize.width < 1024;
  const orbitRadius = isMobile ? 180 : 380;

  return (
    <div className="relative min-h-screen w-full text-white selection:bg-blue-600/30 overflow-x-hidden">
      <TechnicalHUD credits={credits} isPro={credits === 0} />
      
      {/* Side Control Panel */}
      <div className="fixed top-24 left-10 z-[150] flex flex-col gap-4 pointer-events-auto">
        <div className="flex items-center gap-3 bg-black/60 border border-white/5 px-4 py-2 rounded-full backdrop-blur-xl">
            <div className={`w-2 h-2 rounded-full ${process.env.API_KEY ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 animate-pulse'}`} />
            <span className="mono text-[8px] uppercase tracking-widest text-white/60 font-black">
                {process.env.API_KEY ? 'NEURAL_LINK: READY' : 'NEURAL_LINK: OFFLINE'}
            </span>
        </div>
        
        {currentStep === AppState.MISSION_HUB && !isProcessing && (
            <div className="flex gap-2">
                <button 
                    onClick={handleKeySelection}
                    className="px-6 py-3 bg-blue-600/10 border border-blue-500/30 text-blue-500 mono text-[9px] font-black uppercase tracking-widest rounded-full hover:bg-blue-600 hover:text-white transition-all"
                >
                    [ LINK_KEY ]
                </button>
                <button 
                    onClick={() => setIsSimulationMode(!isSimulationMode)}
                    className={`px-6 py-3 border mono text-[9px] font-black uppercase tracking-widest rounded-full transition-all ${isSimulationMode ? 'bg-orange-600 border-orange-400 text-white shadow-[0_0_30px_rgba(234,88,12,0.4)]' : 'bg-black/40 border-white/10 text-white/40'}`}
                >
                    {isSimulationMode ? 'PRESENTATION_MODE: ON' : 'ENABLE_DEMO'}
                </button>
            </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {currentStep === AppState.LENS && (
          <motion.div 
            key="lens-screen" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ scale: 2, opacity: 0, filter: 'blur(40px)' }}
            className="fixed inset-0 z-[100] bg-black/40 flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ duration: 100, repeat: Infinity, ease: "linear" }} 
              className="absolute w-[600px] h-[600px] md:w-[900px] md:h-[900px] border border-blue-600/10 rounded-full pointer-events-none opacity-40" 
            />
            <div className="relative z-10 flex flex-col items-center">
              <h1 className="text-6xl md:text-9xl font-black italic uppercase tracking-tighter leading-none mb-12">
                <span className="text-blue-500 logo-glow">Aparat</span> <span className="text-white">AI</span>
              </h1>
              <p className="text-blue-400/60 mono text-xs md:text-sm tracking-[0.6em] uppercase mb-12 font-bold max-w-lg">
                NEURALNA SYNTEZA FOTOGRAFII PRODUKTOWEJ MASTER 8K
              </p>
              <button 
                onClick={handleStartMission} 
                className="px-16 py-8 bg-white text-black font-black italic rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-[0_0_80px_rgba(255,255,255,0.2)] uppercase tracking-widest text-lg group"
              >
                URUCHOM PROTOKÓŁ
              </button>
            </div>
          </motion.div>
        )}

        {(currentStep === AppState.MISSION_HUB || currentStep === AppState.RESULT) && (
          <motion.div 
            key="workshop-screen"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex flex-col w-full relative z-[50]"
          >
            <section ref={homeRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
              <motion.div 
                className="relative z-20 w-[280px] h-[280px] md:w-[450px] md:h-[450px]"
                animate={activeModule ? { scale: 0.8, filter: 'blur(5px)', opacity: 0.3 } : { scale: 1, filter: 'blur(0px)', opacity: 1 }}
              >
                <div className="absolute inset-0 rounded-full bg-blue-600/10 blur-[100px] animate-pulse" />
                <div className="w-full h-full rounded-full border-4 border-blue-500/20 bg-black/40 backdrop-blur-3xl flex flex-col items-center justify-center p-8 overflow-hidden shadow-[0_0_80px_rgba(37,99,235,0.2)]">
                  {isProcessing ? (
                    <div className="text-center z-10 p-6">
                      <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6 mx-auto" />
                      <div className="mono text-[10px] text-blue-400 tracking-[0.5em] uppercase font-black mb-2 animate-pulse">SYNTHESIZING...</div>
                      <div className="mono text-[8px] text-blue-400/40 uppercase tracking-[0.2em]">{isSimulationMode ? 'DEMO_PATH: ACTIVE' : 'NEURAL_ENGINE: ACTIVE'}</div>
                    </div>
                  ) : (
                    <div className="z-10 w-full h-full">
                      <DropZone onUpload={handleMainUpload} disabled={credits === 0} />
                      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 mono text-[8px] text-blue-500/60 uppercase tracking-[0.4em] font-bold text-center pointer-events-none logo-font">
                          APARAT AI // MASTER 8K ENGINE
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              <div className={isMobile ? "mt-12 grid grid-cols-2 gap-6 px-8 relative z-30" : "absolute inset-0 pointer-events-none"}>
                {ORBIT_MODULES.map((m) => {
                  const rad = (m.angle * Math.PI) / 180;
                  const x = isMobile ? 0 : Math.cos(rad) * orbitRadius;
                  const y = isMobile ? 0 : Math.sin(rad) * orbitRadius;
                  return (
                    <motion.div 
                      key={m.id} 
                      className={isMobile ? "" : "absolute pointer-events-auto"}
                      style={!isMobile ? { left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, transform: 'translate(-50%, -50%)' } : {}}
                    >
                      <motion.div 
                        onClick={() => setActiveModule(m.id)}
                        className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-2 bg-black/80 backdrop-blur-3xl flex items-center justify-center cursor-pointer transition-all duration-500 group relative shadow-2xl ${activeModule === m.id ? 'border-blue-500 shadow-[0_0_40px_rgba(37,99,235,0.4)]' : 'border-blue-500/20 hover:border-blue-500'}`}
                      >
                        <span className="text-3xl md:text-4xl group-hover:scale-110 transition-transform">{m.icon}</span>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* Instruction Section */}
            <div className="relative z-10 bg-black/20">
              <section ref={manualRef} className="py-32 px-10 flex flex-col items-center">
                <h2 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter mb-24 text-center">
                   INSTRUKCJA <br/> <span className="text-blue-500">DOWODZENIA</span>
                </h2>
                <div className="max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12">
                  {[
                    { t: '1. INITIATE CORE', d: 'Wgraj zdjęcie produktu. System zidentyfikuje obiekt i przygotuje dane RAW.' },
                    { t: '2. SYNEZJA SCENY', d: 'Silnik nałoży profesjonalne oświetlenie studyjne w jakości Master 8K.' },
                    { t: '3. DNA BRANDU', d: 'System automatycznie dostosuje paletę barw do Twojej identyfikacji wizualnej.' },
                    { t: '4. EKSPORT 8K', d: 'Pobierz gotowe reklamy Social Media gotowe do publikacji.' }
                  ].map((step, i) => (
                    <div key={i} className="p-10 border border-white/5 rounded-[40px] bg-white/5 backdrop-blur-3xl">
                      <div className="text-blue-600 mono text-3xl font-black mb-6">/ 0{i+1}</div>
                      <h3 className="text-2xl font-black italic uppercase mb-4">{step.t}</h3>
                      <p className="text-white/40 italic text-xl leading-relaxed">{step.d}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock */}
      <div className="fixed bottom-0 left-0 w-full z-[150]">
        <div className="flex justify-center py-6 px-10 gap-16 bg-black/60 backdrop-blur-3xl border-t border-white/5">
          <button onClick={() => { setCurrentStep(AppState.LENS); setCredits(1); setResult(null); }} className="flex flex-col items-center gap-1 group">
             <span className="text-2xl group-hover:scale-125 transition-all">🏠</span>
             <span className="mono text-[8px] uppercase tracking-widest text-white/40 group-hover:text-blue-500 font-bold">HOME</span>
          </button>
          <button onClick={() => scrollTo(manualRef)} className="flex flex-col items-center gap-1 group">
             <span className="text-2xl group-hover:scale-125 transition-all">📖</span>
             <span className="mono text-[8px] uppercase tracking-widest text-white/40 group-hover:text-blue-500 font-bold">INSTRUKCJA</span>
          </button>
          <button onClick={() => scrollTo(faqRef)} className="flex flex-col items-center gap-1 group">
             <span className="text-2xl group-hover:scale-125 transition-all">❓</span>
             <span className="mono text-[8px] uppercase tracking-widest text-white/40 group-hover:text-blue-500 font-bold">FAQ</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {currentStep === AppState.RESULT && result && (
          <motion.div 
            key="result-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center p-10 overflow-y-auto"
          >
             <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div className="space-y-10">
                   <h2 className="text-7xl font-black italic uppercase leading-none tracking-tighter">RENDER <br/><span className="text-blue-500">UKOŃCZONY.</span></h2>
                   <p className="text-white/50 text-2xl italic leading-relaxed">System zsyntezował dane RAW do formatu <span className="text-blue-500">Aparat AI</span> {result.badge}.</p>
                   {result.isExample && <div className="p-4 bg-orange-600/10 border border-orange-500/30 rounded-2xl mono text-[10px] text-orange-500 uppercase tracking-widest">WYNIK SYMULOWANY (PREZENTACJA)</div>}
                   <div className="flex flex-col gap-6">
                      <button onClick={() => { setResult(null); setCurrentStep(AppState.MISSION_HUB); setCredits(1); }} className="px-12 py-8 bg-blue-600 rounded-full text-white font-black italic uppercase tracking-widest text-sm">NOWA SESJA</button>
                      <button onClick={() => window.open(result.url)} className="px-12 py-6 border border-white/20 rounded-full text-white font-black italic uppercase tracking-widest hover:bg-white/5">POBIERZ MASTER</button>
                   </div>
                </div>
                <div className="aspect-square rounded-[60px] overflow-hidden border-4 border-blue-600/20 shadow-[0_0_80px_rgba(37,99,235,0.2)] bg-blue-900/10">
                   <img src={result.url} className="w-full h-full object-cover" alt="Result" />
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModule && (
          <React.Fragment key="module-overlay">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveModule(null)} className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] cursor-zoom-out" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] w-[95%] max-w-2xl bg-[#080808] border border-blue-500/30 rounded-[60px] p-12 md:p-20 shadow-[0_0_120px_rgba(37,99,235,0.3)]">
              <div className="mb-10 flex items-center gap-6">
                <span className="text-6xl">{ORBIT_MODULES.find(m => m.id === activeModule)?.icon}</span>
                <div>
                  <h3 className="text-3xl md:text-4xl font-black italic uppercase text-blue-500 mb-2 italic">{ORBIT_MODULES.find(m => m.id === activeModule)?.title}</h3>
                  <div className="mono text-[10px] text-blue-400 tracking-[0.4em] uppercase opacity-40">STATUS: {ORBIT_MODULES.find(m => m.id === activeModule)?.status}</div>
                </div>
              </div>
              <p className="text-2xl italic text-white/90 leading-relaxed mb-12">{ORBIT_MODULES.find(m => m.id === activeModule)?.desc}</p>
              <button onClick={() => setActiveModule(null)} className="w-full py-8 bg-blue-600 text-white font-black italic rounded-full uppercase tracking-[0.2em] text-sm shadow-2xl">ROZUMIEM</button>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
