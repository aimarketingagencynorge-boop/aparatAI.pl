
import React, { useState, useRef } from 'react';
import { Shield, Upload, Save, CheckCircle, Trash2, Plus, LayoutGrid, Sliders, Type, Camera, Sun, X, Image as ImageIcon, Check } from 'lucide-react';
import { BrandSlot, BrandVersion, BrandAsset, LogoSettings } from '../types';

const INITIAL_LOGO: LogoSettings = {
  enabled: false,
  mode: 'brand',
  position: 'bottom-right',
  margin: 20,
  scale: 15,
  opacity: 80
};

const BrandKitView: React.FC<{ t: any }> = ({ t }) => {
  const [activeSlot, setActiveSlot] = useState<number>(1);
  const [activeVersion, setActiveVersion] = useState<number>(1);
  const [tagInput, setTagInput] = useState('');
  
  const [slots, setSlots] = useState<BrandSlot[]>(
    [1, 2, 3, 4].map(id => ({
      id,
      name: `Brand Slot ${id}`,
      activeVersionId: 1,
      versions: [1, 2, 3, 4].map(v => ({
        id: v,
        description: '',
        styleTags: ['modern', 'clean', 'high-contrast'],
        lighting: 'soft',
        retouchLevel: 80,
        cameraAngle: 'packshot',
        shadowMode: 'soft_contact',
        alwaysRules: '',
        neverRules: '',
        noText: true,
        logo: { ...INITIAL_LOGO },
        assets: []
      }))
    }))
  );

  const currentSlot = slots.find(s => s.id === activeSlot)!;
  const currentVer = currentSlot.versions.find(v => v.id === activeVersion)!;

  const updateVersion = (updates: Partial<BrandVersion>) => {
    setSlots(prev => prev.map(s => s.id === activeSlot ? {
      ...s,
      versions: s.versions.map(v => v.id === activeVersion ? { ...v, ...updates } : v)
    } : s));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: BrandAsset['type']) => {
    const files = e.target.files;
    if (!files) return;

    // Fix: Explicitly cast Array.from(files) to File[] to avoid 'unknown' type error during iteration
    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const newAsset: BrandAsset = { 
          id: Math.random().toString(36).substr(2, 9), 
          url, 
          type, 
          isDefault: type === 'background' && !currentVer.assets.some(a => a.type === 'background') 
        };
        
        // If it's a logo, replace existing logo asset
        if (type === 'logo') {
          updateVersion({ 
            assets: [...currentVer.assets.filter(a => a.type !== 'logo'), newAsset],
            logo: { ...currentVer.logo, enabled: true }
          });
        } else {
          updateVersion({ assets: [...currentVer.assets, newAsset] });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAsset = (id: string) => {
    updateVersion({ assets: currentVer.assets.filter(a => a.id !== id) });
  };

  const addTag = () => {
    if (!tagInput || currentVer.styleTags.includes(tagInput)) return;
    updateVersion({ styleTags: [...currentVer.styleTags, tagInput] });
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    updateVersion({ styleTags: currentVer.styleTags.filter(t => t !== tag) });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Identity Management</h1>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Master 4 Brand Slots with Multi-Version AI Logic</p>
            </div>
          </div>
          <button className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center gap-3 transition-all active:scale-95 group">
            <Save size={14} className="group-hover:rotate-12 transition-transform" /> Save Brand DNA
          </button>
        </div>

        {/* Brand Selector */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {slots.map(slot => (
            <button
              key={slot.id}
              onClick={() => setActiveSlot(slot.id)}
              className={`p-6 rounded-[2rem] border-2 transition-all text-left relative overflow-hidden group ${activeSlot === slot.id ? 'bg-blue-600/5 border-blue-500 shadow-2xl' : 'bg-zinc-900/40 border-zinc-900 hover:border-zinc-800'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest ${activeSlot === slot.id ? 'text-blue-500' : 'text-zinc-600'}`}>Identity 0{slot.id}</span>
                {activeSlot === slot.id && <CheckCircle size={14} className="text-blue-500 animate-pulse" />}
              </div>
              <input 
                className="bg-transparent text-lg font-black text-white italic uppercase tracking-tighter w-full focus:outline-none"
                value={slot.name}
                onChange={(e) => setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, name: e.target.value } : s))}
              />
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Style DNA Side */}
          <div className="w-full lg:w-[400px] space-y-8">
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-[2.5rem] p-8 space-y-8">
              
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Version</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(v => (
                    <button
                      key={v}
                      onClick={() => setActiveVersion(v)}
                      className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${activeVersion === v ? 'bg-blue-600 text-white shadow-lg' : 'bg-zinc-950 text-zinc-600 border border-zinc-800'}`}
                    >
                      V{v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Style Description</label>
                <textarea 
                  className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-medium text-zinc-300 focus:border-blue-500 outline-none resize-none placeholder:text-zinc-700 shadow-inner"
                  placeholder="Describe the overall aesthetic (e.g., Luxury watch studio vibes, dark moody lighting...)"
                  value={currentVer.description}
                  onChange={(e) => updateVersion({ description: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Style Tags</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {currentVer.styleTags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase rounded-lg flex items-center gap-1">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-white"><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold text-zinc-400 focus:border-blue-500 outline-none"
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <button onClick={addTag} className="p-2 bg-blue-600 rounded-xl text-white"><Plus size={18} /></button>
                </div>
              </div>

              <div className="space-y-6 pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-3 text-zinc-100">
                  <Sliders size={18} className="text-blue-500" />
                  <span className="text-xs font-black uppercase tracking-widest">Technical DNA</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase">Lighting</label>
                    <select 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-[10px] font-bold text-zinc-300 focus:border-blue-500 outline-none"
                      value={currentVer.lighting}
                      onChange={(e) => updateVersion({ lighting: e.target.value as any })}
                    >
                      <option value="soft">Studio Soft</option>
                      <option value="hard">Hard Contrast</option>
                      <option value="rim">Dramatic Rim</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase">Angle</label>
                    <select 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-[10px] font-bold text-zinc-300 focus:border-blue-500 outline-none"
                      value={currentVer.cameraAngle}
                      onChange={(e) => updateVersion({ cameraAngle: e.target.value as any })}
                    >
                      <option value="packshot">Packshot</option>
                      <option value="flatlay">Flat Lay</option>
                      <option value="hero">Hero Shot</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Asset Management Area */}
          <div className="flex-1 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-900/40 border border-zinc-900 rounded-[2.5rem] p-8 space-y-4">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <CheckCircle size={14} /> ALWAYS Prompt Rules
                </label>
                <textarea 
                  className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-medium text-zinc-300 focus:border-blue-500 outline-none resize-none placeholder:text-zinc-700 shadow-inner"
                  placeholder="e.g. Always include anamorphic lens flares..."
                  value={currentVer.alwaysRules}
                  onChange={(e) => updateVersion({ alwaysRules: e.target.value })}
                />
              </div>
              <div className="bg-zinc-900/40 border border-zinc-900 rounded-[2.5rem] p-8 space-y-4">
                <label className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Trash2 size={14} /> NEVER Prompt Rules
                </label>
                <textarea 
                  className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-medium text-zinc-300 focus:border-red-500 outline-none resize-none placeholder:text-zinc-700 shadow-inner"
                  placeholder="e.g. No plastic textures, no messy cables..."
                  value={currentVer.neverRules}
                  onChange={(e) => updateVersion({ neverRules: e.target.value })}
                />
              </div>
            </div>

            {/* Assets Laboratory */}
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-[2.5rem] p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LayoutGrid className="text-blue-500" size={20} />
                  <span className="text-sm font-black uppercase tracking-widest text-white">Visual Identity Assets</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Backgrounds Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-zinc-500 uppercase">Environments</span>
                    <label className="cursor-pointer text-blue-500 hover:text-blue-400">
                      <Plus size={16} />
                      <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'background')} />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {currentVer.assets.filter(a => a.type === 'background').map(asset => (
                      <div key={asset.id} className="relative aspect-square rounded-xl overflow-hidden group">
                        <img src={asset.url} className="w-full h-full object-cover" />
                        <button onClick={() => removeAsset(asset.id)} className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                        {asset.isDefault && <div className="absolute bottom-1 left-1 px-1 bg-blue-600 text-[6px] font-black rounded">DEFAULT</div>}
                      </div>
                    ))}
                    <label className="aspect-square rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-950/50 flex flex-col items-center justify-center group hover:border-blue-500/50 transition-all cursor-pointer">
                      <Upload className="text-zinc-800 group-hover:text-blue-500 mb-1" size={14} />
                      <span className="text-[7px] font-black text-zinc-800 uppercase">ADD BG</span>
                      <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'background')} />
                    </label>
                  </div>
                </div>

                {/* Logo Overlay Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-zinc-500 uppercase">Logo Overlay</span>
                    <button onClick={() => updateVersion({ logo: { ...currentVer.logo, enabled: !currentVer.logo.enabled }})} className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${currentVer.logo.enabled ? 'bg-green-500/10 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}>
                      {currentVer.logo.enabled ? 'ACTIVE' : 'OFF'}
                    </button>
                  </div>
                  {currentVer.assets.find(a => a.type === 'logo') ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 p-4 flex items-center justify-center group">
                      <img src={currentVer.assets.find(a => a.type === 'logo')?.url} className="max-w-full max-h-full object-contain" />
                      <button onClick={() => removeAsset(currentVer.assets.find(a => a.type === 'logo')!.id)} className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded opacity-0 group-hover:opacity-100"><X size={12} /></button>
                    </div>
                  ) : (
                    <label className="aspect-video rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-950/50 flex flex-col items-center justify-center group hover:border-blue-500/50 transition-all cursor-pointer">
                      <Plus className="text-zinc-800 group-hover:text-blue-500 mb-1" size={18} />
                      <span className="text-[8px] font-black text-zinc-800 uppercase">Upload PNG Logo</span>
                      <input type="file" className="hidden" accept="image/png" onChange={(e) => handleFileUpload(e, 'logo')} />
                    </label>
                  )}
                  
                  {currentVer.logo.enabled && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                       <div className="space-y-2">
                          <label className="text-[8px] font-black text-zinc-600 uppercase">Scale %</label>
                          <input type="range" className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600" value={currentVer.logo.scale} onChange={(e) => updateVersion({ logo: { ...currentVer.logo, scale: parseInt(e.target.value) }})} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[8px] font-black text-zinc-600 uppercase">Opacity</label>
                          <input type="range" className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600" value={currentVer.logo.opacity} onChange={(e) => updateVersion({ logo: { ...currentVer.logo, opacity: parseInt(e.target.value) }})} />
                       </div>
                    </div>
                  )}
                </div>

                {/* Moodboard / References */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-zinc-500 uppercase">Moodboard</span>
                    <label className="cursor-pointer text-blue-500 hover:text-blue-400">
                      <Plus size={16} />
                      <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'ref_good')} />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {currentVer.assets.filter(a => a.type === 'ref_good').map(asset => (
                      <div key={asset.id} className="relative aspect-square rounded-xl overflow-hidden group">
                        <img src={asset.url} className="w-full h-full object-cover" />
                        <button onClick={() => removeAsset(asset.id)} className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                      </div>
                    ))}
                    <label className="aspect-square rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-950/50 flex flex-col items-center justify-center group hover:border-blue-500/50 transition-all cursor-pointer">
                      <ImageIcon className="text-zinc-800 group-hover:text-blue-500 mb-1" size={14} />
                      <span className="text-[7px] font-black text-zinc-800 uppercase">ADD REF</span>
                      <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'ref_good')} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandKitView;
