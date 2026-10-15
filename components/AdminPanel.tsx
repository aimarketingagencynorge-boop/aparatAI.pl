import React, { useState } from 'react';

type ManagedAccount={uid:string;email:string;credits:number;totalCredits:number;plan:string;createdAt?:string;activeGeneration:string|null;activeJob:{state:string;createdAt:string}|null};
export default function AdminPanel({request,onClose,onChanged}:{request:(path:string,body:unknown)=>Promise<any>;onClose:()=>void;onChanged:()=>void}){
 const [email,setEmail]=useState(''),[account,setAccount]=useState<ManagedAccount|null>(null),[delta,setDelta]=useState(''),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [operation,setOperation]=useState<{id:string;payload:string}|null>(null);
 const lookup=async()=>{setBusy(true);setMessage('');setAccount(null);setOperation(null);try{setAccount(await request('/api/admin/account',{email}));}catch(e:any){setMessage(e.message);}finally{setBusy(false);}};
 const adjust=async()=>{
  if(!account)return;
  const body={uid:account.uid,delta:Number(delta),reason:reason.trim()};const payload=JSON.stringify(body);const id=operation?.payload===payload?operation.id:crypto.randomUUID();setOperation({id,payload});setBusy(true);setMessage('');
  try{const result=await request('/api/admin/credits',{...body,requestId:id});setAccount({...account,credits:result.credits});setMessage(result.repeated?'Ta operacja była już wykonana. Kredytów nie naliczono ponownie.':'Zmiana salda zapisana wraz z uzasadnieniem w dzienniku administratora.');onChanged();}catch(e:any){setMessage(e.message);}finally{setBusy(false);}
 };
 return <section className="admin-panel" aria-label="Panel administratora"><div className="section-title"><h2>Panel administratora</h2><button className="button button-outline" onClick={onClose} disabled={busy}>Zamknij panel</button></div><p>Wyszukaj konkretne konto po adresie e-mail. Każda korekta salda zapisuje autora, datę i uzasadnienie.</p>
 <form onSubmit={e=>{e.preventDefault();void lookup();}}><label>E-mail konta<input type="email" required value={email} disabled={busy} onChange={e=>setEmail(e.target.value)}/></label><button className="button button-primary" disabled={busy}>Sprawdź konto</button></form>
 {account&&<><dl><dt>Konto</dt><dd>{account.email}</dd><dt>Saldo</dt><dd>{account.credits} kredytów</dd><dt>Pakiet</dt><dd>{account.plan}</dd><dt>Generacja</dt><dd>{account.activeGeneration?`${account.activeJob?.state||'Aktywna'} — ${account.activeJob?.createdAt||account.activeGeneration}`:'Brak aktywnej generacji'}</dd></dl>
 <form onSubmit={e=>{e.preventDefault();void adjust();}}><label>Zmiana liczby kredytów (np. 20 lub -5)<input type="number" min={-5000} max={5000} step={1} required value={delta} disabled={busy} onChange={e=>setDelta(e.target.value)}/></label><label>Uzasadnienie<textarea required minLength={10} maxLength={500} value={reason} disabled={busy} onChange={e=>setReason(e.target.value)}/></label><p>Saldo po zmianie: {Number.isInteger(Number(delta))?account.credits+Number(delta):'—'}. Operacja dotyczy wyłącznie wskazanego konta.</p><button className="button button-primary" disabled={busy||!delta||Number(delta)===0||account.credits+Number(delta)<0}>Zapisz korektę salda</button></form></>}
 {message&&<p role="status">{message}</p>}</section>;
}
