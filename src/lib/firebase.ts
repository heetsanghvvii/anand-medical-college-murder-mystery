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

// Persistent local fallback UID if anonymous auth is restricted in Firebase console
export function getLocalUid(): string {
  const STORAGE_KEY = 'amcm_device_player_uid_v1';
  let uid = localStorage.getItem(STORAGE_KEY);
  if (!uid) {
    uid = 'player_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY, uid);
  }
  return uid;
}

// Ensure stable authentication without throwing admin-restricted-operation errors
let authPromise: Promise<User | { uid: string; isAnonymous: boolean }> | null = null;

export async function ensureAnonymousAuth(): Promise<User | { uid: string; isAnonymous: boolean }> {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  if (!authPromise) {
    authPromise = new Promise((resolve) => {
      // Check current auth state first
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
            // When anonymous authentication is restricted in Firebase Console,
            // fallback gracefully to a persistent local guest device UID
            unsubscribe();
            resolve({
              uid: getLocalUid(),
              isAnonymous: true,
            });
          }
        }
      });
    });
  }

  return authPromise;
}
