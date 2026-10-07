
import React from 'react';
import { Camera, FileText, Share2, CreditCard, LayoutGrid, Globe, Shield, Activity, Circle, Info } from 'lucide-react';
import { AppView, UserAccount, Language } from '../types';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  user: UserAccount;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: any;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, user, language, t }) => {
  const menuItems = [
    { id: 'studio', label: t.nav.studio, icon: Camera },
    { id: 'brand-kit', label: 'Brand Kit', icon: Shield },
    { id: 'menu-parser', label: t.nav.menu, icon: FileText },
    { id: 'social', label: t.nav.social, icon: Share2 },
    { id: 'billing', label: t.nav.billing, icon: CreditCard },
  ];

  const creditPercentage = (user.credits / user.totalCredits) * 100;
  const isUnlimited = user.plan === 'enterprise' && user.credits > 9000;

  return (
    <nav className="w-full h-full bg-zinc-950 flex flex-col border-r border-zinc-800 transition-all z-20">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutGrid className="w-6 h-6 text-blue-500" />
          <span className="font-bold tracking-[0.2em] text-zinc-200 text-xs uppercase">{t.nav.dashboard}</span>
        </div>
      </div>
      
      <div className="flex-1 mt-4 px-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as AppView)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
              currentView === item.id 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50'
            }`}
          >
            <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${currentView === item.id ? 'text-blue-500' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}

        <button
          onClick={() => setView('capabilities')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
            currentView === 'capabilities' 
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
              : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          <Info className={`w-5 h-5 transition-transform group-hover:scale-110 ${currentView === 'capabilities' ? 'text-blue-500' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
          <span className="text-sm font-medium">Capabilities / Manual</span>
        </button>

        {user.plan === 'enterprise' && (
          <button
            onClick={() => setView('system-health')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative ${
              currentView === 'system-health' 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50'
            }`}
          >
            <Activity className={`w-5 h-5 transition-transform group-hover:scale-110 ${currentView === 'system-health' ? 'text-blue-500' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
            <span className="text-sm font-medium">{t.nav.health}</span>
            <div className="absolute right-4 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_green]" />
          </button>
        )}
      </div>

      <div className="p-4 mt-auto space-y-4">
        <div className="px-5 py-3 rounded-xl bg-zinc-900/30 border border-zinc-900 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Circle size={6} fill="#22c55e" className="text-green-500 animate-pulse" />
             <span className="text-[9px] font-mono font-black text-zinc-600 uppercase tracking-widest">Sys_OK</span>
           </div>
           <span className="text-[9px] font-mono text-zinc-700">v4.5.0</span>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 shadow-xl">
          <div className="flex justify-between items-center mb-3">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Credits</p>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">{user.plan.toUpperCase()}</p>
          </div>
          <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800">
            <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: isUnlimited ? '100%' : `${creditPercentage}%` }}></div>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2 font-medium">
            {isUnlimited ? (
              <span className="text-lg font-black text-blue-500">∞ <span className="text-[9px] text-zinc-600 align-middle">UNLIMITED ACCESS</span></span>
            ) : (
              `${user.credits} / ${user.totalCredits} left`
            )}
          </p>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
