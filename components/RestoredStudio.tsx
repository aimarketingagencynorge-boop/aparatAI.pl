import React, { useEffect, useState, useRef } from 'react';
import StudioCanvas from './StudioCanvas';
import AIControls from './AIControls';
import CameraInterface from './CameraInterface';
import BrandKitView from './BrandKitView';
import { StudioState, StudioItem, UserAccount } from '../types';
import { translations } from '../translations';
import { analyzeFoodImage, studioGet, resumeStudioVideo } from '../services/geminiService';
import '../studio.css';

export default function RestoredStudio({ account, initialImage, onClose, onRefresh, onBuyCredits, trialAvailable }: { account: UserAccount; initialImage?: string; onClose:()=>void; onRefresh:()=>void; onBuyCredits:()=>void; trialAvailable:boolean }) {
 const [state,setState] = useState<StudioState>({items:[],selectedItemId:null,language:'pl',settings:{backgroundStyle:'black-satin',lightingType:'studio-soft',angle:'table-level',quality:'hd',aspectRatio:'1:1',presentationType:'table',refinementText:'',modelPreference:'pro',brandKit:{activeSlotId:null,activeVersionId:1,seriesLock:false,bgColor:'#000000',activePreset:null,referenceImage:null}}});
 const [settingsOpen,setSettingsOpen]=useState(()=>window.matchMedia('(min-width:1280px)').matches);
 const [brand,setBrand]=useState(false);
 const [user,setUser]=useState(account);
 const [videoConfig,setVideoConfig]=useState({videoEnabled:false,videoCredits:10});
 const [resumeBusy,setResumeBusy]=useState(false);
 const [resumeError,setResumeError]=useState('');
 useEffect(()=>{void studioGet('/api/studio/capabilities').then(setVideoConfig).catch(()=>{});},[]);
 const resumeVideo=async()=>{
  if(!account.uid)return;
  const id=localStorage.getItem(`aparatai-video-${account.uid}`);if(!id)return;
  setResumeBusy(true);setResumeError('');
  try{const url=await resumeStudioVideo(id);const link=document.createElement('a');link.href=url;link.download='aparatai-film.mp4';link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(e:any){setResumeError(e.message);}finally{setResumeBusy(false);}
 };
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
 const brandStorageKey=`aparatai-brand-profiles-${account.uid || 'guest'}`;
 useEffect(()=>{setState(prev=>({...prev,settings:{...prev.settings,brandProfile:undefined}}));},[account.uid]);
 return <section className="restored-studio" aria-label="Pełne studio fotografii produktowej">
  <header className="studio-header"><strong>APARAT AI / STUDIO</strong><button disabled={busy} aria-pressed={!brand} onClick={()=>setBrand(false)}>Zdjęcia produktów</button><button disabled={busy} aria-pressed={brand} onClick={()=>setBrand(true)}>Brand Kit</button><button disabled={brand} aria-expanded={settingsOpen} aria-controls="studio-settings" onClick={()=>setSettingsOpen(!settingsOpen)}>{settingsOpen?'Zamknij ustawienia':'Tła i ustawienia'}</button><span>{account.isAuthenticated?`${account.credits} kredytów`:trialAvailable?'1 darmowe ujęcie':'Darmowa próba wykorzystana'}</span><button disabled={busy} onClick={onClose}>Wróć do aparatu</button></header>
  {account.isAuthenticated && account.credits<1 && <div className="studio-notice" role="status">Masz 0 kredytów. Darmowa próba jest dostępna bez logowania, raz na sieć. <button disabled={busy} onClick={onBuyCredits}>Wybierz pakiet</button></div>}
  {state.settings.brandProfile && <div className="studio-notice">Aktywny profil: {state.settings.brandProfile.name} <button disabled={busy} onClick={()=>setState(prev=>({...prev,settings:{...prev.settings,brandProfile:undefined}}))}>Wyłącz profil</button></div>}
  <div className="studio-workspace">{brand?<BrandKitView storageKey={brandStorageKey} onClose={()=>setBrand(false)} onApply={(brandProfile,lightingType,angle)=>setState(prev=>({...prev,settings:{...prev.settings,brandProfile,lightingType,angle}}))}/>:<>
   {state.items.length?<StudioCanvas state={state} setState={setState} user={{...user,...videoConfig}} setUser={setUser} t={t} onBuyCredits={onBuyCredits} onUseCredit={async()=>!account.isAuthenticated||account.credits>0}/>:<CameraInterface onImageSelected={capture} t={t}/>}
   <div id="studio-settings" className={`studio-settings ${settingsOpen?'':'closed'}`}><div className="studio-settings-heading"><strong>Tła, światło i ustawienia</strong><button onClick={()=>setSettingsOpen(false)}>Gotowe — wróć do zdjęcia</button></div><AIControls state={state} setState={setState} t={t}/></div>
  </>}</div>
  <div className="studio-status">Zdjęcie: 1 kredyt. {videoConfig.videoEnabled?`Film 8 s / 1080p: ${videoConfig.videoCredits} kredytów.`:'Filmy są w przygotowaniu.'} {account.uid && localStorage.getItem(`aparatai-video-${account.uid}`) && <button disabled={resumeBusy||busy} onClick={resumeVideo}>{resumeBusy?'Sprawdzanie filmu…':'Wznów / pobierz ostatni film'}</button>} {resumeError && <span role="alert">{resumeError}</span>}</div>
 </section>;
}
