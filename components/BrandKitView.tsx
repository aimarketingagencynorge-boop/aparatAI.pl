import React, { useEffect, useState } from 'react';
import { BrandSlot, StudioSettings } from '../types';

const createBrandSlots = (): BrandSlot[] => [1,2,3,4].map(id => ({
  id, name:`Marka ${id}`, activeVersionId:1,
  versions:[1,2,3,4].map(id=>({id,description:'',styleTags:[],lighting:'soft',retouchLevel:80,cameraAngle:'packshot',shadowMode:'soft_contact',alwaysRules:'',neverRules:'',noText:true,logo:{enabled:false,mode:'brand',position:'bottom-right',margin:20,scale:15,opacity:80},assets:[]}))
}));

function readBrandSlots(key:string):BrandSlot[] {
  try {
    const data=JSON.parse(localStorage.getItem(key)||'null');
    if(Array.isArray(data) && data.length===4 && data.every((s,i)=>s.id===i+1 && typeof s.name==='string' && s.name.length<=72 && Array.isArray(s.versions) && s.versions.length===4 && s.versions.every((v:any,j:number)=>v.id===j+1 && ['description','alwaysRules','neverRules'].every(k=>typeof v[k]==='string' && v[k].length<=800) && Array.isArray(v.styleTags) && v.styleTags.length<=12 && v.styleTags.every((tag:any)=>typeof tag==='string' && tag.length<=40) && ['soft','hard','rim'].includes(v.lighting) && ['packshot','flatlay','hero'].includes(v.cameraAngle)))) return data;
  } catch {}
  return createBrandSlots();
}

export default function BrandKitView({storageKey,onApply,onClose}:{storageKey:string;onApply:(profile:NonNullable<StudioSettings['brandProfile']>,lighting:StudioSettings['lightingType'],angle:StudioSettings['angle'])=>void;onClose:()=>void}) {
  const [slots,setSlots]=useState(()=>readBrandSlots(storageKey));
  const [slotId,setSlotId]=useState(1);
  const [versionId,setVersionId]=useState(1);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  useEffect(()=>{setSlots(readBrandSlots(storageKey));setMessage('');setError('');},[storageKey]);
  const slot=slots.find(s=>s.id===slotId)!;
  const version=slot.versions.find(v=>v.id===versionId)!;
  const update=(values:Partial<typeof version>)=>{setMessage('');setSlots(prev=>prev.map(s=>s.id===slotId?{...s,versions:s.versions.map(v=>v.id===versionId?{...v,...values}:v)}:s));};
  const save=()=>{
    setError('');
    try {
      localStorage.setItem(storageKey,JSON.stringify(slots));
      onApply({name:`${slot.name} / V${versionId}`,description:version.description,styleTags:version.styleTags,alwaysRules:version.alwaysRules,neverRules:version.neverRules},version.lighting==='soft'?'studio-soft':'dramatic-noir',version.cameraAngle==='flatlay'?'flatlay':'table-level');
      setMessage('Profil zapisany i włączony dla kolejnych zdjęć.');
    } catch {setError('Nie udało się zapisać profilu w przeglądarce. Sprawdź dostępne miejsce i ustawienia prywatności.');}
  };
  return <div className="brand-kit">
    <header><h1>Brand Kit — styl Twojej marki</h1><p>Zapisz opis, światło i zasady aranżacji. Wybrany profil stosujemy do kolejnych zdjęć, zachowując wygląd produktu.</p><p>Profile są zapisane na tym urządzeniu, w tej przeglądarce, osobno dla każdego konta.</p></header>
    <div className="brand-tabs" aria-label="Profile marek">{slots.map(s=><button key={s.id} aria-pressed={slotId===s.id} onClick={()=>{setSlotId(s.id);setMessage('');}}>{s.name}</button>)}</div>
    <label>Nazwa marki<input maxLength={72} value={slot.name} onChange={e=>{setMessage('');setSlots(prev=>prev.map(s=>s.id===slotId?{...s,name:e.target.value}:s));}}/></label>
    <div className="brand-tabs" aria-label="Wersje profilu">{[1,2,3,4].map(id=><button key={id} aria-pressed={versionId===id} onClick={()=>{setVersionId(id);setMessage('');}}>Wersja {id}</button>)}</div>
    <label>Opis stylu<textarea maxLength={800} placeholder="Np. jasne studio, elegancki minimalizm, błękitne akcenty" value={version.description} onChange={e=>update({description:e.target.value})}/></label>
    <label>Słowa opisujące styl (oddziel przecinkami)<input maxLength={491} value={version.styleTags.join(',')} onChange={e=>update({styleTags:e.target.value.split(',').slice(0,12).map(tag=>tag.slice(0,40))})}/></label>
    <div className="brand-fields"><label>Światło<select value={version.lighting} onChange={e=>update({lighting:e.target.value as any})}><option value="soft">Miękkie studio</option><option value="hard">Mocny kontrast</option><option value="rim">Dramatyczny kontur</option></select></label><label>Kąt widzenia<select value={version.cameraAngle} onChange={e=>update({cameraAngle:e.target.value as any})}><option value="packshot">Poziom produktu</option><option value="flatlay">Z góry — flatlay</option><option value="hero">Ujęcie ekspozycyjne</option></select></label></div>
    <label>Zawsze stosuj<textarea maxLength={800} placeholder="Np. subtelny cień i dużo wolnego miejsca wokół produktu" value={version.alwaysRules} onChange={e=>update({alwaysRules:e.target.value})}/></label>
    <label>Unikaj<textarea maxLength={800} placeholder="Np. dodatkowych przedmiotów i krzykliwych kolorów tła" value={version.neverRules} onChange={e=>update({neverRules:e.target.value})}/></label>
    {message && <p role="status">{message}</p>}{error && <p role="alert">{error}</p>}
    <div className="brand-tabs"><button className="brand-save" onClick={save}>Zapisz i zastosuj profil</button><button onClick={onClose}>Wróć do zdjęć</button></div>
  </div>;
}
