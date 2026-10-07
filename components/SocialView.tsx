
import React, { useState } from 'react';
import { Share2, Instagram, Facebook, Send, Loader2, Download, Rocket, Palette, Zap } from 'lucide-react';
import { StudioState, SocialCopyResults, SOCIAL_STYLES, SocialPost } from '../types';
import { generateSocialCopy, generateSocialAsset } from '../services/geminiService';

interface SocialViewProps {
  studioState: StudioState;
  t: any;
}

const SocialView: React.FC<SocialViewProps> = ({ studioState, t }) => {
  const [isGeneratingAsset, setIsGeneratingAsset] = useState(false);
  const [copyResults, setCopyResults] = useState<SocialCopyResults | null>(null);
  const [stylizedAsset, setStylizedAsset] = useState<string | null>(null);
  const [selectedStyleId, setSelectedStyleId] = useState<string>(SOCIAL_STYLES[0].id);

  const activeItem = studioState.items.find(i => i.id === studioState.selectedItemId) || studioState.items[0];

  const handleGenerateCampaign = async () => {
    if (!activeItem || !activeItem.analysis) return;
    setIsGeneratingAsset(true);
    const selectedStyle = SOCIAL_STYLES.find(s => s.id === selectedStyleId) || SOCIAL_STYLES[0];
    try {
      const asset = await generateSocialAsset(activeItem, selectedStyle, "", studioState.settings.aspectRatio);
      setStylizedAsset(asset);
      const results = await generateSocialCopy(activeItem.analysis.productName, "", selectedStyle.label);
      setCopyResults(results);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsGeneratingAsset(false);
    }
  };

  if (!activeItem) return <div className="flex-1 bg-zinc-950" />;

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-zinc-950 overflow-hidden h-full">
      <aside className="w-full lg:w-80 border-r border-zinc-900 flex flex-col overflow-y-auto p-6 space-y-8 shrink-0">
        <h2 className="text-sm font-black text-zinc-100 uppercase tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-blue-500" /> {t.social.stylizer}</h2>
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{t.social.campaignStyle}</label>
          <div className="grid grid-cols-1 gap-2">
            {SOCIAL_STYLES.map((style) => (
              <button key={style.id} onClick={() => setSelectedStyleId(style.id)} className={`p-3 rounded-2xl border transition-all text-left flex items-center gap-3 ${selectedStyleId === style.id ? 'bg-blue-600/10 border-blue-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${style.gradient} shrink-0`} />
                <span className="text-[11px] font-black uppercase">{style.label}</span>
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleGenerateCampaign} disabled={isGeneratingAsset} className="w-full bg-blue-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95">
          {isGeneratingAsset ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
          {t.social.buildAssets}
        </button>
      </aside>
      <main className="flex-1 flex flex-col overflow-y-auto p-6 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
             <div className="relative rounded-[2.5rem] overflow-hidden border border-zinc-800 bg-zinc-900 aspect-square">
                {isGeneratingAsset ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/40 backdrop-blur-md">
                     <Loader2 className="w-20 h-20 text-blue-500 animate-spin" />
                  </div>
                ) : stylizedAsset ? (
                  <img src={stylizedAsset} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20"><Share2 className="w-20 h-20 text-zinc-500" /></div>
                )}
             </div>
          </div>
        </div>
        {copyResults && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {(Object.entries(copyResults) as [keyof SocialCopyResults, SocialPost][]).map(([key, post]) => (
                <div key={key} className="p-8 rounded-[2.5rem] bg-zinc-900 border border-zinc-800 flex flex-col">
                  <h4 className="text-lg font-black text-zinc-100 mb-4">{post.slogan}</h4>
                  <p className="text-xs text-zinc-400 mb-8 flex-1">{post.content}</p>
                  <button className="w-full py-3 bg-zinc-100 text-zinc-950 font-black text-[9px] uppercase rounded-xl">{t.social.pushToSocial}</button>
                </div>
              ))}
           </div>
        )}
      </main>
    </div>
  );
};

export default SocialView;
