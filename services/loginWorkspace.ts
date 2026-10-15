import type { StudioState } from '../types';

let prepare: (()=>Promise<void>) | undefined;
export function registerLoginWorkspace(handler:()=>Promise<void>) { prepare=handler; return ()=>{if(prepare===handler)prepare=undefined;}; }
export async function prepareLoginWorkspace() { await prepare?.(); }
function openStore():Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{const request=indexedDB.open('aparatai-login-workspace',1);request.onupgradeneeded=()=>request.result.createObjectStore('snapshots');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
}
export async function saveLoginWorkspace(state:StudioState,uid?:string) {
  if(!state.items.length)return;
  const id=sessionStorage.getItem('aparatai-login-workspace-id') || crypto.randomUUID();
  const db=await openStore();
  try { await new Promise<void>((resolve,reject)=>{const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').put({state,uid:uid||null,savedAt:Date.now()},id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);}); }
  finally {db.close();}
  sessionStorage.setItem('aparatai-login-workspace-id',id);
  sessionStorage.setItem('aparatai-resume-studio','true');
}
export async function restoreLoginWorkspace(uid?:string):Promise<StudioState|null> {
  const id=sessionStorage.getItem('aparatai-login-workspace-id');
  if(!id || sessionStorage.getItem('aparatai-resume-studio')!=='true')return null;
  const db=await openStore();
  try {
    const saved:any=await new Promise((resolve,reject)=>{const req=db.transaction('snapshots').objectStore('snapshots').get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
    if(!saved || (saved.uid && saved.uid!==uid) || Date.now()-saved.savedAt>86400000 || !Array.isArray(saved.state?.items))return null;
    return {...saved.state,items:saved.state.items.map((item:any)=>({...item,isGenerating:false,isGeneratingVideo:false,isAnalyzing:false}))};
  } finally {db.close();sessionStorage.removeItem('aparatai-resume-studio');}
}
