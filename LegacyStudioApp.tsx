
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import StudioCanvas from './components/StudioCanvas';
import AIControls from './components/AIControls';
import MenuParser from './components/MenuParser';
import BrandKitView from './components/BrandKitView';
import Billing from './components/Billing';
import SocialView from './components/SocialView';
import SystemHealth from './components/SystemHealth';
import CameraInterface from './components/CameraInterface';
import LandingPage from './components/LandingPage';
import PresentationView from './components/PresentationView';
import Login from './components/Login';
import { AppView, StudioState, UserAccount, StudioItem, Language, UserPlan } from './types';
import { translations } from './translations';
import { Key, Lock, Camera, Cpu, LogOut, Menu, X as XIcon, Sliders } from 'lucide-react';
import { analyzeFoodImage } from './services/geminiService';
import { auth, db, logOut } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<AppView>('studio');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  
  const [user, setUser] = useState<UserAccount>({
    plan: 'free',
    credits: 20,
    totalCredits: 20,
    apiAccess: false,
    isAuthenticated: false
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Listen to user document changes
        const unsubDoc = onSnapshot(userDocRef, async (docSnap) => {
          const isOwner = firebaseUser.email === 'aimarketingagencynorge@gmail.com';
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // If owner but not enterprise, upgrade automatically
            if (isOwner && (data.plan !== 'enterprise' || data.credits < 9999)) {
              await updateDoc(userDocRef, {
                plan: 'enterprise',
                credits: 9999,
                totalCredits: 9999
              });
              // The next snapshot will have the updated data
              return;
            }

            setUser({
              plan: data.plan as UserPlan,
              credits: data.credits,
              totalCredits: data.totalCredits,
              apiAccess: data.plan === 'enterprise',
              isAuthenticated: true,
              uid: firebaseUser.uid,
              email: firebaseUser.email || ''
            } as UserAccount);
          } else {
            // Create new user doc if it doesn't exist
            const initialData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              plan: isOwner ? 'enterprise' : 'free',
              credits: isOwner ? 9999 : 20,
              totalCredits: isOwner ? 9999 : 20,
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, initialData);
          }
          setLoading(false);
          setShowLogin(false);
          setShowLanding(false);
        });

        return () => unsubDoc();
      } else {
        setUser({
          plan: 'free',
          credits: 20,
          totalCredits: 20,
          apiAccess: false,
          isAuthenticated: false
        });
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  const [studioState, setStudioState] = useState<StudioState>({
    items: [],
    selectedItemId: null,
    language: 'pl',
    settings: {
      backgroundStyle: 'black-satin',
      lightingType: 'studio-soft',
      angle: 'table-level',
      quality: 'hd',
      aspectRatio: '1:1',
      presentationType: 'table',
      refinementText: '',
      modelPreference: 'pro',
      brandKit: {
        activeSlotId: null,
        activeVersionId: 1,
        seriesLock: false,
        bgColor: '#000000',
        activePreset: null,
        referenceImage: null
      }
    }
  });

  const t = translations[studioState.language];

  const handleGuestLogin = () => {
    setUser({ 
      plan: 'enterprise', 
      isAuthenticated: true,
      apiAccess: true,
      totalCredits: 9999,
      credits: 9999,
      uid: 'guest-user'
    });
    setShowLogin(false);
    setShowLanding(false);
    setCurrentView('studio');
    setStudioState(prev => ({
      ...prev,
      settings: { ...prev.settings, modelPreference: 'flash' }
    }));
  };

  const handleAdminLogin = (_password: string) => { setShowLogin(true); };

  const useCredit = async () => {
    // Enterprise bypass: no credit check, no decrement
    if (user.plan === 'enterprise') return true;
    
    if (!user.isAuthenticated || !user.uid) return false;
    
    if (user.credits > 0) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          credits: increment(-1)
        });
        return true;
      } catch (error) {
        console.error("Error using credit:", error);
        return false;
      }
    }
    setCurrentView('billing');
    return false;
  };

  const upgradePlan = async (plan: UserPlan, credits: number) => {
    if (!user.isAuthenticated || !user.uid) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        plan,
        credits: increment(credits),
        totalCredits: increment(credits)
      });
      setCurrentView('studio');
    } catch (error) {
      console.error("Error upgrading plan:", error);
    }
  };

  const processImage = async (base64: string, id: string) => {
    try {
      const base64Clean = base64.split(',')[1] || base64;
      const analysis = await analyzeFoodImage(base64Clean);
      setStudioState(prev => ({
        ...prev,
        items: prev.items.map(i => i.id === id ? { ...i, analysis, isAnalyzing: false } : i)
      }));
    } catch (err: any) {
      setStudioState(prev => ({
        ...prev,
        items: prev.items.map(i => i.id === id ? { ...i, isAnalyzing: false, error: err.message || 'Analysis failed' } : i)
      }));
    }
  };

  const handleCameraCapture = async (input: string | string[]) => {
    const images = Array.isArray(input) ? input : [input];
    const newItems: StudioItem[] = images.map(base64 => ({
      id: Math.random().toString(36).substr(2, 9),
      originalImage: base64,
      transformedImage: null,
      isAnalyzing: true,
      isGenerating: false,
      isGeneratingVideo: false,
      analysis: null,
      feedback: '',
      error: null
    }));

    setStudioState(prev => ({ 
      ...prev, 
      items: [...newItems, ...prev.items].slice(0, 50),
      selectedItemId: newItems[0].id
    }));

    newItems.forEach(item => processImage(item.originalImage, item.id));
  };

  const renderView = () => {
    switch (currentView) {
      case 'studio':
        return (
          <div className="flex flex-1 h-full overflow-hidden">
            {studioState.items.length === 0 ? (
              <CameraInterface onImageSelected={handleCameraCapture} t={t} />
            ) : (
              <>
                <StudioCanvas state={studioState} setState={setStudioState} user={user} setUser={setUser} t={t} onUseCredit={useCredit} />
                <div className={`fixed inset-y-0 right-0 z-50 w-[340px] transition-transform duration-300 xl:relative xl:translate-x-0 ${isSettingsOpen ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'}`}>
                  <div className="absolute inset-0 bg-black/60 xl:hidden" onClick={() => setIsSettingsOpen(false)} />
                  <div className="relative h-full pointer-events-auto">
                    <AIControls state={studioState} setState={setStudioState} t={t} />
                    <button 
                      onClick={() => setIsSettingsOpen(false)}
                      className="absolute top-4 -left-12 p-2 bg-zinc-900 border border-zinc-800 rounded-lg xl:hidden"
                    >
                      <XIcon size={20} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      case 'brand-kit':
        return <BrandKitView t={t} />;
      case 'menu-parser':
        return (
          <div className="flex flex-1 h-full overflow-hidden">
            <MenuParser t={t} state={studioState} setState={setStudioState} user={user} setUser={setUser} onUseCredit={useCredit} />
            <AIControls state={studioState} setState={setStudioState} t={t} />
          </div>
        );
      case 'billing':
        return <Billing user={user} onUpgrade={upgradePlan} t={t} />;
      case 'social':
        return <SocialView studioState={studioState} t={t} />;
      case 'system-health':
        return <SystemHealth t={t} />;
      case 'capabilities':
        return <PresentationView t={t} />;
      case 'api-management':
        return (
          <div className="flex-1 flex items-center justify-center bg-zinc-950 p-12">
            <div className="max-w-2xl w-full bg-zinc-900 rounded-[3rem] p-12 border border-blue-500/20 space-y-8">
               <div className="flex items-center gap-4">
                  <Key className="w-10 h-10 text-blue-500" />
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">API Configuration</h2>
               </div>
               <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status Klucza API</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${hasApiKey ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                      {hasApiKey ? 'ZAKONFIGUROWANO' : 'BRAK KLUCZA'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed italic">
                    Modele Pro oraz Veo wymagają własnego klucza API z projektów płatnych.
                  </p>
                  <button 
                    onClick={async () => {
                      if (window.aistudio) {
                        await window.aistudio.openSelectKey();
                        setHasApiKey(true);
                      }
                    }}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                  >
                    Otwórz Konfigurator Klucza
                  </button>
                  <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="block text-center text-[9px] text-zinc-600 font-bold uppercase tracking-widest">
                    Dokumentacja Billingowa API
                  </a>
               </div>
            </div>
          </div>
        );
      default:
        return <div className="flex-1" />;
    }
  };

  if (showLogin) return <Login onLogin={handleAdminLogin} onSkip={handleGuestLogin} t={t} />;
  if (showLanding) return <LandingPage onStart={handleGuestLogin} onLoginRequest={() => setShowLogin(true)} language={studioState.language} />;

  return (
    <div className="flex h-[100dvh] w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      <div className={`fixed inset-0 z-50 transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${!isMobileMenuOpen ? 'pointer-events-none md:pointer-events-auto' : 'pointer-events-auto'}`}>
        <div className={`absolute inset-0 bg-black/60 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMobileMenuOpen(false)} />
        <div className="relative h-full w-64 shrink-0 pointer-events-auto">
          <Sidebar currentView={currentView} setView={(v) => { setCurrentView(v); setIsMobileMenuOpen(false); }} user={user} language={studioState.language} setLanguage={() => {}} t={t} />
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 -right-12 p-2 bg-zinc-900 border border-zinc-800 rounded-lg md:hidden"
          >
            <XIcon size={20} />
          </button>
        </div>
      </div>
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 md:px-6 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-zinc-400 hover:text-white md:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <Camera size={16} className="text-white md:hidden" />
              <Camera size={18} className="text-white hidden md:block" />
            </div>
            <h1 className="text-base md:text-lg font-semibold tracking-tight uppercase italic truncate max-w-[120px] md:max-w-none">{t.appName} <span className="text-blue-500 italic">AI</span></h1>
            {user.plan === 'enterprise' && (
              <div className="hidden sm:flex ml-2 md:ml-4 px-2 md:px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full items-center gap-2">
                 <Cpu size={10} className="text-green-500 animate-pulse" />
                 <span className="text-[8px] md:text-[9px] font-black text-green-500 uppercase tracking-widest">Engineering Mode v4.5</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {currentView === 'studio' && studioState.items.length > 0 && (
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-zinc-400 hover:text-white xl:hidden"
                title="Ustawienia AI"
              >
                <Sliders size={20} />
              </button>
            )}
            {user.isAuthenticated && (
              <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                <div className="flex flex-col items-end">
                  <span className="text-[7px] md:text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-0.5">{t.billing.currentCredits}</span>
                  <span className="text-[10px] md:text-xs font-black text-blue-500 italic leading-none">
                    {user.plan === 'enterprise' ? 'UNLIMITED' : `${user.credits} / ${user.totalCredits}`}
                  </span>
                </div>
                <button 
                  onClick={() => logOut()}
                  className="p-1.5 md:p-2 text-zinc-500 hover:text-red-500 transition-colors border-l border-zinc-800 ml-1 pl-2 md:pl-3"
                  title="Wyloguj"
                >
                  <LogOut size={14} className="md:hidden" />
                  <LogOut size={16} className="hidden md:block" />
                </button>
              </div>
            )}
            {!hasApiKey && user.plan === 'enterprise' && (
              <button 
                onClick={() => setCurrentView('api-management')}
                className="hidden sm:flex px-3 py-1 rounded-full border border-red-500/20 bg-red-500/10 items-center gap-2 hover:bg-red-500/20 transition-all animate-pulse"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-tighter text-red-400">Skonfiguruj API</span>
              </button>
            )}
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-1.5 rounded-md text-[10px] md:text-sm font-bold transition-all shadow-lg active:scale-95 whitespace-nowrap">Eksportuj</button>
          </div>
        </header>
        {renderView()}
      </main>
    </div>
  );
};

export default App;

