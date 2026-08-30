import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: firebaseConfigJson.projectId,
  appId: firebaseConfigJson.appId,
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
};

// Initialize Firebase App singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom database ID if provisioned
export const db = firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Ensure stable anonymous authentication
let authPromise: Promise<User> | null = null;

export async function ensureAnonymousAuth(): Promise<User> {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  if (!authPromise) {
    authPromise = new Promise<User>((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          unsubscribe();
          resolve(user);
        } else {
          try {
            const credential = await signInAnonymously(auth);
            unsubscribe();
            resolve(credential.user);
          } catch (err: unknown) {
            unsubscribe();
            console.error('Failed to sign in anonymously with Firebase Auth:', err);
            reject(err);
          }
        }
      });
    });
  }

  return authPromise;
}

export async function getCurrentUserToken(): Promise<string | null> {
  try {
    const user = auth.currentUser || (await ensureAnonymousAuth());
    if (user && typeof user.getIdToken === 'function') {
      return await user.getIdToken();
    }
  } catch (err) {
    console.error('Error fetching Firebase ID token:', err);
  }
  return null;
}
