"use client";
import React, { useState } from "react";
import { Camera, Upload, Zap, Circle, ArrowLeft, Loader2, Sparkles, Maximize, Settings, Files } from "lucide-react";

interface CameraInterfaceProps {
  onImageSelected?: (base64: string | string[]) => void;
  t: any;
}

const CameraInterface: React.FC<CameraInterfaceProps> = ({ onImageSelected, t }) => {
  const [isFlash, setIsFlash] = useState(false);
  const [view, setView] = useState<"lens" | "upload" | "processing">("lens");
  const [selectedCount, setSelectedCount] = useState<number>(0);

  const triggerShutter = () => {
    setIsFlash(true);
    setTimeout(() => {
      setIsFlash(false);
      setView("upload");
    }, 300);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setSelectedCount(files.length);
    setView("processing");

    const readFile = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.readAsDataURL(file);
      });
    };

    // Fix: Explicitly cast Array.from(files) to File[] to avoid 'unknown' type error during mapping (line 39 error fix)
    const base64Array = await Promise.all((Array.from(files) as File[]).map(file => readFile(file)));
    
    setTimeout(() => {
      if (onImageSelected) {
        onImageSelected(base64Array);
      }
    }, 1500);
  };

  return (
    <div className="relative w-full h-full bg-zinc-950 flex items-center justify-center overflow-hidden font-mono select-none transition-all">
      {isFlash && (
        <div className="absolute inset-0 bg-white z-[100] animate-in fade-in out-fade-out duration-300" />
      )}

      <div className="relative w-full h-full bg-zinc-900/20 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-8 text-[10px] text-blue-400/60 uppercase tracking-widest z-20">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-red-500 animate-pulse font-black drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
              <Circle size={8} fill="currentColor" /> REC
            </div>
            <div className="flex items-center gap-6 border-l border-zinc-800/50 pl-8">
              <span className="text-zinc-500">4K / 60FPS</span>
              <span className="text-blue-500 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">AI-VISION: ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          <div className="z-10 w-full max-w-2xl px-8">
            {view === "lens" && (
              <div className="text-center space-y-12 scale-110">
                <div className="space-y-3">
                  <h1 className="text-6xl font-black text-white tracking-tighter italic drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    {t.appName.split(' ')[0]} <span className="text-blue-500">{t.appName.split(' ').slice(1).join(' ')}</span>
                  </h1>
                  <p className="text-blue-400/40 text-[11px] uppercase tracking-[0.5em] font-black">Professional Neural Vision</p>
                </div>
                
                <button 
                  onClick={triggerShutter}
                  className="group relative w-44 h-44 rounded-full bg-zinc-950/50 border-8 border-zinc-800/50 p-3 transition-all hover:scale-110 active:scale-90 shadow-[0_0_80px_rgba(59,130,246,0.15)]"
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-900 flex items-center justify-center shadow-inner relative overflow-hidden">
                    <Camera className="text-white w-16 h-16 group-hover:rotate-12 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              </div>
            )}

            {view === "upload" && (
              <div className="bg-zinc-950/80 backdrop-blur-2xl p-12 rounded-[3.5rem] border border-blue-500/20 text-center shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-tight italic">{t.camera.upload}</h2>
                <input type="file" id="studio-upload" className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
                <label htmlFor="studio-upload" className="block w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-3xl cursor-pointer transition-all uppercase text-sm tracking-widest mb-6">
                  {t.camera.library}
                </label>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-6 font-bold">You can select multiple images at once</p>
                <button onClick={() => setView("lens")} className="flex items-center gap-3 justify-center mx-auto text-zinc-500 hover:text-white text-xs font-bold uppercase">
                  <ArrowLeft size={14} /> {t.camera.back}
                </button>
              </div>
            )}

            {view === "processing" && (
              <div className="text-center space-y-10">
                <div className="relative inline-block">
                  <div className="w-40 h-40 border-[6px] border-blue-500/5 border-t-blue-500 rounded-full animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto text-blue-500 w-14 h-14 animate-pulse" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-white uppercase tracking-[0.2em] italic">
                    {selectedCount > 1 ? `Ingesting ${selectedCount} Assets` : t.camera.analyzingDna}
                  </h3>
                  <p className="text-[10px] text-blue-400 animate-pulse font-black uppercase tracking-[0.3em]">
                    {selectedCount > 1 ? "Mapping structure for batch processing..." : t.camera.mapping}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraInterface;