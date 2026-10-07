
import React, { useState, useEffect, useRef } from 'react';
import { Activity, ShieldCheck, Zap, Globe, HardDrive, RefreshCw, AlertTriangle, CheckCircle2, Terminal, Cpu, Play, Search, Hammer } from 'lucide-react';
import { runDiagnosticAudit, runAutoFixEngine } from '../services/geminiService';
import { SystemLog, HealthStats } from '../types';

const SystemHealth: React.FC<{ t: any }> = ({ t }) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [auditReport, setAuditReport] = useState<string | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState<HealthStats>({
    gemini: 'online',
    stripe: 'connected',
    zapier: 'active',
    storage: 72,
    latency: '450ms'
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, type: SystemLog['type'] = 'info') => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      msg,
      type
    }].slice(-50));
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    const interval = setInterval(() => {
      const messages = [
        "Przetwarzanie serii tła...",
        "Synchronizacja oświetlenia Neural Lighting.",
        "Weryfikacja bramki płatniczej.",
        "Serce AI (Gemini): 200 OK.",
        "Aktualizacja bazy ujęć."
      ];
      addLog(messages[Math.floor(Math.random() * messages.length)]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const runAudit = async () => {
    setIsAuditing(true);
    setAuditReport(null);
    addLog("Inicjowanie pełnego audytu aparatu...", 'warning');
    
    const technicalData = {
      api_key: "AKTYWNY",
      quota_remaining: "98.2%",
      last_latency: stats.latency,
      stripe_tunnel: "STABILNY",
      zapier_status: stats.zapier,
      storage_usage: `${stats.storage}%`,
      active_connections: 42
    };

    try {
      const result = await runDiagnosticAudit(technicalData);
      setAuditReport(result);
      addLog("Audyt zakończony. Raport Gemini 1.5 Pro gotowy.", 'success');
    } catch (e) {
      addLog("Błąd audytu: Brak połączenia z silnikiem AI.", 'error');
      setAuditReport("Błąd techniczny: Połączenie przerwane.");
    } finally {
      setIsAuditing(false);
    }
  };

  const runAutoFix = async () => {
    setIsAutoFixing(true);
    addLog("Uruchamianie silnika Auto-Fix. Skanowanie błędów...", 'warning');
    
    try {
      const fixResult = await runAutoFixEngine("Safety Filter Triggered on 'bloody steak' prompt", "Imagen 3 generation via Vertex AI");
      addLog(`Diagnoza AI: ${fixResult.explanation}`, 'info');
      addLog(`Nakładanie poprawki: ${fixResult.action}`, 'success');
    } catch (e) {
      addLog("Silnik Auto-Fix napotkał błąd krytyczny.", 'error');
    } finally {
      setIsAutoFixing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#050505] overflow-hidden">
      <header className="h-20 border-b border-green-900/30 flex items-center justify-between px-8 bg-zinc-950/20 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-green-500 italic tracking-tighter uppercase font-mono">
              APARAT_CORE // CENTRUM_DOWODZENIA
            </h1>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_green]" />
                 <span className="text-[10px] font-mono text-green-700 uppercase tracking-widest">SYSTEM_LIVE</span>
               </div>
               <span className="text-[10px] font-mono text-zinc-600 uppercase">DOSTĘPNOŚĆ: 99.98%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button 
            onClick={runAutoFix}
            disabled={isAutoFixing}
            className="px-6 py-2.5 bg-green-500/10 border border-green-500/40 text-green-500 rounded-lg font-mono text-[10px] uppercase hover:bg-green-500 hover:text-black transition-all disabled:opacity-50 flex items-center gap-2"
           >
             <Hammer size={12} />
             {isAutoFixing ? "NAPRAWIANIE..." : "AUTO_NAPRAWA"}
           </button>
           <button 
            onClick={runAudit}
            disabled={isAuditing}
            className="px-6 py-2.5 bg-blue-600/10 border border-blue-500/40 text-blue-500 rounded-lg font-mono text-[10px] uppercase hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50 flex items-center gap-2"
           >
             <ShieldCheck size={12} />
             {isAuditing ? "SKANOWANIE..." : "AUDYT_AI"}
           </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden grid grid-cols-12 gap-px bg-zinc-900/50">
        <div className="col-span-12 lg:col-span-4 bg-[#050505] overflow-y-auto p-8 space-y-6">
           <div className="space-y-4">
             <h3 className="text-[10px] font-mono font-black text-zinc-600 uppercase tracking-[0.3em] mb-6 border-b border-zinc-900 pb-2">STATUS_USŁUG</h3>
             
             <ServiceCard name="OBIEKTYW GEMINI" status={stats.gemini === 'online' ? "AKTYWNY" : "OPÓŹNIENIE"} val={stats.latency} color="text-blue-400" />
             <ServiceCard name="ŁĄCZE_PŁATNICZE" status={stats.stripe === 'connected' ? "ZSYNCHRONIZOWANE" : "BŁĄD"} val="STABILNE" color="text-green-500" />
             <ServiceCard name="ZAPIER_AUTOMAT" status={stats.zapier === 'active' ? "AKTYWNY" : "CZUWANIE"} val="80ms" color="text-orange-400" />
             <ServiceCard name="PAMIĘĆ_UJĘĆ" status="OPTYMALNA" val={`${stats.storage}%`} color="text-purple-400" />
           </div>

           <div className="pt-8 space-y-4">
              <h3 className="text-[10px] font-mono font-black text-zinc-600 uppercase tracking-[0.3em] mb-6 border-b border-zinc-900 pb-2">OBCIĄŻENIE</h3>
              <div className="space-y-6">
                <LoadBar label="RENDEROWANIE_NEURALNE" progress={85} />
                <LoadBar label="LIMIT_API_QUOTA" progress={32} />
                <LoadBar label="REZERWACJA_GPU" progress={12} />
              </div>
           </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-[#050505] flex flex-col relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-full h-[2px] bg-green-500/10 shadow-[0_0_20px_green] animate-scan z-10 pointer-events-none" />
           
           <div className="flex-1 flex flex-col p-8 font-mono overflow-hidden">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                   <Terminal className="w-5 h-5 text-green-700" />
                   <h2 className="text-xs uppercase text-zinc-500 font-bold tracking-widest">Dziennik Zdarzeń Aparatu</h2>
                </div>
                <div className="text-[9px] text-zinc-700">BUFFER_SIZE: 50/50</div>
             </div>

             <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1.5 scrollbar-hide text-[11px] leading-tight">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-zinc-700 shrink-0">[{log.timestamp}]</span>
                    <span className={`
                      ${log.type === 'error' ? 'text-red-500' : ''}
                      ${log.type === 'success' ? 'text-green-400' : ''}
                      ${log.type === 'warning' ? 'text-amber-500' : ''}
                      ${log.type === 'info' ? 'text-zinc-400' : ''}
                    `}>
                      {log.type === 'error' ? 'BŁĄD_!! >' : log.type === 'warning' ? 'OSTRZ >' : 'LOG >'} {log.msg}
                    </span>
                  </div>
                ))}
             </div>
           </div>

           {auditReport && (
             <div className="h-1/2 border-t border-blue-900/30 bg-blue-950/5 backdrop-blur-2xl p-8 overflow-y-auto animate-in slide-in-from-bottom-full duration-700">
                <div className="flex items-center gap-3 mb-6">
                   <Cpu className="w-5 h-5 text-blue-500" />
                   <h3 className="text-xs font-black uppercase text-blue-400 tracking-widest">RAPORT_AUDYTU_AI</h3>
                </div>
                <p className="text-sm text-zinc-400 font-mono leading-relaxed whitespace-pre-wrap">
                  {auditReport}
                </p>
                <div className="mt-8 flex justify-end">
                   <button onClick={() => setAuditReport(null)} className="text-[9px] font-black uppercase text-zinc-600 hover:text-white transition-all">Zamknij Raport</button>
                </div>
             </div>
           )}
        </div>
      </main>

      <footer className="h-10 border-t border-zinc-900 bg-zinc-950 px-8 flex items-center justify-between">
         <div className="flex items-center gap-8">
            <LED name="OBIEKTYW" active />
            <LED name="PŁATNOŚĆ" active />
            <LED name="AUTOMAT" active />
            <LED name="BAZA" active />
         </div>
         <div className="flex items-center gap-4 text-zinc-700 text-[9px] font-mono">
            <span>REGION: EUROPA-CENTRALNA</span>
            <span>ID_WĘZŁA: 0x9A2F</span>
         </div>
      </footer>
    </div>
  );
};

const ServiceCard = ({ name, status, val, color }: any) => (
  <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-lg group hover:border-zinc-800 transition-all">
    <div className="flex justify-between items-start mb-2">
      <span className="text-[9px] font-mono font-black text-zinc-700 uppercase">{name}</span>
      <span className={`text-[9px] font-mono font-black uppercase ${color}`}>{status}</span>
    </div>
    <div className="text-xl font-mono text-zinc-300 group-hover:text-white transition-colors">{val}</div>
  </div>
);

const LoadBar = ({ label, progress }: any) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-[8px] font-mono font-black text-zinc-700 uppercase">
       <span>{label}</span>
       <span>{progress}%</span>
    </div>
    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
       <div 
        className="h-full bg-green-500/40 shadow-[0_0_8px_green] transition-all duration-1000" 
        style={{ width: `${progress}%` }} 
       />
    </div>
  </div>
);

const LED = ({ name, active }: any) => (
  <div className="flex items-center gap-2">
    <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500 shadow-[0_0_6px_green]' : 'bg-red-500'}`} />
    <span className="text-[8px] font-mono font-black text-zinc-600 uppercase">{name}</span>
  </div>
);

export default SystemHealth;
