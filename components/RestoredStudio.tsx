import React, { useEffect, useState, useRef } from 'react';
import StudioCanvas from './StudioCanvas';
import AIControls from './AIControls';
import CameraInterface from './CameraInterface';
import BrandKitView from './BrandKitView';
import { StudioState, StudioItem, UserAccount } from '../types';
import { translations } from '../translations';
import { analyzeFoodImage } from '../services/geminiService';
import '../studio.css';

export default function RestoredStudio({ account, initialImage, onClose, onRefresh }: { account: UserAccount; initialImage?: string; onClose:()=>void; onRefresh:()=>void }) {
 const [state,setState] = useState<StudioState>({items:[],selectedItemId:null,language:'pl',settings:{backgroundStyle:'black-satin',lightingType:'studio-soft',angle:'table-level',quality:'hd',aspectRatio:'1:1',presentationType:'table',refinementText:'',modelPreference:'pro',brandKit:{activeSlotId:null,activeVersionId:1,seriesLock:false,bgColor:'#000000',activePreset:null,referenceImage:null}}});
 const [settingsOpen,setSettingsOpen]=useState(true);
 const [brand,setBrand]=useState(false);
 const [user,setUser]=useState(account);
 useEffect(()=>setUser(account),[account]);
 const t = translations[state.language];
 const capture = (input:string|string[]) => {
  const items:StudioItem[]=(Array.isArray(input)?input:[input]).map(originalImage=>({id:crypto.randomUUID(),originalImage,transformedImage:null,isAnalyzing:!!account.isAuthenticated,isGenerating:false,isGeneratingVideo:false,analysis:null,feedback:'',error:null}));
  setState(prev=>({...prev,items:[...items,...prev.items].slice(0,50),selectedItemId:items[0].id}));
  items.forEach(async item=>{ try {const analysis=await analyzeFoodImage(item.originalImage);setState(prev=>({...prev,items:prev.items.map(i=>i.id===item.id?{...i,analysis,isAnalyzing:false}:i)}));}catch(e:any){setState(prev=>({...prev,items:prev.items.map(i=>i.id===item.id?{...i,isAnalyzing:false,error:e.message}:i)}));}});
 };
 const lastImage=useRef('');
 useEffect(()=>{if(initialImage && initialImage!==lastImage.current){lastImage.current=initialImage;capture(initialImage);}},[initialImage]);
 useEffect(()=>{window.addEventListener('aparatai-account-refresh',onRefresh);return()=>window.removeEventListener('aparatai-account-refresh',onRefresh);},[onRefresh]);
 const busy=state.items.some(i=>i.isGenerating||i.isGeneratingVideo);
 return <section className="restored-studio" aria-label="Pełne studio fotografii produktowej">
  <header className="studio-header"><strong>APARAT AI / STUDIO</strong><button disabled={busy} onClick={()=>setBrand(false)}>Zdjęcia produktów</button><button disabled={busy} onClick={()=>setBrand(true)}>Brand Kit</button><button onClick={()=>setSettingsOpen(!settingsOpen)}>Tła i ustawienia</button><span>{account.isAuthenticated?`${account.credits} zdjęć`:'1 darmowe ujęcie'}</span><button disabled={busy} onClick={onClose}>Wróć do aparatu</button></header>
  <div className="studio-workspace">{brand?<BrandKitView t={t}/>:<>
   {state.items.length?<StudioCanvas state={state} setState={setState} user={user} setUser={setUser} t={t} onUseCredit={async()=>!account.isAuthenticated||account.credits>0}/>:<CameraInterface onImageSelected={capture} t={t}/>}
   <div className={`studio-settings ${settingsOpen?'':'closed'}`}><AIControls state={state} setState={setState} t={t}/></div>
  </>}</div>
  <div className="studio-status">Tło → światło → prezentacja → kąt → format → jakość → korekta → generowanie. {account.isAuthenticated?'Kredyt rozlicza serwer.':'Jedno darmowe ujęcie na sieć.'}</div>
 </section>;
}
