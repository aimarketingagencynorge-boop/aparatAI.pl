
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, increment } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Auth Helpers
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logOut = () => signOut(auth);

// Firestore Helpers
export const getUserDoc = async (uid: string) => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

export const createUserDoc = async (uid: string, email: string) => {
  const docRef = doc(db, 'users', uid);
  const isOwner = email === 'aimarketingagencynorge@gmail.com';
  const userData = {
    uid,
    email,
    plan: isOwner ? 'enterprise' : 'free',
    credits: isOwner ? 9999 : 20,
    totalCredits: isOwner ? 9999 : 20,
    createdAt: new Date().toISOString()
  };
  await setDoc(docRef, userData);
  return userData;
};

export const useCredits = async (uid: string) => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    if (data.plan === 'enterprise') return true;
    if (data.credits > 0) {
      await updateDoc(docRef, {
        credits: increment(-1)
      });
      return true;
    }
  }
  return false;
};
