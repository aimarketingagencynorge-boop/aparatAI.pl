import React, { useState } from 'react';
import { signInWithGoogle } from '../firebaseAuth';
export default function Login({ onSkip }: { onLogin?: (password: string) => void; onSkip: () => void; t?: unknown }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return <main className="login-card"><h1>Zaloguj się do AparatAI</h1><p>Pakiety są przypisane do Twojego konta.</p>
    <button disabled={busy} onClick={async () => { setBusy(true); try { await signInWithGoogle(); } catch { setError('Nie udało się zalogować. Spróbuj ponownie.'); } finally { setBusy(false); } }}>Kontynuuj z Google</button>
    {error && <p role="alert">{error}</p>}<button onClick={onSkip}>Wróć do strony</button></main>;
}
