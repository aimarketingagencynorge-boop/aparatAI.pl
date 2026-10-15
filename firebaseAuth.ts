import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import firebaseConfig from './firebase-applet-config.json';
import { prepareLoginWorkspace } from './services/loginWorkspace';
const ownDomain=location.hostname==='www.aparatai.pl';
const app = getApps()[0] || initializeApp({...firebaseConfig,...(ownDomain?{authDomain:'www.aparatai.pl'}:{})});
export const auth = getAuth(app);
export const finishGoogleSignIn = () => getRedirectResult(auth);
export const signInWithGoogle = async () => {
  const provider=new GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  if(ownDomain){
    try {await prepareLoginWorkspace();} catch {throw {code:'auth/workspace-save-failed'};}
    return signInWithRedirect(auth,provider);
  }
  return signInWithPopup(auth,provider);
};
export const logOut = () => signOut(auth);
