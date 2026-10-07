
import React from 'react';
import { Layers, Sun, MousePointer2, Palette, Maximize, Navigation, Info, Save, Check, Square, Monitor, Smartphone, RectangleHorizontal, User, Shirt, UserCircle, Edit3, Sliders, HardDrive, Zap, Shield, CheckCircle, Boxes, Layout, Anchor, Table, Cpu, ZapOff } from 'lucide-react';
import { StudioState, StudioSettings, STUDIO_STYLES, AspectRatio, PresentationType } from '../types';

interface AIControlsProps {
  state: StudioState;
  setState: React.Dispatch<React.SetStateAction<StudioState>>;
  t: any;
}

const AIControls: React.FC<AIControlsProps> = ({ state, setState, t }) => {
  const updateSetting = (key: keyof StudioSettings, value: any) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, [key]: value }
    }));
  };

  const atmosphereOptions: { id: StudioSettings['lightingType']; label: string }[] = [
    { id: 'golden-hour', label: t.studio.lighting.golden },
    { id: 'studio-soft', label: t.studio.lighting.soft },
    { id: 'dramatic-noir', label: t.studio.lighting.noir },
    { id: 'window-light', label: t.studio.lighting.window },
  ];

  const formatOptions: { id: AspectRatio; label: string; icon: any }[] = [
    { id: '1:1', label: '1:1', icon: Square },
    { id: '3:4', label: '3:4', icon: Smartphone },
    { id: '4:3', label: '4:3', icon: RectangleHorizontal },
    { id: '9:16', label: '9:16', icon: Smartphone },
    { id: '16:9', label: '16:9', icon: RectangleHorizontal },
    { id: '3:2', label: '3:2', icon: RectangleHorizontal },
    { id: '2:3', label: '2:3', icon: Smartphone },
    { id: '1:4', label: '1:4', icon: Smartphone },
    { id: '4:1', label: '4:1', icon: RectangleHorizontal },
  ];

  const presentationOptions: { id: PresentationType; label: string; icon: any }[] = [
    { id: 'model', label: 'Model', icon: User },
    { id: 'mannequin', label: 'Mannequin', icon: UserCircle },
    { id: 'hanger_standing', label: 'Wieszak Stojący', icon: Shirt },
    { id: 'hanger_hanging', label: 'Wieszak Wiszący', icon: Anchor },
    { id: 'table', label: 'Stół / Blat', icon: Table },
    { id: 'flat', label: 'Płasko / Flatlay', icon: Layout },
  ];

  const qualityMap: Record<string, number> = { 'standard': 0, 'hd': 1, '4k': 2 };
  const qualityList: StudioSettings['quality'][] = ['standard', 'hd', '4k'];
  const qualityLabels = [t.studio.quality_web, t.studio.quality_social, t.studio.quality_ultra];

  return (
    <aside className="w-full xl:w-[340px] h-full bg-[#050505] border-l border-zinc-900 flex flex-col overflow-hidden shadow-2xl">
      <div className="flex-1 overflow-y-auto p-5 space-y-10">
        
        {/* ENGINE SELECTOR (GOD MODE) */}
        <div className="space-y-4">
           <label className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-blue-500" />
            SILNIK AI (QUOTA BYPASS)
          </label>
          <div className="flex gap-2">
             <button 
              onClick={() => updateSetting('modelPreference', 'pro')}
              className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${state.settings.modelPreference === 'pro' ? 'bg-blue-600/10 border-blue-500 shadow-xl' : 'bg-zinc-900 border-zinc-800 opacity-50'}`}
             >
                <Zap className={`w-5 h-5 ${state.settings.modelPreference === 'pro' ? 'text-blue-500' : 'text-zinc-600'}`} />
                <span className="text-[9px] font-black uppercase">PRO (Quality)</span>
             </button>
             <button 
              onClick={() => updateSetting('modelPreference', 'flash')}
              className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${state.settings.modelPreference === 'flash' ? 'bg-amber-600/10 border-amber-500 shadow-xl' : 'bg-zinc-900 border-zinc-800 opacity-50'}`}
             >
                <ZapOff className={`w-5 h-5 ${state.settings.modelPreference === 'flash' ? 'text-amber-500' : 'text-zinc-600'}`} />
                <span className="text-[9px] font-black uppercase">FLASH (Unlimited)</span>
             </button>
          </div>
          <p className="text-[8px] text-zinc-600 font-bold uppercase text-center px-4">
            Flash zalecany do intensywnych testów serii bez limitów (Quota Bypass).
          </p>
        </div>

        {/* SCENOGRAPHY SELECTOR */}
        <div className="space-y-4">
          <label className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
            <Boxes className="w-3.5 h-3.5 text-blue-500" />
            {t.studio.scenography}
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {STUDIO_STYLES.map((style) => (
              <button 
                key={style.id} 
                onClick={() => updateSetting('backgroundStyle', style.id)} 
                className={`p-4 rounded-xl border transition-all text-left relative overflow-hidden group ${
                  state.settings.backgroundStyle === style.id 
                  ? 'bg-blue-600/5 border-blue-500 shadow-xl' 
                  : 'bg-zinc-900/40 border-zinc-900 hover:border-zinc-800'
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                   <span className={`text-[11px] font-black uppercase italic tracking-tighter ${state.settings.backgroundStyle === style.id ? 'text-blue-500' : 'text-zinc-200'}`}>
                    {style.label}
                  </span>
                  {state.settings.backgroundStyle === style.id && (
                    <div className="p-1 bg-blue-600 rounded-full">
                      <Check size={8} className="text-white" />
                    </div>
                  )}
                </div>
                <p className="text-[9px] font-medium text-zinc-500 leading-tight">
                  {style.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* PRESENTATION MODE */}
        <div className="space-y-4">
          <label className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
            <Layout className="w-3.5 h-3.5 text-blue-500" />
            {t.studio.presentation}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {presentationOptions.map((opt) => (
              <button 
                key={opt.id} 
                onClick={() => updateSetting('presentationType', opt.id)} 
                className={`flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl border transition-all ${
                  state.settings.presentationType === opt.id 
                  ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                <opt.icon size={16} className={state.settings.presentationType === opt.id ? "text-blue-500" : "text-zinc-600"} />
                <span className="text-[8px] font-black uppercase tracking-tighter text-center leading-tight">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ANGLE SELECTOR */}
        <div className="space-y-4">
          <label className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5 text-blue-500" />
            KĄT WIDZENIA
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'table-level', label: 'Poziom', icon: MousePointer2 },
              { id: 'flatlay', label: 'Flatlay', icon: Layout },
              { id: 'macro-focus', label: 'Makro', icon: Maximize },
            ].map((opt) => (
              <button 
                key={opt.id} 
                onClick={() => updateSetting('angle', opt.id)} 
                className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border transition-all ${
                  state.settings.angle === opt.id 
                  ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                <opt.icon size={14} className={state.settings.angle === opt.id ? "text-blue-500" : "text-zinc-600"} />
                <span className="text-[8px] font-black uppercase">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FORMAT SECTION */}
        <div className="space-y-5">
          <label className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
            <Maximize className="w-3.5 h-3.5 text-blue-500" />
            {t.studio.format}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {formatOptions.map((opt) => (
              <button 
                key={opt.id} 
                onClick={() => updateSetting('aspectRatio', opt.id)} 
                className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border transition-all ${
                  state.settings.aspectRatio === opt.id 
                  ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                <opt.icon size={14} className={state.settings.aspectRatio === opt.id ? "text-blue-500" : "text-zinc-600"} />
                <span className="text-[9px] font-black">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* REFINEMENT TEXT */}
        <div className="space-y-4">
          <label className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Edit3 className="w-3.5 h-3.5" />
            REFINEMENT DETAILS
          </label>
          <textarea
            value={state.settings.refinementText}
            onChange={(e) => updateSetting('refinementText', e.target.value)}
            placeholder="Co poprawić? (np. usuń zagniecenia...)"
            className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[11px] text-zinc-300 focus:outline-none focus:border-blue-500 transition-all resize-none shadow-inner"
          />
        </div>

        {/* OUTPUT PARAMETERS SECTION */}
        <div className="space-y-6">
          <label className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-blue-500" />
            {t.studio.outputParams}
          </label>
          
          <div className="space-y-4 px-1">
            <div className="flex justify-between items-center mb-1">
               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.studio.quality}</span>
               <div className="flex items-center gap-2">
                 <Zap size={10} className="text-amber-500" />
                 <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest italic">{state.settings.quality.toUpperCase()}</span>
               </div>
            </div>
            
            <input 
              type="range" min="0" max="2" step="1"
              value={qualityMap[state.settings.quality]}
              onChange={(e) => updateSetting('quality', qualityList[parseInt(e.target.value)])}
              className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            
            <div className="text-center py-2 bg-zinc-900/40 rounded-lg border border-zinc-800/50">
              <span className="text-[11px] font-black text-white uppercase italic tracking-tight">
                {qualityLabels[qualityMap[state.settings.quality]]}
              </span>
            </div>
          </div>
        </div>

        {/* ATMOSPHERE SECTION */}
        <div className="space-y-5">
          <label className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            {t.studio.atmosphere}
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {atmosphereOptions.map((opt) => (
              <button 
                key={opt.id} 
                onClick={() => updateSetting('lightingType', opt.id)} 
                className={`py-3.5 px-2 rounded-lg border text-[10px] font-black tracking-widest transition-all ${
                  state.settings.lightingType === opt.id 
                  ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      <div className="p-5 bg-[#050505] border-t border-zinc-900">
        <button className="w-full py-4 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 flex items-center justify-center gap-3 transition-all active:scale-95 group shadow-lg">
           <Save size={16} className="text-zinc-500 group-hover:text-blue-500" />
           <span className="text-[11px] font-black uppercase tracking-widest">{t.studio.savePreset}</span>
        </button>
      </div>
    </aside>
  );
};

export default AIControls;
