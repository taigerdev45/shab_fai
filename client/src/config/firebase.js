import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache,
  getFirestore
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Singleton pour l'application Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CONFIGURATION AVANCÉE AVEC MISE EN CACHE PERSISTANTE :
// On active la persistance sur disque (IndexedDB) pour permettre le mode hors-ligne
// et accélérer le chargement initial en utilisant les données locales.
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache(),
    experimentalForceLongPolling: true
  });
} catch {
  db = getFirestore(app);
}

export { db };
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;