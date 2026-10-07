import React, { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, logOut } from './firebaseAuth';
import { Camera, Aperture, Power, ImagePlus, SlidersHorizontal, Crosshair, Download } from 'lucide-react';
import './public.css';
import './camera.css';
import RestoredStudio from './components/RestoredStudio';

type TrialState = 'loading' | 'available' | 'processing' | 'succeeded' | 'failed' | 'unavailable';
type Plan = { id: string; credits: number; amount: number; currency: string };
type Account = { credits: number; plan: string };
const backgrounds = [
  { id: 'white', name: 'Czyste studio', detail: 'Białe tło i miękkie światło', color: '#f3f1ed' },
  { id: 'beige', name: 'Naturalna aranżacja', detail: 'Ciepły beż i światło z okna', color: '#ccb797' },
  { id: 'dark', name: 'Premium', detail: 'Ciemne tło i światło konturowe', color: '#292a2f' },
];
async function api(path: string, user?: User | null, body?: unknown) {
  const apiOrigin = ['localhost', '127.0.0.1'].includes(location.hostname) ? '' : 'https://m-j-aparat-ai-profesjonalna-fotografia-produktowa-301238981720.us-west1.run.app';
  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
  const response = await fetch(apiOrigin + path, { method: body ? 'POST' : 'GET', headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  if (!response.ok) throw new Error(`${data.error?.message || 'Usługa jest chwilowo niedostępna.'}${data.error?.requestId ? ` Numer zgłoszenia: ${data.error.requestId}` : ''}`);
  return data;
}
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioStarted, setStudioStarted] = useState(false);
  useEffect(() => { if(studioOpen) setStudioStarted(true); }, [studioOpen]);
  const [account, setAccount] = useState<Account | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [trial, setTrial] = useState<TrialState>('loading');
  const [localPreview, setLocalPreview] = useState(false);
  const [original, setOriginal] = useState('');
  const [result, setResult] = useState('');
  const [scene, setScene] = useState('white');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [buyBusy, setBuyBusy] = useState('');
  const [compare, setCompare] = useState(50);
  const fileRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLElement>(null);
  const locked = busy || (!user && trial !== 'available');
  const loadTrial = async () => {
    try { const data = await api('/api/trial'); setTrial(data.state); setLocalPreview(data.localPreview); }
    catch { setTrial('unavailable'); }
  };
  useEffect(() => { void loadTrial(); void api('/api/plans').then(data => setPlans(data.plans || [])).catch(() => {}); }, []);
  useEffect(() => onAuthStateChanged(auth, current => { setUser(current); setAccount(null); }), []);
  useEffect(() => {
    if (!user) return;
    let active = true;
    api('/api/account', user).then(data => { if (active) setAccount(data); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [user]);
  useEffect(() => {
    if (!user || new URLSearchParams(location.search).get('payment') !== 'success') return;
    let attempts = 0;
    const timer = setInterval(() => {
      if (++attempts > 15) { clearInterval(timer); return; }
      void api('/api/account', user).then(setAccount).catch(() => {});
    }, 2000);
    return () => clearInterval(timer);
  }, [user]);
  const login = async () => {
    setLoginBusy(true); setError('');
    try { await signInWithGoogle(); }
    catch { setError('Nie udało się zalogować. Sprawdź, czy przeglądarka pozwala otworzyć okno logowania.'); }
    finally { setLoginBusy(false); }
  };
  const upload = async (file?: File) => {
    if (!file || locked) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Wybierz plik JPG, PNG lub WebP o rozmiarze do 5 MB.'); return;
    }
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file);
      });
      setOriginal(data); setResult(''); setStudioOpen(true);
    } catch { setError('Nie udało się odczytać zdjęcia. Wybierz plik ponownie.'); }
  };
  const generate = async () => { setStudioOpen(true); };
  const checkout = async (plan: string) => {
    if (!user) { await login(); return; }
    setBuyBusy(plan); setError('');
    try { const data = await api('/api/checkout', user, { plan }); location.assign(data.url); }
    catch (e: any) { setError(e.message); setBuyBusy(''); }
  };
  return <div className="site-shell">
    <div style={{display:studioOpen?'block':'none'}}>{studioStarted && <RestoredStudio account={{ credits: account?.credits || 0, totalCredits: account?.credits || 0, plan: (account?.plan || 'free') as any, apiAccess: account?.plan === 'enterprise', isAuthenticated: !!user, uid: user?.uid, email: user?.email || undefined }} initialImage={original} onClose={() => setStudioOpen(false)} onRefresh={() => { if(user) void api('/api/account', user).then(setAccount); else void loadTrial(); }} />}</div>
    <header className="site-header">
      <a href="#" className="wordmark" aria-label="AparatAI — strona główna"><span className="logo-mark"><Camera size={19} /></span>APARAT <span>AI</span><small>.pl</small></a>
      <nav aria-label="Nawigacja główna"><a href="#jak-to-dziala">Jak to działa</a><a href="#pakiety">Pakiety</a><button className="button button-outline" onClick={() => setStudioOpen(true)}>Otwórz studio</button><button className="button button-quiet" disabled={loginBusy || busy} onClick={() => user ? logOut() : login()}>{user ? 'Wyloguj' : loginBusy ? 'Logowanie…' : 'Zaloguj się'}</button></nav>
    </header>
    {localPreview && <div className="preview-notice" role="status">Podgląd lokalny: generowanie AI i płatności są wyłączone. Wynik testu pokazuje przesłane zdjęcie.</div>}
    <main>
      <section className="camera-hero" aria-label="Aparat AI — interaktywny wizjer">
        <div className="camera-topline"><span><i className="blue-led" /> APARAT AI / STUDIO PRODUKTOWE</span><span>FOTOGRAFIA DLA SKLEPÓW INTERNETOWYCH</span></div>
        <div className="camera-body">
          <div className="body-screw screw-one" /><div className="body-screw screw-two" />
          <div className="camera-display">
            <div className="display-grid" /><div className="display-scan" />
            <div className="viewfinder-corner corner-tl" /><div className="viewfinder-corner corner-tr" /><div className="viewfinder-corner corner-bl" /><div className="viewfinder-corner corner-br" />
            <div className="display-top"><span><i className="blue-led" /> {busy ? 'WYWOŁYWANIE' : result ? 'UJĘCIE WYWOŁANE' : original ? 'PRODUKT W KADRZE' : 'GOTOWY DO UJĘCIA'}</span><span className="display-mode">FOTO <b>AI</b></span><span className="battery-icon" aria-label="Stan aparatu: aktywny"><i /><i /><i /></span></div>
            {original ? <div className="display-photo"><img src={result || original} alt={result ? 'Podgląd wywołanego ujęcia w wizjerze aparatu' : 'Twój produkt w wizjerze aparatu'} /><div className="focus-reticle"><Crosshair size={37} /></div>{busy && <div className="processing-overlay"><span className="spinner" /><strong>Wywoływanie ujęcia…</strong></div>}</div> : <div className="lens-scene">
              <div className="camera-title"><p>PROFESJONALNE STUDIO W TWOICH RĘKACH</p><h1>APARAT <em>AI</em></h1></div>
              <button className="lens-button" aria-label="Wgraj zdjęcie do aparatu" disabled={locked} onClick={() => fileRef.current?.click()}>
                <span className="lens-ring ring-outer" /><span className="lens-ring ring-middle" /><span className="lens-ring ring-inner" /><span className="lens-glass"><Camera size={47} strokeWidth={1.4} /><span className="glass-glint" /></span>
                <span className="lens-inscription inscription-top">APARAT AI · PRODUCT STUDIO</span><span className="lens-inscription inscription-bottom">TWÓJ PRODUKT. TWÓJ KADR.</span>
              </button>
              <p className="lens-help">Zwykłe zdjęcie z telefonu.<br /><span>Nowe tło, światło i aranżacja.</span></p>
            </div>}
            <div className="display-bottom"><span><Crosshair size={13} /> {backgrounds.find(bg => bg.id === scene)?.name.toUpperCase()}</span><span>FORMAT 1:1</span><span>{user ? account ? `${account.credits} UJĘĆ` : 'KONTO…' : trial === 'available' ? '01 / 01 · DARMOWY TEST' : trial === 'loading' ? 'SPRAWDZANIE…' : '00 / 01 · TEST WYKORZYSTANY'}</span></div>
          </div>
          <aside className="camera-grip" aria-label="Przyciski aparatu">
            <div className="grip-ridges" />
            <button className="camera-power" title={user ? 'Wyloguj' : 'Zaloguj się'} aria-label={user ? 'Wyloguj' : 'Zaloguj się'} disabled={busy || loginBusy} onClick={() => user ? logOut() : login()}><Power size={17} /><i className="blue-led" /></button>
            <div className="control-label">ARANŻACJA</div>
            <button className="mode-dial" aria-label="Zmień aranżację" disabled={busy} onClick={() => setStudioOpen(true)}><span className="dial-notch" /><Aperture size={31} /><span>{scene === 'white' ? 'STUDIO' : scene === 'beige' ? 'NATURAL' : 'PREMIUM'}</span></button>
            {result ? <a className="camera-control" href={result} download={result.startsWith('data:image/jpeg') ? 'aparatai-produkt.jpg' : 'aparatai-produkt.png'}><Download size={20} /><span>POBIERZ</span></a> : <button className="camera-control" disabled={locked} onClick={() => fileRef.current?.click()}><ImagePlus size={20} /><span>WGRAJ</span></button>}
            <button className="camera-control" onClick={() => setStudioOpen(true)}><SlidersHorizontal size={20} /><span>USTAWIENIA</span></button>
            <div className="control-label shutter-label">SPUST MIGAWKI</div>
            <button className="shutter-button" aria-label={original ? 'Wywołaj zdjęcie produktu' : 'Wybierz zdjęcie produktu'} disabled={locked || (!!original && !!user && (!account || account.credits < 1))} onClick={() => original ? generate() : fileRef.current?.click()}><span><Camera size={25} /></span></button>
            <span className="grip-brand">APARAT<span>AI</span></span>
          </aside>
        </div>
        <div className="camera-below"><span><i className="blue-led" /> 1 DARMOWE UJĘCIE · BEZ KONTA I KARTY</span><button className="text-button" onClick={() => setStudioOpen(true)}>OTWÓRZ PANEL WYWOŁYWANIA ↓</button></div>
      </section>
      <section id="jak-to-dziala" className="steps-section"><p className="eyebrow">INSTRUKCJA APARATU</p><div className="steps">{[['01', 'Wprowadź produkt do kadru', 'Wgraj wyraźne zdjęcie z telefonu, z całym produktem w kadrze.'], ['02', 'Ustaw scenę i światło', 'Otwórz studio: wybierz tło, światło, prezentację, kąt, format i jakość.'], ['03', 'Wywołaj i pobierz ujęcie', 'Naciśnij spust, porównaj zdjęcia i sprawdź szczegóły przed publikacją.']].map(([n, title, text]) => <article key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
      <section className="trial-section" id="test" ref={editorRef}>
        <div className="section-title"><div><p className="eyebrow">CIEMNIA AI / PANEL WYWOŁYWANIA</p><h2>{user ? 'Twoja sesja produktowa.' : 'Twoje pierwsze ujęcie.'}</h2></div><span className="count-pill">{user ? account ? `${account.credits} zdjęć na koncie` : 'Ładowanie konta…' : '1 bezpłatne zdjęcie'}</span></div>
        {user && <p className="account-label">{user.email}</p>}
        <div className="editor-layout"><div className="image-pane">
          {!original ? <div className="upload-zone" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); void upload(e.dataTransfer.files[0]); }}><span className="upload-icon" aria-hidden="true">↑</span><h3>Tu zaczyna się Twoje zdjęcie</h3><p>Wybierz plik lub przeciągnij go tutaj.</p><button className="button button-outline" disabled={locked} onClick={() => fileRef.current?.click()}>Wybierz zdjęcie</button><small>JPG, PNG, WebP · do 5 MB</small></div> : <div className="comparison"><img src={result || original} alt={result ? 'Produkt po zmianie tła i światła' : 'Twoje oryginalne zdjęcie produktu'} />{result && <><img className="before-image" style={{ clipPath: `inset(0 ${100 - compare}% 0 0)` }} src={original} alt="Oryginalne zdjęcie przed obróbką" /><div className="compare-divider" style={{ left: `${compare}%` }} /><span className="image-badge before-badge">Przed</span><span className="image-badge after-badge">{localPreview ? 'Podgląd' : 'Po'}</span></>}{busy && <div className="processing-overlay" role="status"><span className="spinner" /><strong>Przygotowujemy Twoją aranżację…</strong><p>Pozostaw tę stronę otwartą.</p></div>}</div>}
          <input type="file" ref={fileRef} accept="image/jpeg,image/png,image/webp" hidden onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
          {result && <div className="compare-control"><label htmlFor="compare">Porównaj przed i po</label><input id="compare" type="range" min="0" max="100" value={compare} onChange={e => setCompare(Number(e.target.value))} /></div>}
          {original && !locked && <button className="text-button" onClick={() => fileRef.current?.click()}>Wybierz inne zdjęcie</button>}
        </div><div className="editor-controls"><h3>Pełny proces fotografii produktu</h3><p>15 teł, 4 ustawienia światła, 6 sposobów prezentacji, kąt widzenia, format, jakość oraz własne korekty. Wszystkie ustawienia znajdziesz w studiu.</p>
          <button className="button button-primary generate-button" disabled={!original || locked || (!!user && (!account || account.credits < 1))} onClick={generate}>{busy ? 'Tworzenie ujęcia…' : user ? 'Stwórz zdjęcie · 1 kredyt' : 'Przerób zdjęcie bezpłatnie'}</button>
          {!user && trial === 'loading' && <p role="status">Sprawdzamy dostępność testu…</p>}
          {!user && trial === 'unavailable' && <p role="status">Test jest chwilowo niedostępny. <button className="text-button" onClick={loadTrial}>Sprawdź ponownie</button></p>}
          {!user && ['processing', 'succeeded', 'failed'].includes(trial) && <div className="trial-used" role="status"><strong>{trial === 'failed' ? 'Test nie został ukończony.' : trial === 'processing' ? 'Test z tej sieci jest w trakcie.' : 'Darmowy test został wykorzystany.'}</strong><p>{trial === 'failed' ? 'Nie ponawiamy automatycznie generowania. Zachowaj numer zgłoszenia z komunikatu błędu.' : 'Limit obejmuje jedną próbę z danej sieci. Zaloguj się, aby korzystać z pakietów.'}</p><button className="button button-outline" disabled={loginBusy} onClick={login}>Przejdź do konta</button></div>}
          {result && <a className="button button-outline download-button" href={result} download={result.startsWith('data:image/jpeg') ? 'aparatai-produkt.jpg' : 'aparatai-produkt.png'}>Pobierz {localPreview ? 'podgląd' : 'zdjęcie'}</a>}
          <p className="editor-note">{user ? 'Nieudana generacja zwraca kredyt na konto.' : 'Jedna próba na sieć. Odświeżenie strony nie odnawia limitu.'} Po wgraniu AI rozpoznaje produkt. Nowe zdjęcie powstaje po kliknięciu przycisku generowania. Sprawdź etykietę, kolor i kształt produktu przed publikacją.</p>
        </div></div>{error && <div className="error-message" role="alert">{error}</div>}
      </section>
      <section id="pakiety" className="packages-section"><p className="eyebrow">ZDJĘCIA W TWOIM TEMPIE</p><h2>Gotowy na cały katalog?</h2><p>Przetestuj jedno zdjęcie. Pakiety pozwalają tworzyć kolejne aranżacje z własnego konta.</p>
        {plans.length ? <div className="plan-grid">{plans.map(plan => <article className="plan-card" key={plan.id}><h3>{plan.id === 'starter' ? 'Na start' : 'Dla sklepu'}</h3><strong>{plan.credits} zdjęć</strong><p>{new Intl.NumberFormat('pl-PL', { style: 'currency', currency: plan.currency.toUpperCase() }).format(plan.amount / 100)}</p><button className="button button-primary" disabled={!!buyBusy || loginBusy || (!!user && !account)} onClick={() => checkout(plan.id)}>{buyBusy === plan.id ? 'Przejście do płatności…' : user ? 'Kup pakiet' : 'Zaloguj się, aby kupić'}</button><small>Jednorazowy zakup · bez abonamentu</small></article>)}</div> : <div className="launch-note">Sprzedaż pakietów jest w przygotowaniu. Ceny pojawią się tutaj po uruchomieniu płatności.</div>}
      </section>
      <section className="faq-section"><h2>Przed pierwszym zdjęciem</h2>{[
        ['Czy muszę mieć konto?', 'Darmowy test jednego zdjęcia działa bez konta i karty. Konto jest potrzebne do zakupu i korzystania z pakietów.'],
        ['Jakie zdjęcie najlepiej wgrać?', 'Wyraźne, z całym produktem w kadrze. Tło nie musi być studyjne. Rozmycie, zasłonięta etykieta i brakujące części produktu mogą pogorszyć wynik.'],
        ['Czy AI może zmienić produkt?', 'AI może popełnić błąd. Zawsze porównaj wynik z oryginałem, szczególnie napisy, logo, kolor i proporcje.'],
        ['Dlaczego test jest już wykorzystany?', 'Darmowy test jest przypisany do sieci. Osoby korzystające z tego samego Wi-Fi mogą dzielić limit. Zmiana karty przeglądarki ani odświeżenie nie odnawia próby.'],
        ['Co dzieje się ze zdjęciem?', 'Przed generowaniem podgląd jest lokalny. Po kliknięciu zdjęcie trafia na serwer i do dostawcy AI. Ta wersja nie zapisuje zdjęć w galerii; pobierz wynik przed zamknięciem strony.'],
      ].map(([q, a]) => <details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</section>
    </main><footer className="site-footer"><a className="wordmark" href="#">aparat<span>ai</span><small>.pl</small></a><p>Zdjęcia i aranżacje dla sklepów internetowych.</p><a href="https://www.tiktok.com/@aparatai.pl" target="_blank" rel="noreferrer">Zobacz AparatAI na TikToku ↗</a></footer>
  </div>;
}
