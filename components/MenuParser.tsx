
import React, { useState, useRef } from 'react';
import { FileText, Sparkles, Loader2, ChefHat, Tag, Wand2, RefreshCw, X, Download, AlertCircle, Palette, Image as ImageIcon, CheckCircle, Camera, Upload } from 'lucide-react';
import { parseMenuText, generateDishImageFromMenu, extractMenuFromImage } from '../services/geminiService';
import { MenuDish, StudioState, UserAccount } from '../types';

interface MenuDishState extends MenuDish {
  image: string | null;
  isGenerating: boolean;
  refinement: string;
  error: string | null;
  forceFlash?: boolean;
}

interface MenuParserProps {
  t: any;
  state: StudioState;
  setState: React.Dispatch<React.SetStateAction<StudioState>>;
  user: UserAccount;
  setUser: React.Dispatch<React.SetStateAction<UserAccount>>;
  onUseCredit: () => Promise<boolean>;
}

const MenuParser: React.FC<MenuParserProps> = ({ t, state, setState, user, setUser, onUseCredit }) => {
  const [text, setText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [results, setResults] = useState<MenuDishState[]>([]);
  
  const resultsRef = useRef<MenuDishState[]>([]);
  resultsRef.current = results;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const extractedText = await extractMenuFromImage(base64);
        setText(prev => prev ? prev + "\n\n" + extractedText : extractedText);
      } catch (err) {
        console.error("Menu Extraction Error:", err);
        alert("Nie udało się odczytać tekstu z obrazu.");
      } finally {
        setIsExtracting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleParse = async () => {
    if (!text) return;
    setIsParsing(true);
    try {
      const data = await parseMenuText(text);
      setResults(data.map(d => ({ ...d, image: null, isGenerating: false, refinement: '', error: null })));
    } catch (err) {
      console.error(err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleGenerateDish = async (index: number, forceFlash: boolean = false) => {
    const hasCredit = await onUseCredit();
    if (!hasCredit) return;

    setResults(prev => prev.map((d, i) => i === index ? { 
      ...d, 
      isGenerating: true, 
      error: null,
      forceFlash 
    } : d));
    
    try {
      const dishToGenerate = resultsRef.current[index];
      const isRefresh = !!dishToGenerate.image;
      const imageUrl = await generateDishImageFromMenu(
        dishToGenerate, 
        state.settings, 
        dishToGenerate.refinement, 
        forceFlash,
        isRefresh
      );
      
      setResults(prev => prev.map((d, i) => i === index ? { ...d, image: imageUrl, isGenerating: false } : d));
    } catch (err: any) {
      console.error("Dish Image Gen Error:", err);
      const errMsg = err.message || 'Generation failed';
      setResults(prev => prev.map((d, i) => i === index ? { ...d, isGenerating: false, error: errMsg } : d));
    }
  };

  const handleGenerateAll = async () => {
    if (results.length === 0 || isAnyGenerating) return;
    for (let i = 0; i < results.length; i++) {
      await handleGenerateDish(i);
      await new Promise(res => setTimeout(res, 800)); // Buffer to avoid rapid rate limits
    }
  };

  const updateRefinement = (index: number, val: string) => {
    setResults(prev => prev.map((d, i) => i === index ? { ...d, refinement: val } : d));
  };

  const downloadImage = (base64: string, name: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = `${name.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isAnyGenerating = results.some(r => r.isGenerating);

  const formatError = (error: string | null) => {
    if (!error) return null;
    
    // Handle JSON errors
    if (error.includes('{"')) {
      try {
        const jsonMatch = error.match(/\{.*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const msg = parsed.MESSAGE || 
                      (typeof parsed.ERROR === 'string' ? parsed.ERROR : parsed.ERROR?.MESSAGE) || 
                      parsed.error?.message || 
                      error;
          
          if (typeof msg === 'string') {
            const cleanMsg = msg.replace(/<[^>]*>?/gm, '').trim();
            if (cleanMsg.includes("502 Bad Gateway") || cleanMsg.includes("temporary error") || cleanMsg.includes("502")) {
              return "Serwer Google jest przeciążony (502). Spróbuj użyć TRYBU TURBO (przycisk poniżej).";
            }
            if (cleanMsg.toLowerCase().includes("forbidden") || cleanMsg.toLowerCase().includes("permission")) {
              return "Błąd uprawnień (403). Upewnij się, że Twój klucz API jest płatny i ma dostęp do modeli obrazów. Spróbuj TRYBU TURBO.";
            }
            return cleanMsg || "Wystąpił nieoczekiwany błąd serwera.";
          }
        }
      } catch (e) {
        // Fall through
      }
    }

    if (error.includes("502 Bad Gateway") || error.includes("temporary error") || error.includes("502")) {
      return "Serwer Google jest przeciążony (502). Spróbuj użyć TRYBU TURBO (przycisk poniżej).";
    }

    if (error.toLowerCase().includes("forbidden") || error.toLowerCase().includes("permission")) {
      return "Błąd uprawnień (403). Upewnij się, że Twój klucz API jest płatny i ma dostęp do modeli obrazów. Spróbuj TRYBU TURBO.";
    }
    
    if (error.includes("API_KEY_ERROR")) return error.split("API_KEY_ERROR:")[1] || error;
    
    return error.length > 200 ? error.substring(0, 200) + "..." : error;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-[#050505]">
      <div className="max-w-5xl mx-auto flex flex-col gap-8 md:gap-12">
        
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-blue-600/10 rounded-xl border border-blue-500/20 shrink-0">
                <FileText className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter">{t.menu.inputTitle}</h2>
              <p className="text-zinc-500 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">{t.menu.inputDesc}</p>
            </div>
          </div>

          <div className="relative group bg-zinc-900/20 border border-zinc-900 rounded-[1.5rem] md:rounded-[2rem] p-3 md:p-4">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{t.menu.inputLabel}</span>
              <label className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-800 transition-all">
                {isExtracting ? <Loader2 size={12} className="animate-spin text-blue-500" /> : <Camera size={12} className="text-blue-500" />}
                <span className="text-[9px] font-bold text-zinc-400 uppercase">{t.menu.scan}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isExtracting} />
              </label>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.menu.placeholder}
              className="w-full h-32 md:h-48 bg-transparent border-none rounded-xl p-2 md:p-4 text-zinc-300 focus:outline-none resize-none placeholder:text-zinc-700 font-medium text-sm"
            />
            <div className="flex justify-end pt-2">
               <button
                onClick={handleParse}
                disabled={!text || isParsing || isAnyGenerating || isExtracting}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-500/20"
              >
                {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {t.menu.analyze}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          {results.length > 0 && (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 md:mb-8">
               <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                  <h3 className="text-lg md:text-xl font-black text-white uppercase italic tracking-tighter">{t.menu.parsedDishes} ({results.length})</h3>
               </div>
               <button
                  onClick={handleGenerateAll}
                  disabled={isParsing || isAnyGenerating}
                  className="w-full md:w-auto bg-zinc-100 hover:bg-white text-zinc-950 px-6 md:px-10 py-3 md:py-3.5 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                >
                  <Wand2 className="w-4 h-4" />
                  {t.menu.pstryknijWszystko}
                </button>
            </div>
          )}

          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 pb-20">
              {results.map((dish, idx) => (
                <div key={idx} className="flex flex-col group animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="relative aspect-square rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-zinc-900/50 border border-zinc-900 mb-4 md:mb-6 shadow-2xl transition-all group-hover:border-zinc-700">
                    {dish.image ? (
                      <>
                        <img src={dish.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt={dish.name} />
                        <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-500 z-10">
                          <button onClick={() => downloadImage(dish.image!, dish.name)} className="p-4 bg-black/80 backdrop-blur-xl rounded-2xl text-white hover:bg-blue-600 transition-all shadow-2xl">
                             <Download size={18} />
                          </button>
                        </div>
                      </>
                    ) : null}
                    
                    {!dish.image && !dish.isGenerating && (
                      <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
                        <div className="w-20 h-20 rounded-[2rem] bg-zinc-950 flex items-center justify-center border border-zinc-800/50 group-hover:scale-110 transition-transform duration-500">
                           <ChefHat className="w-8 h-8 text-zinc-800" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-[11px] font-black text-zinc-700 uppercase tracking-widest">{dish.name}</p>
                        </div>
                      </div>
                    )}

                    {dish.isGenerating && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/60 backdrop-blur-md">
                         <div className="relative mb-8">
                           <div className="w-24 h-24 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                           <Sparkles className="absolute inset-0 m-auto text-blue-500 w-10 h-10 animate-pulse" />
                         </div>
                         <p className="text-[12px] font-black text-blue-400 uppercase tracking-[0.4em] animate-pulse italic text-center px-4">Wywoływanie ujęcia...</p>
                      </div>
                    )}

                    {dish.error && (
                      <div className="absolute inset-0 z-30 bg-red-950/80 backdrop-blur-md flex items-center justify-center p-10 text-center">
                         <div className="space-y-4">
                           <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                           <p className="text-[11px] font-black text-red-400 uppercase italic tracking-widest leading-relaxed">{formatError(dish.error)}</p>
                           {dish.error?.includes("API_KEY_ERROR") ? (
                             <button 
                               onClick={async () => {
                                 if (window.aistudio) {
                                   await window.aistudio.openSelectKey();
                                   window.location.reload();
                                 }
                               }}
                               className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-xl"
                             >
                               Zaktualizuj Klucz API
                             </button>
                           ) : (
                             <button 
                               onClick={() => handleGenerateDish(idx, dish.error?.toLowerCase().includes("429") || dish.error?.toLowerCase().includes("limit") || dish.error?.toLowerCase().includes("403") || dish.error?.toLowerCase().includes("permission") || dish.error?.toLowerCase().includes("502") || dish.error?.toLowerCase().includes("gateway") || dish.error?.toLowerCase().includes("forbidden"))} 
                               className="bg-white text-black px-6 py-2 rounded-xl text-[10px] font-black uppercase"
                             >
                               {dish.error?.toLowerCase().includes("429") || dish.error?.toLowerCase().includes("502") || dish.error?.toLowerCase().includes("forbidden") ? "PSTRYKNIJ (TURBO)" : "TRY AGAIN"}
                             </button>
                           )}
                         </div>
                      </div>
                    )}
                  </div>

                  <div className="px-4 space-y-6">
                    <div className="flex justify-between items-start border-b border-zinc-900 pb-3 md:pb-4">
                       <div className="flex-1">
                          <h4 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-1 md:mb-2 group-hover:text-blue-500 transition-colors">{dish.name}</h4>
                          <div className="flex items-center gap-3">
                            <span className="text-xs md:text-sm font-black text-amber-500 uppercase tracking-widest">{dish.price}</span>
                            <div className="h-3 w-px bg-zinc-800" />
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest truncate">{dish.suggestedScenography}</span>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                      <textarea 
                        value={dish.refinement}
                        onChange={(e) => updateRefinement(idx, e.target.value)}
                        placeholder="Szczegóły korekty..."
                        className="w-full h-16 md:h-20 bg-zinc-950 border border-zinc-900 rounded-[1.2rem] md:rounded-[1.5rem] p-3 md:p-4 text-[10px] md:text-[11px] text-zinc-400 focus:outline-none focus:border-blue-500/50 resize-none transition-all placeholder:text-zinc-800 font-medium shadow-inner"
                      />
                      <button 
                        onClick={() => handleGenerateDish(idx)}
                        disabled={dish.isGenerating}
                        className={`w-full py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest border transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 md:gap-3 ${
                          dish.image 
                          ? 'bg-zinc-100 hover:bg-white text-zinc-950 border-zinc-200' 
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 shadow-xl shadow-blue-500/5'
                        }`}
                      >
                        {dish.isGenerating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} className={dish.image ? "animate-spin-slow" : ""} />}
                        {dish.image ? t.menu.refresh : t.menu.pstryknijDanie}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-8">
               <div className="w-32 h-32 bg-zinc-950 rounded-[3.5rem] border-2 border-dashed border-zinc-900 flex items-center justify-center relative z-10 group hover:border-blue-500/30 transition-all duration-700">
                  <ChefHat className="w-12 h-12 text-zinc-800 group-hover:text-zinc-600 transition-colors" />
               </div>
               <p className="text-sm font-black uppercase tracking-widest text-zinc-500 italic">{t.menu.noDishes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuParser;
