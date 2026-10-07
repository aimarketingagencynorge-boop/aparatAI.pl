
import React, { useState, useEffect } from 'react';
import { Wand2, Loader2, Sparkles, Image as ImageIcon, X, Download, Plus, AlertCircle, Camera, Trash2, Cpu, HelpCircle, Video, RefreshCw, Split } from 'lucide-react';
import { StudioState, UserAccount, StudioItem } from '../types';
import { generateStudioBackground, generateStudioVideo, analyzeErrorWithAI } from '../services/geminiService';

interface StudioCanvasProps {
  state: StudioState;
  setState: React.Dispatch<React.SetStateAction<StudioState>>;
  user: UserAccount;
  setUser: React.Dispatch<React.SetStateAction<UserAccount>>;
  onUseCredit: () => Promise<boolean>;
  t: any;
}

const StudioCanvas: React.FC<StudioCanvasProps> = ({ state, setState, user, setUser, onUseCredit, t }) => {
  const selectedItem = state.items.find(i => i.id === state.selectedItemId) || state.items[0];
  const [isDebugLoading, setIsDebugLoading] = useState(false);
  const [videoLoadingStep, setVideoLoadingStep] = useState(0);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  useEffect(() => {
    let interval: any;
    if (selectedItem?.isGeneratingVideo) {
      interval = setInterval(() => {
        setVideoLoadingStep(prev => (prev + 1) % 3);
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [selectedItem?.isGeneratingVideo]);

  const downloadImage = (base64: string, name: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = `${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessItem = async (itemId: string, forceFlash: boolean = false) => {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return;

    // Set generating state immediately for better UX
    setState(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === itemId ? { 
        ...i, 
        isGenerating: true, 
        error: null,
        debugInfo: undefined,
        forceFlash
      } : i)
    }));

    try {
      const hasCredit = await onUseCredit();
      if (!hasCredit) {
        setState(prev => ({
          ...prev,
          items: prev.items.map(i => i.id === itemId ? { ...i, isGenerating: false } : i)
        }));
        return;
      }

      const result = await generateStudioBackground(item, state.settings, forceFlash);
      setState(prev => ({
        ...prev,
        items: prev.items.map(i => i.id === itemId ? { 
          ...i, 
          transformedImage: result, 
          isGenerating: false 
        } : i)
      }));
    } catch (err: any) {
      console.error("Studio Generation Error:", err);
      setState(prev => ({
        ...prev,
        items: prev.items.map(i => i.id === itemId ? { 
          ...i, 
          isGenerating: false, 
          error: err.message || 'Generation failed' 
        } : i)
      }));
    }
  };

  const handleBatchProcess = async () => {
    if (isBatchProcessing) return;
    setIsBatchProcessing(true);
    const unprocessed = state.items.filter(i => !i.transformedImage && !i.isGenerating);
    
    for (const item of unprocessed) {
      await handleProcessItem(item.id);
      await new Promise(r => setTimeout(r, 1000));
    }
    setIsBatchProcessing(false);
  };

  const handleGenerateVideo = async (itemId: string) => {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return;

    const hasCredit = await onUseCredit();
    if (!hasCredit) return;

    setState(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === itemId ? { ...i, isGeneratingVideo: true, error: null } : i)
    }));

    try {
      const videoUrl = await generateStudioVideo(item, state.settings);
      setState(prev => ({
        ...prev,
        items: prev.items.map(i => i.id === itemId ? { ...i, videoUrl, isGeneratingVideo: false } : i)
      }));
    } catch (err: any) {
      console.error("Video Gen Error:", err);
      setState(prev => ({
        ...prev,
        items: prev.items.map(i => i.id === itemId ? { ...i, isGeneratingVideo: false, error: err.message || 'Video generation failed' } : i)
      }));
    }
  };

  const handleAnalyzeError = async (itemId: string) => {
    const item = state.items.find(i => i.id === itemId);
    if (!item || !item.error) return;

    setIsDebugLoading(true);
    try {
      const context = `Model preference: ${state.settings.modelPreference}, quality ${state.settings.quality}`;
      const debugResult = await analyzeErrorWithAI(item.error, context);
      setState(prev => ({
        ...prev,
        items: prev.items.map(i => i.id === itemId ? { ...i, debugInfo: debugResult } : i)
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsDebugLoading(false);
    }
  };

  const removeItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setState(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== id),
      selectedItemId: prev.selectedItemId === id ? (prev.items[1]?.id || null) : prev.selectedItemId
    }));
  };

  const clearAll = () => {
    if (window.confirm("Czy na pewno wyczyścić cały obszar roboczy?")) {
      setState(prev => ({ ...prev, items: [], selectedItemId: null }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newItem: StudioItem = {
          id: Math.random().toString(36).substr(2, 9),
          originalImage: event.target?.result as string,
          transformedImage: null,
          isAnalyzing: false,
          isGenerating: false,
          isGeneratingVideo: false,
          analysis: null,
          feedback: '',
          error: null
        };
        setState(prev => ({ ...prev, items: [newItem, ...prev.items], selectedItemId: newItem.id }));
      };
      reader.readAsDataURL(file as Blob);
    });
  };

  const videoStepMsgs = [t.video.step1, t.video.step2, t.video.step3];

  const formatError = (error: string | null) => {
    if (!error) return null;
    
    // Handle JSON errors
    if (error.includes('{"')) {
      try {
        // Try to find the JSON part if it's wrapped in something else
        const jsonMatch = error.match(/\{.*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const msg = parsed.MESSAGE || (parsed.ERROR && parsed.ERROR.MESSAGE) || parsed.error?.message || error;
          
          if (typeof msg === 'string') {
            // Strip HTML if present
            const cleanMsg = msg.replace(/<[^>]*>?/gm, '').trim();
            if (cleanMsg.includes("502 Bad Gateway") || cleanMsg.includes("temporary error") || cleanMsg.includes("502")) {
              return "Serwer Google jest przeciążony (502). Spróbuj użyć TRYBU TURBO (przycisk poniżej).";
            }
            return cleanMsg || "Wystąpił nieoczekiwany błąd serwera.";
          }
        }
      } catch (e) {
        // Fall through to string checks
      }
    }

    // Handle raw HTML or string errors
    if (error.includes("502 Bad Gateway") || error.includes("temporary error") || error.includes("502")) {
      return "Serwer Google jest przeciążony (502). Spróbuj użyć TRYBU TURBO (przycisk poniżej).";
    }
    
    if (error.includes("API_KEY_ERROR")) return error.split("API_KEY_ERROR:")[1] || error;
    
    return error.length > 200 ? error.substring(0, 200) + "..." : error;
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#050505]">
      {/* Sidebar: Projects List */}
      <aside className="hidden md:flex w-72 border-r border-zinc-900 flex-col h-full bg-zinc-950/50 shrink-0">
        <div className="p-4 border-b border-zinc-900 bg-zinc-950 sticky top-0 z-10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.studio.workspace}</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-blue-500">{state.items.length} {t.studio.projects}</span>
              {state.items.length > 0 && (
                <button onClick={clearAll} className="p-1 hover:text-red-500 transition-colors" title="Wyczyść wszystko">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <label className="flex-1 flex items-center justify-center gap-2 py-2 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors">
              <Plus className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-300">{t.studio.add}</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
            <button 
              disabled={isBatchProcessing}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600/10 border border-blue-500/20 rounded-lg hover:bg-blue-600/20 transition-colors disabled:opacity-50" 
              onClick={handleBatchProcess}
            >
              {isBatchProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" /> : <Wand2 className="w-3.5 h-3.5 text-blue-500" />}
              <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-400">{t.studio.batch}</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {state.items.map((item) => (
            <div key={item.id} className="relative group">
              <button onClick={() => setState(prev => ({ ...prev, selectedItemId: item.id }))} className={`w-full relative flex items-center gap-3 p-2 rounded-xl border transition-all ${state.selectedItemId === item.id ? 'bg-blue-600/10 border-blue-500' : 'bg-zinc-900/40 border-zinc-800'}`}>
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                  <img src={item.transformedImage || item.originalImage} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[10px] font-black text-zinc-200 uppercase tracking-tighter truncate">{item.analysis?.productName || (item.isAnalyzing ? t.studio.analyzing : t.studio.rawInput)}</p>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.transformedImage ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : item.error ? 'bg-red-500' : 'bg-zinc-700'}`} />
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                      {item.videoUrl ? 'Video 4K' : item.transformedImage ? t.studio.rendered : item.error ? 'Error' : t.studio.ready}
                    </span>
                  </div>
                </div>
              </button>
              
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button 
                  onClick={(e) => { e.stopPropagation(); downloadImage(item.transformedImage || item.originalImage, item.analysis?.productName || 'product'); }}
                  className="p-2 bg-zinc-950/80 border border-zinc-800 rounded-lg text-blue-400 hover:text-white hover:bg-blue-600 transition-all shadow-xl"
                  title="Quick Download"
                >
                  <Download size={12} strokeWidth={3} />
                </button>
                <button 
                  onClick={(e) => removeItem(e, item.id)} 
                  className="p-2 bg-zinc-950/80 border border-zinc-800 rounded-lg text-zinc-600 hover:text-red-500 transition-all shadow-xl"
                  title="Remove Project"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Mobile Projects List */}
      <div className="md:hidden flex flex-col border-b border-zinc-900 bg-zinc-950 shrink-0">
        <div className="flex overflow-x-auto p-2 gap-2 no-scrollbar border-b border-zinc-900/50">
          <label className="w-12 h-12 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer shrink-0">
            <Plus className="w-4 h-4 text-blue-500" />
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
          {state.items.map((item) => (
            <button 
              key={item.id} 
              onClick={() => setState(prev => ({ ...prev, selectedItemId: item.id }))}
              className={`w-12 h-12 rounded-lg overflow-hidden border shrink-0 transition-all ${state.selectedItemId === item.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-zinc-800'}`}
            >
              <img src={item.transformedImage || item.originalImage} className="w-full h-full object-cover" alt="" />
            </button>
          ))}
        </div>
        <div className="flex p-2 gap-2 bg-zinc-900/20">
          <label className="flex-1 flex items-center justify-center gap-2 py-2 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors">
            <Plus className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[9px] font-bold uppercase tracking-tight text-zinc-300">{t.studio.add}</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
          <button 
            disabled={isBatchProcessing}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600/10 border border-blue-500/20 rounded-lg hover:bg-blue-600/20 transition-colors disabled:opacity-50" 
            onClick={handleBatchProcess}
          >
            {isBatchProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" /> : <Wand2 className="w-3.5 h-3.5 text-blue-500" />}
            <span className="text-[9px] font-bold uppercase tracking-tight text-zinc-400">{t.studio.batch}</span>
          </button>
          {state.items.length > 0 && (
            <button onClick={clearAll} className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500 hover:text-red-500 transition-colors">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <main className="flex-1 relative flex flex-col min-w-0 p-4 md:p-8 overflow-y-auto no-scrollbar">
        {selectedItem ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="sticky top-0 z-30 bg-[#050505]/90 backdrop-blur-xl -mx-4 px-4 py-4 md:static md:bg-transparent md:backdrop-blur-none md:mx-0 md:px-0 md:py-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-zinc-900 md:border-none">
              <div className="space-y-1">
                <h2 className="text-lg md:text-2xl font-black text-white italic uppercase tracking-tighter leading-none truncate max-w-[250px] md:max-w-none">{selectedItem.analysis?.productName || t.studio.rawInput}</h2>
                <div className="flex items-center gap-4">
                   <p className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={10} className="text-blue-500 md:hidden" />
                    <ImageIcon size={12} className="text-blue-500 hidden md:block" /> {state.settings.aspectRatio}
                  </p>
                  <div className="h-3 w-px bg-zinc-800" />
                  <p className="text-[9px] md:text-[10px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-2">
                    ID: {selectedItem.id.toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 md:gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                <button 
                  onClick={() => handleGenerateVideo(selectedItem.id)}
                  disabled={true} title="Animacje są jeszcze w przygotowaniu"
                  className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-blue-500 font-black text-[9px] md:text-[10px] uppercase rounded-xl transition-all shadow-xl disabled:opacity-30 whitespace-nowrap"
                >
                  {selectedItem.isGeneratingVideo ? <Loader2 size={12} className="animate-spin" /> : <Video size={12} />}
                  {t.video.generate}
                </button>
                <button 
                  onClick={() => downloadImage(selectedItem.transformedImage || selectedItem.originalImage, selectedItem.analysis?.productName || 'product')}
                  className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-black text-[9px] md:text-[10px] uppercase rounded-xl transition-all shadow-xl whitespace-nowrap"
                >
                  <Download size={12} /> {selectedItem.transformedImage ? t.studio.download : "Download"}
                </button>
                <button 
                  onClick={() => handleProcessItem(selectedItem.id)} 
                  disabled={selectedItem.isGenerating || selectedItem.isGeneratingVideo}
                  className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] md:text-[10px] uppercase rounded-xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 whitespace-nowrap"
                >
                  {selectedItem.isGenerating ? <Loader2 size={12} className="animate-spin" /> : (selectedItem.transformedImage ? <RefreshCw size={12} /> : <Sparkles size={12} />)}
                  {selectedItem.isGenerating ? t.studio.analyzing : selectedItem.transformedImage ? t.studio.regenerate : t.studio.generate}
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
              <div className="flex-1 relative rounded-[1.5rem] md:rounded-[2rem] border border-zinc-900 bg-zinc-950/50 overflow-hidden group shadow-2xl min-h-[250px] md:min-h-0">
                <div className="absolute top-3 left-3 md:top-4 md:left-4 z-10 px-2 md:px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-zinc-800">
                  <span className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase tracking-widest">RAW INPUT</span>
                </div>
                <img src={selectedItem.originalImage} className="w-full h-full object-contain" alt="Original" />
              </div>

              <div className="flex-1 relative rounded-[1.5rem] md:rounded-[2rem] border border-blue-500/20 bg-zinc-950 overflow-hidden shadow-2xl min-h-[250px] md:min-h-0">
                <div className="absolute top-3 left-3 md:top-4 md:left-4 z-10 px-2 md:px-3 py-1 bg-blue-600/20 backdrop-blur-md rounded-full border border-blue-500/30">
                  <span className="text-[8px] md:text-[9px] font-black text-blue-400 uppercase tracking-widest">
                    {selectedItem.videoUrl ? 'AI NEURAL VIDEO 1080p' : `AI MASTER ${state.settings.quality.toUpperCase()}`}
                  </span>
                </div>
                
                {selectedItem.videoUrl ? (
                   <video src={selectedItem.videoUrl} autoPlay loop muted className="w-full h-full object-contain animate-in fade-in duration-700" />
                ) : selectedItem.transformedImage ? (
                  <img src={selectedItem.transformedImage} key={selectedItem.transformedImage} className="w-full h-full object-contain animate-in fade-in zoom-in-95 duration-700" alt="Transformed" />
                ) : (selectedItem.isGenerating || selectedItem.isGeneratingVideo) ? (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/40 backdrop-blur-2xl p-12 text-center">
                      <div className="relative mb-8">
                        <div className="w-24 h-24 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                        {selectedItem.isGeneratingVideo ? <Video className="absolute inset-0 m-auto text-blue-500 w-8 h-8 animate-pulse" /> : <Sparkles className="absolute inset-0 m-auto text-blue-500 w-8 h-8 animate-pulse" />}
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-black text-white uppercase tracking-[0.4em] italic animate-pulse">
                          {selectedItem.isGeneratingVideo ? t.video.loading : 'Neural Retexturing...'}
                        </p>
                        {selectedItem.isGeneratingVideo && (
                          <div className="space-y-3">
                            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{videoStepMsgs[videoLoadingStep]}</p>
                            <p className="text-[9px] text-zinc-500 uppercase tracking-widest leading-relaxed max-w-xs mx-auto">{t.video.waitInfo}</p>
                          </div>
                        )}
                      </div>
                    </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-800/40 p-8">
                    {selectedItem.error ? (
                      <div className="flex flex-col items-center gap-6 max-w-sm text-center">
                        <AlertCircle size={48} className="text-red-500/50" />
                        <div className="space-y-2">
                           <p className="text-[10px] font-black uppercase text-red-500/50 tracking-widest leading-relaxed">{formatError(selectedItem.error)}</p>
                           {selectedItem.debugInfo && (
                             <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-xl mt-4">
                                <p className="text-[10px] text-zinc-400 font-mono text-left">{selectedItem.debugInfo}</p>
                             </div>
                           )}
                        </div>
                        <div className="flex flex-col gap-3 w-full">
                           {selectedItem.error?.includes("API_KEY_ERROR") ? (
                             <button 
                               onClick={async () => {
                                 if (window.aistudio) {
                                   await window.aistudio.openSelectKey();
                                   window.location.reload(); // Reload to apply new key
                                 }
                               }}
                               className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl"
                             >
                               Zaktualizuj Klucz API
                             </button>
                           ) : (
                             <button 
                               onClick={() => handleProcessItem(selectedItem.id, 
                                 selectedItem.error?.toLowerCase().includes("429") || 
                                 selectedItem.error?.toLowerCase().includes("limit") || 
                                 selectedItem.error?.toLowerCase().includes("403") || 
                                 selectedItem.error?.toLowerCase().includes("permission") ||
                                 selectedItem.error?.toLowerCase().includes("502") ||
                                 selectedItem.error?.toLowerCase().includes("gateway")
                               )} 
                               className="w-full py-3 bg-zinc-100 text-zinc-950 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl"
                             >
                                {selectedItem.error?.toLowerCase().includes("429") || selectedItem.error?.toLowerCase().includes("502") ? "PSTRYKNIJ (TRYB TURBO)" : "PSTRYKNIJ PONOWNIE!"}
                             </button>
                           )}
                           <button 
                            disabled={isDebugLoading || !!selectedItem.error?.includes("API_KEY_ERROR")}
                            onClick={() => handleAnalyzeError(selectedItem.id)} 
                            className="flex items-center justify-center gap-2 w-full py-3 bg-zinc-900 text-zinc-500 rounded-xl font-black text-[9px] uppercase tracking-widest border border-zinc-800 hover:text-white transition-all disabled:opacity-30"
                           >
                              {isDebugLoading ? <Loader2 size={12} className="animate-spin" /> : <HelpCircle size={12} />}
                              AI Debugger
                           </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8">
                        <div className="w-16 h-16 rounded-full bg-blue-500/5 flex items-center justify-center mb-6 border border-blue-500/10">
                          <Split size={32} className="opacity-20 text-blue-500" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-8">Awaiting Generation</p>
                        <button 
                          onClick={() => handleProcessItem(selectedItem.id)}
                          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                        >
                          {t.studio.generate}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 md:mt-6 flex flex-col md:flex-row items-stretch md:items-start gap-4 md:gap-6">
               <div className="flex-1 p-4 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] bg-zinc-900/20 border border-zinc-900 flex items-center gap-4 md:gap-5 transition-colors hover:border-zinc-800">
                 <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                 </div>
                 <div className="min-w-0">
                    <p className="text-[8px] md:text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-0.5 md:mb-1">SYNTHESIS ANALYSIS</p>
                    <p className="text-[9px] md:text-[10px] text-zinc-400 font-medium italic truncate">{selectedItem.analysis?.aiPromptSuggestion || "Awaiting neural analysis..."}</p>
                 </div>
               </div>
               
               <div className="w-full md:w-72 p-4 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] bg-zinc-900/20 border border-zinc-900 flex flex-col justify-center gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] md:text-[9px] font-black text-zinc-600 uppercase tracking-widest">Neural Alignment</span>
                    <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                       <span className="text-[8px] md:text-[9px] font-bold text-green-500 uppercase italic">AI ENGINE READY</span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-800/50 h-1 rounded-full overflow-hidden">
                    <div className="bg-blue-600 w-3/4 h-full shadow-[0_0_10px_rgba(37,99,235,0.4)] transition-all duration-500" />
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
             <div className="w-32 h-32 bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-[3rem] flex items-center justify-center opacity-40 mb-8">
               <Camera className="w-12 h-12 text-zinc-500" />
             </div>
             <h3 className="text-xl font-black text-zinc-400 uppercase italic tracking-widest">Select project to start</h3>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudioCanvas;
