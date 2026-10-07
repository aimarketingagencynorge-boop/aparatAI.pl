
import React from 'react';
import { Camera, Cpu, Zap, Sun, Video, FileText, Share2, Shield, Play, Layers, Maximize, MousePointer2, Sparkles, Box, Info, ArrowRight } from 'lucide-react';

const PresentationView: React.FC<{ t: any }> = ({ t }) => {
  const capabilities = [
    {
      id: 'neural-engine',
      title: 'Neural Optical Engine v4.5',
      icon: Cpu,
      desc: 'Sercem aparatu są dwa dedykowane silniki syntezy obrazu: PRO dla jakości 4K oraz FLASH dla bezlimitowej szybkości i bypassu limitów.',
      stats: [
        { label: 'Latency', val: '450ms' },
        { label: 'Ujęcia/Min', val: '∞ (Admin Mode)' },
        { label: 'Model', val: 'Gemini 3 Pro' }
      ],
      color: 'blue'
    },
    {
      id: 'atmosphere',
      title: 'Neural Lighting Lab',
      icon: Sun,
      desc: 'System dynamicznego oświetlenia symulujący fizykę światła w czasie rzeczywistym. Od Złotej Godziny po studyjny Soft-Box.',
      stats: [
        { label: 'Profile', val: '9+ Master' },
        { label: 'Technologia', val: 'Ray-Tracing AI' },
        { label: 'Zgodność', val: 'HDR10' }
      ],
      color: 'amber'
    },
    {
      id: 'menu-logic',
      title: 'OCR-to-Studio Pipeline',
      icon: FileText,
      desc: 'Technologia zamiany surowego tekstu menu na fotorealistyczne dania. Rozpoznaje składniki, ceny i sugeruje kompozycję.',
      stats: [
        { label: 'Analiza', val: 'Deep NLP' },
        { label: 'Prędkość', val: 'Batch 50/sec' },
        { label: 'Accuracy', val: '99.8%' }
      ],
      color: 'green'
    },
    {
      id: 'video-synthesis',
      title: 'Neural Video Generator',
      icon: Video,
      desc: 'Veo 3.1 Fast pozwala na ożywienie zdjęć produktowych, tworząc kinowe reklamy 1080p z płynną fizyką i głębią ostrości.',
      stats: [
        { label: 'Rozdzielczość', val: '1080p' },
        { label: 'Długość', val: '5s / ujęcie' },
        { label: 'Framerendering', val: 'Cloud GPU' }
      ],
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string) => {
    const maps: Record<string, string> = {
      blue: 'text-blue-500 border-blue-500/20 bg-blue-500/10',
      amber: 'text-amber-500 border-amber-500/20 bg-amber-500/10',
      green: 'text-green-500 border-green-500/20 bg-green-500/10',
      purple: 'text-purple-500 border-purple-500/20 bg-purple-500/10'
    };
    return maps[color] || maps.blue;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] p-6 lg:p-12 font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto space-y-24 pb-32">
        
        {/* HERO SECTION */}
        <section className="text-center space-y-8 py-20 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-900 rounded-full border border-zinc-800">
                <Sparkles size={14} className="text-blue-500" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">MANUAL & CAPABILITIES GUIDE v4.5</span>
             </div>
             <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                FUTURE OF <br /> <span className="text-blue-600 drop-shadow-[0_0_40px_rgba(37,99,235,0.4)]">OPTICS.</span>
             </h1>
             <p className="max-w-2xl mx-auto text-zinc-500 text-lg font-medium leading-relaxed">
                Poznaj możliwości "Mojego Aparatu AI" – najbardziej zaawansowanego studia fotograficznego opartego na neuronowej syntezie obrazu.
             </p>
          </div>
        </section>

        {/* BENTO GRID CAPABILITIES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {capabilities.map((cap, i) => (
             <div key={cap.id} className="group p-10 rounded-[3rem] bg-zinc-900/40 border border-zinc-900 hover:border-blue-500/30 transition-all duration-700 flex flex-col justify-between space-y-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                   <cap.icon size={200} strokeWidth={1} />
                </div>
                
                <div className="space-y-6 relative">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${getColorClasses(cap.color)}`}>
                      <cap.icon size={28} />
                   </div>
                   <div className="space-y-3">
                      <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{cap.title}</h3>
                      <p className="text-zinc-500 text-sm leading-relaxed font-medium">
                        {cap.desc}
                      </p>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-12 border-t border-zinc-800/50">
                   {cap.stats.map((s, si) => (
                     <div key={si}>
                        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-1">{s.label}</p>
                        <p className="text-sm font-black text-zinc-300 italic uppercase">{s.val}</p>
                     </div>
                   ))}
                </div>
             </div>
           ))}
        </div>

        {/* DETAILED LOGIC EXPLORER */}
        <section className="space-y-12">
           <div className="flex items-center gap-4 border-b border-zinc-900 pb-6">
              <Layers className="text-blue-500" />
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">TECHNICAL WORKFLOW</h2>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="space-y-6">
                 <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 font-black italic">01</div>
                 <h4 className="text-xl font-black text-zinc-100 uppercase italic tracking-tighter">Neural Ingestion</h4>
                 <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                    Aparat analizuje surowy negatyw (RAW) z telefonu, wydzielając produkt z tła za pomocą segmentacji semantycznej. AI "rozumie" teksturę materiału – od szkła po bawełnę.
                 </p>
              </div>
              <div className="space-y-6">
                 <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 font-black italic">02</div>
                 <h4 className="text-xl font-black text-zinc-100 uppercase italic tracking-tighter">Atmosphere Rendering</h4>
                 <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                    Wybrany styl (np. Black Satin) jest renderowany jako pełna scena 3D, w której produkt jest "zanurzony". Neural Lighting rzuca fizycznie poprawne cienie i refleksy.
                 </p>
              </div>
              <div className="space-y-6">
                 <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 font-black italic">03</div>
                 <h4 className="text-xl font-black text-zinc-100 uppercase italic tracking-tighter">Final Master Output</h4>
                 <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                    System łączy segmentację z renderem tła, nakładając post-processing HD/4K. Efektem jest ujęcie gotowe do druku lub social mediów, bez potrzeby retuszu manualnego.
                 </p>
              </div>
           </div>
        </section>

        {/* CTA SECTION */}
        <section className="p-16 rounded-[4rem] bg-gradient-to-br from-blue-600 to-blue-900 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-1000">
              <Camera size={300} />
           </div>
           <div className="relative z-10 space-y-8 max-w-2xl">
              <h2 className="text-5xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">GOTOWY NA <br /> <span className="text-zinc-950">REWOLUCJĘ?</span></h2>
              <p className="text-blue-100 text-lg font-medium">
                 Twój profesjonalny aparat jest już gotowy. Wybierz ujęcie i pozwól AI zająć się resztą.
              </p>
              <button onClick={() => window.location.reload()} className="px-12 py-5 bg-zinc-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-4 hover:scale-105 transition-all active:scale-95">
                 <Play size={14} fill="currentColor" /> POWRÓT DO APARAT_CORE
              </button>
           </div>
        </section>
      </div>
    </div>
  );
};

export default PresentationView;
