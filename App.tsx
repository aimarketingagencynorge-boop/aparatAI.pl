
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
    desc: 'Neural Clipping & Scanning. System precyzyjnie identyfikuje produkt, izoluje go od otoczenia (usuwa dłonie, cienie, tło) i przygotowuje do nowej syntezy.',
    status: 'SENSORS: ACTIVE'
  },
  { 
    id: 'SCENOGRAPHY' as MissionType, 
    label: 'SCENOGRAFIA', 
    icon: '🎬', 
    angle: -18, 
    title: 'SYNEZJA SCENOGRAFII', 
    desc: 'Twoje studio 24/7. Wybierz bazę: Anthracite, Satin lub Minimalism. System nałoży fizycznie poprawne odbicia, cienie i głębię ostrości.',
    status: 'STUDIO: READY'
  },
  { 
    id: 'SOCIAL_LAB' as MissionType, 
    label: 'SOCIAL MEDIA', 
    icon: '📱', 
    angle: 54, 
    title: 'SOCIAL MEDIA LAB', 
    desc: 'Fabryka postów. Automatyczne kadrowanie do formatów 9:16 (TikTok/Reels) i 1:1 (Instagram). Twoja reklama gotowa w 15 sekund.',
    status: 'FORMATS: OK'
  },
  { 
    id: 'BRAND_LAB' as MissionType, 
    label: 'BRANDING', 
    icon: '🧬', 
    angle: 126, 
    title: 'BRAND IDENTITY LAB', 
    desc: 'Wgraj logo i DNA marki. Aparat AI dostosuje paletę barw każdego zdjęcia, aby Twoja oferta była spójna wizualnie na każdym ujęciu.',
    status: 'DNA: LINKED'
  },
  { 
    id: 'MISSION' as MissionType, 
    label: 'MENU', 
    icon: '🚀', 
    angle: 198, 
    title: 'MENU WARSZTATU', 
    desc: 'Warsztat profesjonalisty Step-by-Step. Poznaj pełną metodologię pracy z naszym silnikiem Neural Engine i zdominuj e-commerce.',
    status: 'CORE: READY'
  }
];

const FAQS = [
  { q: 'Czy muszę mieć profesjonalny aparat?', a: 'Nie. Aparat AI optymalizuje surowe pliki JPG/PNG z telefonu do jakości renderów studyjnych.' },
  { q: 'Co jeśli na zdjęciu widać dłoń?', a: 'Neuralna Percepcja automatycznie izoluje produkt i usuwa zbędne elementy w procesie czyszczenia danych.' },
  { q: 'Jakie formaty obsługuje Social Media Lab?', a: 'TikTok/Reels (9:16), Instagram (1:1) oraz Facebook Ads (16:9).' }
];

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppState>(AppState.LENS);
  const [activeModule, setActiveModule] = useState<MissionType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [credits, setCredits] = useState(1);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

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

  const handleMainUpload = async (file: File) => {
    if (credits === 0) return;
    setIsProcessing(true);
    try {
      const uploaded = await cloudService.uploadImage(file);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = uploaded.url.split(',')[1];
      const mimeType = uploaded.url.split(';')[0].split(':')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: `Professional studio photography. High-end lighting, satin anthracite flow background. 8k hyper-detailed product. Isolated on professional floor.` }
          ]
        },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      let genUrl = '';
      if (response.candidates?.[0]?.content?.parts) {
        for (const p of response.candidates[0].content.parts) {
          if (p.inlineData) { genUrl = `data:image/png;base64,${p.inlineData.data}`; break; }
        }
      }
      setResult({ url: genUrl, originalUrl: uploaded.url, badge: '8K MASTER' });
      setCredits(0);
      cloudService.lockSystem();
      setIsProcessing(false);
      setCurrentStep(AppState.RESULT);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { 
      setIsProcessing(false); 
      console.error(e);
      alert("Signal Lost. System Reset."); 
    }
  };

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    if (currentStep === AppState.LENS) {
        setCurrentStep(AppState.MISSION_HUB);
    }
    setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const isMobile = windowSize.width < 1024;
  const orbitRadius = isMobile ? 180 : 380;

  return (
    <div className="relative min-h-screen w-full text-white selection:bg-blue-600/30 overflow-x-hidden">
      <TechnicalHUD credits={credits} isPro={credits === 0} />

      <AnimatePresence mode="wait">
        {currentStep === AppState.LENS && (
          <motion.div 
            key="lens-screen" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ scale: 2, opacity: 0, filter: 'blur(40px)' }}
            transition={{ duration: 0.8, ease: "circIn" }}
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
                className="px-16 py-8 bg-white text-black font-black italic rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-[0_0_80px_rgba(255,255,255,0.2)] uppercase tracking-widest text-lg group overflow-hidden relative"
              >
                <span className="relative z-10">URUCHOM PROTOKÓŁ</span>
                <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
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
            {/* Main Workshop Canvas */}
            <section ref={homeRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
              
              {/* SVG Laser Links */}
              {!isMobile && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <defs>
                    <filter id="glow"><feGaussianBlur stdDeviation="4" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
                  </defs>
                  {ORBIT_MODULES.map(m => {
                    const rad = (m.angle * Math.PI) / 180;
                    const x1 = windowSize.width / 2;
                    const y1 = windowSize.height / 2;
                    const x2 = x1 + Math.cos(rad) * (orbitRadius - 60);
                    const y2 = y1 + Math.sin(rad) * (orbitRadius - 60);
                    return (
                      <line 
                        key={m.id} 
                        x1={x1} y1={y1} x2={x2} y2={y2} 
                        stroke="#2563eb" strokeWidth="2" strokeOpacity="0.4" 
                        className="laser-link" 
                        filter="url(#glow)"
                      />
                    );
                  })}
                </svg>
              )}

              {/* Central Initiate Core */}
              <motion.div 
                className="relative z-20 w-[280px] h-[280px] md:w-[450px] md:h-[450px]"
                animate={activeModule ? { scale: 0.8, filter: 'blur(5px)', opacity: 0.3 } : { scale: 1, filter: 'blur(0px)', opacity: 1 }}
                transition={{ duration: 0.8, ease: "circOut" }}
              >
                <div className="absolute inset-0 rounded-full bg-blue-600/10 blur-[100px] animate-pulse" />
                <div className="w-full h-full rounded-full border-4 border-blue-500/20 bg-black/40 backdrop-blur-3xl flex flex-col items-center justify-center p-8 overflow-hidden shadow-[0_0_80px_rgba(37,99,235,0.2)] glitch-effect">
                  <div className="absolute inset-0 border border-blue-500/10 rounded-full animate-[spin_40s_linear_infinite]" />
                  <div className="absolute inset-10 border border-blue-500/5 rounded-full animate-[spin_60s_linear_infinite_reverse]" />
                  
                  {isProcessing ? (
                    <div className="text-center z-10">
                      <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6 mx-auto" />
                      <span className="mono text-[10px] text-blue-400 tracking-[0.5em] uppercase font-black">SYNTHESIZING...</span>
                    </div>
                  ) : (
                    <div className="z-10 w-full h-full">
                      <DropZone onUpload={handleMainUpload} disabled={credits === 0} />
                      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 mono text-[8px] text-blue-500/60 uppercase tracking-[0.4em] font-bold text-center pointer-events-none logo-font">
                          APARAT AI // MASTER HD ENGINE
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Orbital Wheels Mapping */}
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
                        whileHover={{ scale: 1.1, y: -5 }}
                        onClick={() => setActiveModule(m.id)}
                        className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-2 bg-black/80 backdrop-blur-3xl flex items-center justify-center cursor-pointer transition-all duration-500 group relative shadow-2xl ${activeModule === m.id ? 'border-blue-500 shadow-[0_0_40px_rgba(37,99,235,0.4)]' : 'border-blue-500/20 hover:border-blue-500'}`}
                      >
                        <span className="text-3xl md:text-4xl group-hover:scale-110 transition-transform">{m.icon}</span>
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 border border-white/5 px-4 py-1 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                           <span className="mono text-[8px] uppercase tracking-tighter text-blue-400 font-black">{m.label}</span>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* Workshop Content Sections (Below the fold) */}
            <div className="relative z-10 bg-black/20">
              <section ref={manualRef} className="py-32 px-10 flex flex-col items-center">
                <h2 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter mb-24 text-center leading-none">
                   INSTRUKCJA <br/> <span className="text-blue-500">DOWODZENIA</span>
                </h2>
                <div className="max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12">
                  {[
                    { t: '1. INITIATE CORE', d: 'Wgraj zdjęcie produktu wykonane smartfonem. Neuralna Percepcja zidentyfikuje obiekt i przygotuje dane RAW.' },
                    { t: '2. SYNEZJA SCENY', d: 'Silnik nałoży profesjonalne oświetlenie studyjne i wybraną teksturę podłoża (Anthracite, Satin).' },
                    { t: '3. DNA BRANDU', d: 'System automatycznie dostosuje paletę barw renderu do Twojej identyfikacji wizualnej.' },
                    { t: '4. EKSPORT 8K', d: 'Pobierz gotowe reklamy w formatach 1:1 oraz 9:16 gotowe do publikacji w Social Media.' }
                  ].map((step, i) => (
                    <div key={i} className="p-10 border border-white/5 rounded-[40px] bg-white/5 backdrop-blur-3xl hover:border-blue-500/30 transition-colors">
                      <div className="text-blue-600 mono text-3xl font-black mb-6">/ 0{i+1}</div>
                      <h3 className="text-2xl font-black italic uppercase mb-4">{step.t}</h3>
                      <p className="text-white/40 italic text-xl leading-relaxed">{step.d}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section ref={faqRef} className="py-32 px-10 pb-64 flex flex-col items-center">
                <div className="max-w-4xl w-full">
                  <h2 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter mb-24 text-center leading-none">SYSTEM <span className="text-blue-500">INTEL (FAQ)</span></h2>
                  <div className="space-y-6">
                    {FAQS.map((faq, i) => (
                      <div key={i} className="p-8 bg-blue-600/5 border border-white/5 rounded-[30px] backdrop-blur-xl">
                        <h4 className="text-xl font-black italic text-blue-500 mb-4 uppercase tracking-wider">+ {faq.q}</h4>
                        <p className="text-white/50 italic text-lg leading-relaxed">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workshop Info Panel Overlay */}
      <AnimatePresence>
        {activeModule && (
          <React.Fragment key="module-overlay">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActiveModule(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-[20px] z-[200] cursor-zoom-out" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] w-[95%] max-w-2xl bg-[#080808] border border-blue-500/30 rounded-[60px] p-12 md:p-20 shadow-[0_0_120px_rgba(37,99,235,0.3)]"
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500/50" />
              <div className="mb-10 flex items-center gap-6">
                <span className="text-6xl">{ORBIT_MODULES.find(m => m.id === activeModule)?.icon}</span>
                <div>
                  <h3 className="text-3xl md:text-4xl font-black italic uppercase text-blue-500 leading-none mb-2 italic">
                    {ORBIT_MODULES.find(m => m.id === activeModule)?.title}
                  </h3>
                  <div className="mono text-[10px] text-blue-400 tracking-[0.4em] uppercase opacity-40">SYSTEM_STATUS: {ORBIT_MODULES.find(m => m.id === activeModule)?.status}</div>
                </div>
              </div>
              <p className="text-2xl italic text-white/90 leading-relaxed mb-12 font-light">
                {ORBIT_MODULES.find(m => m.id === activeModule)?.desc}
              </p>
              <button 
                onClick={() => setActiveModule(null)}
                className="w-full py-8 bg-blue-600 text-white font-black italic rounded-full uppercase tracking-[0.2em] text-sm hover:bg-blue-500 transition-all shadow-2xl"
              >
                ROZUMIEM, POWRÓT DO CORE
              </button>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

      {/* Sticky Command Dock */}
      <div className="fixed bottom-0 left-0 w-full z-[150]">
        <div className="w-full h-[1px] bg-blue-500/20" />
        <div className="flex justify-center py-6 px-10 gap-16 bg-black/60 backdrop-blur-3xl border-t border-white/5">
          <button onClick={() => { setCurrentStep(AppState.LENS); setCredits(1); setResult(null); }} className="flex flex-col items-center gap-1 group">
             <span className="text-2xl group-hover:scale-125 transition-transform duration-300">🏠</span>
             <span className="mono text-[8px] uppercase tracking-widest text-white/40 group-hover:text-blue-500 font-bold">HOME</span>
          </button>
          <button onClick={() => scrollTo(manualRef)} className="flex flex-col items-center gap-1 group">
             <span className="text-2xl group-hover:scale-125 transition-transform duration-300">📖</span>
             <span className="mono text-[8px] uppercase tracking-widest text-white/40 group-hover:text-blue-500 font-bold">INSTRUKCJA</span>
          </button>
          <button onClick={() => scrollTo(faqRef)} className="flex flex-col items-center gap-1 group">
             <span className="text-2xl group-hover:scale-125 transition-transform duration-300">❓</span>
             <span className="mono text-[8px] uppercase tracking-widest text-white/40 group-hover:text-blue-500 font-bold">FAQ</span>
          </button>
        </div>
      </div>

      {/* Result Display Overlay */}
      <AnimatePresence>
        {currentStep === AppState.RESULT && result && (
          <motion.div 
            key="result-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center p-10 overflow-y-auto"
          >
             <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div className="space-y-10">
                   <h2 className="text-7xl font-black italic uppercase leading-none tracking-tighter italic">RENDER <br/><span className="text-blue-500">UKOŃCZONY.</span></h2>
                   <p className="text-white/50 text-2xl italic leading-relaxed">System zsyntezował dane RAW do formatu <span className="text-blue-500">Aparat AI</span> 8K Master. Oświetlenie studyjne i cienie zostały nałożone poprawnie.</p>
                   <div className="flex flex-col gap-6">
                      {credits === 0 ? (
                        <button className="px-12 py-8 bg-blue-600/10 border border-blue-500 text-blue-500 font-black italic rounded-full uppercase tracking-widest text-sm">
                          PAYWALL: AKTYWUJ PRO DLA 8K
                        </button>
                      ) : (
                        <button onClick={() => setCurrentStep(AppState.MISSION_HUB)} className="px-12 py-8 bg-blue-600 rounded-full text-white font-black italic uppercase tracking-widest text-sm">GENERUJ KOLEJNY</button>
                      )}
                      <button onClick={() => window.open(result.url)} className="px-12 py-6 border border-white/20 rounded-full text-white font-black italic uppercase tracking-widest hover:bg-white/5">POBIERZ MASTER 8K</button>
                      <button onClick={() => { setResult(null); setCurrentStep(AppState.MISSION_HUB); }} className="mono text-[10px] text-white/40 uppercase tracking-widest underline underline-offset-8">POWRÓT DO WARSZTATU</button>
                   </div>
                </div>
                <div className="aspect-square rounded-[60px] overflow-hidden border-4 border-blue-600/20 shadow-[0_0_80px_rgba(37,99,235,0.2)] bg-blue-900/10">
                   <img src={result.url} className="w-full h-full object-cover" alt="Result" />
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
