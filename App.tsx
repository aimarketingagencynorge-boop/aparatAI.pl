
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppState, MissionType, ProcessingResult, Scenography, CampaignAsset } from './types';
import { cloudService } from './services/cloudService';
import TechnicalHUD from './components/TechnicalHUD';
import DropZone from './components/DropZone';
import { GoogleGenAI } from "@google/genai";

const SCENOGRAPHIES: Scenography[] = [
  { id: 'anthracite', name: 'Anthracite Flow', description: 'Gładka, bezmateriałowa powierzchnia o satynowym oddaniu głębokiej czerni.', gradient: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)' },
  { id: 'satin', name: 'Pure Satin', description: 'Czysty beton, architektoniczne cienie i satynowe wykończenie.', gradient: 'linear-gradient(135deg, #444 0%, #222 100%)' },
  { id: 'minimalism', name: 'Minimalism White', description: 'Jasne, sterylne studio o wysokiej dynamice tonalnej.', gradient: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)' }
];

const CAMPAIGN_ASSETS: CampaignAsset[] = [
  { type: 'INSTAGRAM', label: 'Instagram Post', format: '1:1', description: 'Kwadratowy render 1080x1080.' },
  { type: 'TIKTOK', label: 'TikTok / Reels', format: '9:16', description: 'Pionowy format 1080x1920.' },
  { type: 'FACEBOOK', label: 'FB Ad', format: '16:9', description: 'Grafika reklamowa 1200x628.' }
];

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
    label: 'SYNEZJA SCENOGRAFII', 
    icon: '🎬', 
    angle: -18, 
    title: 'SYNEZJA SCENOGRAFII', 
    desc: 'Twoje studio 24/7. Wybierz bazę: Anthracite, Satin lub Minimalism. System nałoży fizycznie poprawne odbicia, cienie i głębię ostrości.',
    status: 'STUDIO: READY'
  },
  { 
    id: 'SOCIAL_LAB' as MissionType, 
    label: 'SOCIAL MEDIA LAB', 
    icon: '📱', 
    angle: 54, 
    title: 'SOCIAL MEDIA LAB', 
    desc: 'Fabryka postów. Automatyczne kadrowanie do formatów 9:16 (TikTok/Reels) i 1:1 (Instagram). Twoja reklama gotowa w 15 sekund.',
    status: 'FORMATS: OK'
  },
  { 
    id: 'MISSION' as MissionType, 
    label: 'OPERACJA APARAT AI', 
    icon: '🚀', 
    angle: 198, 
    title: 'OPERACJA APARAT AI', 
    desc: 'Warsztat profesjonalisty Step-by-Step. Poznaj pełną metodologię pracy z naszym silnikiem Neural Engine i zdominuj e-commerce.',
    status: 'CORE: READY'
  },
  { 
    id: 'BRAND_LAB' as MissionType, 
    label: 'BRAND IDENTITY LAB', 
    icon: '🧬', 
    angle: 126, 
    title: 'BRAND IDENTITY LAB', 
    desc: 'Wgraj logo i DNA marki. Aparat AI dostosuje paletę barw każdego zdjęcia, aby Twoja oferta była spójna wizualnie na każdym ujęciu.',
    status: 'DNA: LINKED'
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
  const [selectedStyle, setSelectedStyle] = useState<Scenography>(SCENOGRAPHIES[0]);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  const homeRef = useRef<HTMLDivElement>(null);
  const manualRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStartMission = useCallback(() => setCurrentStep(AppState.MISSION_HUB), []);

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
            { text: `Professional studio photography. High-end lighting, ${selectedStyle.name} background. 8k, hyper-detailed product. Isolated object.` }
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
      setActiveModule(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { setIsProcessing(false); alert("Signal Lost. System Reset."); }
  };

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isMobile = windowWidth < 768;
  const orbitRadius = isMobile ? 0 : 420;

  return (
    <div className="relative min-h-screen w-full bg-transparent text-white flex flex-col">
      <TechnicalHUD credits={credits} isPro={credits === 0} />

      {/* Sticky Command Dock */}
      {currentStep !== AppState.LENS && (
        <div className="fixed bottom-0 left-0 w-full z-[150]">
          <div className="w-full h-[1px] bg-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.4)]"></div>
          <div className="flex justify-center py-6 px-10 gap-16 bg-black/60 backdrop-blur-3xl border-t border-white/5">
            <button onClick={() => { setCurrentStep(AppState.MISSION_HUB); setResult(null); scrollTo(homeRef); }} className="flex flex-col items-center gap-1 group">
               <span className="text-2xl group-hover:scale-125 transition-transform duration-300">🏠</span>
               <span className="mono text-[8px] uppercase tracking-widest text-white/40 group-hover:text-blue-500">DOM</span>
            </button>
            <button onClick={() => scrollTo(manualRef)} className="flex flex-col items-center gap-1 group">
               <span className="text-2xl group-hover:scale-125 transition-transform duration-300">📖</span>
               <span className="mono text-[8px] uppercase tracking-widest text-white/40 group-hover:text-blue-500">INSTRUKCJA</span>
            </button>
            <button onClick={() => scrollTo(faqRef)} className="flex flex-col items-center gap-1 group">
               <span className="text-2xl group-hover:scale-125 transition-transform duration-300">❓</span>
               <span className="mono text-[8px] uppercase tracking-widest text-white/40 group-hover:text-blue-500">FAQ</span>
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {currentStep === AppState.LENS && (
          <motion.div key="lens" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ scale: 3, opacity: 0 }} className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 180, repeat: Infinity, ease: "linear" }} className="absolute w-[800px] h-[800px] border border-blue-600/10 rounded-full pointer-events-none" />
            <div className="relative z-20">
              <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter leading-none mb-10">APARAT <span className="text-blue-600">AI</span></h1>
              <button onClick={handleStartMission} className="px-16 py-6 bg-white text-black font-black italic rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-[0_0_80px_rgba(255,255,255,0.3)] uppercase tracking-widest">URUCHOM PROTOKÓŁ</button>
            </div>
          </motion.div>
        )}

        {(currentStep === AppState.MISSION_HUB || currentStep === AppState.RESULT || currentStep === AppState.CAMPAIGN) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col w-full">
            
            {/* Section 1: Dashboard */}
            <section ref={homeRef} className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-32">
              <div className="relative w-full h-full flex items-center justify-center">
                
                {/* Laser Beams (Desktop Only) */}
                {!isMobile && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <defs><filter id="beamGlow"><feGaussianBlur stdDeviation="3" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter></defs>
                    {ORBIT_MODULES.map(m => {
                        const rad = (m.angle * Math.PI) / 180;
                        const x1 = windowWidth / 2;
                        const y1 = window.innerHeight / 2;
                        const x2 = x1 + Math.cos(rad) * (orbitRadius - 80);
                        const y2 = y1 + Math.sin(rad) * (orbitRadius - 80);
                        return <line key={m.id} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2563eb" strokeWidth="2" strokeOpacity="0.4" className="laser-link" filter="url(#beamGlow)" />;
                    })}
                  </svg>
                )}

                {/* Central Initiate Core */}
                <motion.div 
                  className="relative z-20 w-[300px] h-[300px] md:w-[500px] md:h-[500px] glitch-effect"
                  animate={activeModule ? { scale: 0.85, opacity: 0.4, filter: 'blur(5px)' } : { scale: 1, opacity: 1, filter: 'blur(0px)' }}
                >
                  <div className="absolute inset-0 rounded-full bg-blue-600/10 blur-[100px]" />
                  <div className="w-full h-full rounded-full border-[3px] border-blue-500/20 bg-black/40 backdrop-blur-3xl flex flex-col items-center justify-center p-12 overflow-hidden shadow-[0_0_80px_rgba(37,99,235,0.2)] group relative">
                    <div className="absolute inset-0 border border-blue-500/10 rounded-full animate-[spin_20s_linear_infinite]" />
                    <div className="absolute inset-8 border border-blue-500/5 rounded-full animate-[spin_30s_linear_infinite_reverse]" />
                    
                    {isProcessing ? (
                      <div className="text-center z-20">
                        <div className="w-24 h-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-8 mx-auto shadow-[0_0_30px_rgba(37,99,235,0.5)]" />
                        <span className="mono text-[11px] text-blue-400 tracking-[0.5em] animate-pulse uppercase font-black">SYNTEZA_W_TOKU...</span>
                      </div>
                    ) : (
                      <div className="z-20 w-full h-full">
                        <DropZone onUpload={handleMainUpload} disabled={credits === 0} />
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 mono text-[9px] text-blue-500/50 uppercase tracking-[0.4em] font-bold text-center pointer-events-none">
                            APARAT AI // MASTER HD ENGINE
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Interactive Orbital Wheels */}
                <div className={isMobile ? "mt-16 grid grid-cols-2 gap-8 px-10" : "absolute inset-0 pointer-events-none"}>
                  {ORBIT_MODULES.map((m) => {
                    const rad = (m.angle * Math.PI) / 180;
                    const x = isMobile ? 0 : Math.cos(rad) * orbitRadius;
                    const y = isMobile ? 0 : Math.sin(rad) * orbitRadius;
                    const isActive = activeModule === m.id;
                    
                    return (
                      <motion.div 
                        key={m.id} 
                        className={isMobile ? "flex flex-col items-center" : "absolute pointer-events-auto flex flex-col items-center"}
                        style={!isMobile ? { left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, transform: 'translate(-50%, -50%)' } : {}}
                      >
                        <motion.div 
                          whileHover={{ scale: 1.15 }} 
                          className={`w-24 h-24 md:w-36 md:h-36 rounded-full border-2 bg-black/80 backdrop-blur-2xl flex items-center justify-center relative cursor-pointer transition-all duration-500 floating-module shadow-2xl ${isActive ? 'border-blue-500 shadow-[0_0_40px_rgba(37,99,235,0.4)]' : 'border-blue-500/20 hover:border-blue-500'}`}
                          onClick={() => { if(m.id === 'MISSION') scrollTo(manualRef); else setActiveModule(m.id); }}
                        >
                          <span className="text-4xl md:text-5xl">{m.icon}</span>
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 mono text-[7px] text-blue-500/80 uppercase tracking-widest font-black">{m.status}</div>
                        </motion.div>
                        <div className="mt-4 bg-black/60 backdrop-blur-lg px-5 py-2 rounded-full border border-blue-500/20 shadow-lg">
                          <span className="text-[10px] font-black uppercase italic tracking-tighter text-blue-400 mono">{m.label}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Results Layer */}
            {currentStep === AppState.RESULT && result && (
              <section className="min-h-screen py-32 px-10 flex flex-col items-center">
                 <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
                    <div className="space-y-12">
                       <h2 className="text-7xl md:text-9xl font-black italic uppercase leading-none tracking-tighter">MÓJ <br/><span className="text-blue-600">STUDIO.</span></h2>
                       <p className="text-white/50 text-2xl italic leading-relaxed font-light">Twoje surowe dane zostały w pełni zsyntezowane do formatu Master 8K. Oświetlenie studyjne i tekstury są gotowe do kampanii.</p>
                       <div className="flex flex-col gap-6 w-full max-w-sm">
                          <button onClick={() => setCurrentStep(AppState.CAMPAIGN)} className="px-16 py-8 bg-blue-600 rounded-full text-white font-black italic uppercase tracking-[0.2em] text-sm shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:bg-blue-500 transition-all">SOCIAL MEDIA LAB</button>
                          <button onClick={() => window.open(result.url)} className="px-16 py-6 border-2 border-white/20 rounded-full text-white font-black italic uppercase tracking-widest hover:bg-white/10 transition-all">POBIERZ MASTER 8K</button>
                       </div>
                    </div>
                    <div className="aspect-square rounded-[80px] overflow-hidden border-4 border-blue-600/40 shadow-[0_0_120px_rgba(37,99,235,0.3)] bg-black group relative">
                       <img src={result.url} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" />
                       <div className="absolute top-8 right-8 bg-blue-600 text-[10px] font-black px-6 py-2 rounded-full shadow-xl">RENDER: 8K MASTER</div>
                    </div>
                 </div>
              </section>
            )}

            {/* Section 2: Instruction Manual */}
            <section ref={manualRef} className="min-h-screen py-40 px-10 flex flex-col items-center bg-black/10">
              <div className="w-full max-w-6xl">
                <h2 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter mb-24 text-center leading-none">WORKSHOP <br/><span className="text-blue-600">DOWODZENIA</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  {[
                    { step: '01', title: 'INITIATE CORE', desc: 'Wgraj surowe dane. Neuralna Percepcja zidentyfikuje Twój produkt i izoluje go od otoczenia z dokładnością do 1px.' },
                    { step: '02', title: 'SYNEZJA SCENOGRAFII', desc: 'Wybierz świat produktu. Silnik nałoży fizycznie poprawne oświetlenie, odbicia i głębię ostrości wybranej bazy.' },
                    { step: '03', title: 'DNA BRANDINGU', desc: 'Zaimplementuj paletę barw i logotypy. Aparat AI dba o wizualną spójność każdego ujęcia Twojej oferty.' },
                    { step: '04', title: 'GLOBAL EKSPORT', desc: 'Wygeneruj gotowe reklamy TikTok/Instagram jednym kliknięciem. Twój marketing jest gotowy do emisji.' }
                  ].map((item, idx) => (
                    <motion.div whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 40 }} viewport={{ once: true }} key={item.step} className="p-12 border border-white/10 rounded-[48px] bg-black/40 backdrop-blur-3xl group hover:border-blue-500 transition-all duration-500 shadow-2xl">
                      <div className="text-blue-600 text-6xl font-black mb-8 mono tracking-tighter">/ {item.step}</div>
                      <h3 className="text-3xl font-black uppercase mb-6 italic">{item.title}</h3>
                      <p className="text-white/40 leading-relaxed text-xl italic font-light">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Section 3: FAQ & Paywall */}
            <section ref={faqRef} className="min-h-screen py-40 px-10 flex flex-col items-center pb-80">
              <div className="w-full max-w-4xl">
                <h2 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter mb-24 text-center">SYSTEM <span className="text-blue-600">INTEL</span></h2>
                
                <div className="space-y-8 mb-40">
                  {FAQS.map((faq, i) => (
                    <div key={i} className="p-10 bg-blue-600/5 border border-white/10 rounded-[40px] hover:bg-blue-600/10 transition-all duration-500 backdrop-blur-xl">
                      <h4 className="text-2xl font-black italic text-blue-500 mb-6 uppercase tracking-widest italic">+ {faq.q}</h4>
                      <p className="text-white/50 italic text-lg leading-relaxed font-light">{faq.a}</p>
                    </div>
                  ))}
                </div>

                <div className="p-20 border-2 border-blue-600 rounded-[80px] bg-blue-600/5 text-center shadow-[0_0_150px_rgba(37,99,235,0.2)] backdrop-blur-3xl relative overflow-hidden">
                   <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full" />
                   <h3 className="text-5xl font-black italic uppercase mb-10 tracking-tighter leading-none">ODBLOKUJ <br/><span className="text-blue-600">FULL ACCESS PRO</span></h3>
                   <p className="text-white/40 text-2xl italic mb-16 font-light leading-relaxed">Zyskaj nielimitowane rendery 8K, brak znaków wodnych i priorytet renderowania. Zostań warsztatowym dowódcą e-commerce.</p>
                   <button onClick={() => window.open('https://google.com')} className="px-24 py-10 bg-blue-600 text-white font-black italic rounded-full uppercase tracking-[0.3em] text-sm shadow-[0_0_60px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-all">AKTYWUJ WERSJĘ PRO</button>
                </div>
              </div>
            </section>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Workshop Module Detail Modal */}
      <AnimatePresence>
        {activeModule && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveModule(null)} className="fixed inset-0 bg-black/95 backdrop-blur-[15px] z-[200] cursor-zoom-out" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 100 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 100 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] w-[95%] max-w-3xl bg-black border-2 border-blue-500/40 rounded-[80px] p-16 md:p-24 shadow-[0_0_150px_rgba(37,99,235,0.4)] backdrop-blur-3xl overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500/40"></div>
               <div className="mb-12 border-b border-white/10 pb-10">
                 <h3 className="text-4xl md:text-5xl font-black italic uppercase text-blue-500 tracking-tighter italic leading-none">
                   {ORBIT_MODULES.find(m => m.id === activeModule)?.title}
                 </h3>
                 <div className="mt-4 mono text-[10px] text-blue-400 tracking-[0.5em] uppercase opacity-50">WORKSHOP_ID: {activeModule}_X_09</div>
               </div>
               <p className="text-2xl md:text-3xl italic text-white/90 leading-relaxed mb-20 font-light">
                 {ORBIT_MODULES.find(m => m.id === activeModule)?.desc}
               </p>
               <div className="flex flex-col gap-6">
                 <button onClick={() => { scrollTo(homeRef); setActiveModule(null); }} className="w-full py-10 bg-blue-600 text-white font-black italic rounded-full uppercase tracking-[0.2em] text-sm shadow-2xl hover:bg-blue-500 transition-all">WYPRÓBUJ TĘ FUNKCJĘ</button>
                 <button onClick={() => setActiveModule(null)} className="w-full py-6 border-2 border-white/10 text-white/30 font-black italic rounded-full uppercase tracking-widest text-[11px] hover:bg-white/5 transition-colors">POWRÓT DO WARSZTATU</button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
