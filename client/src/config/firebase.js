import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  memoryLocalCache,
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

// CONFIGURATION ULTRA-STABLE POUR DÉVELOPPEMENT (Vite) :
// On désactive la persistance sur disque pour éviter les conflits multi-onglets/HMR
// et on force le Long Polling pour la stabilité des connexions.
let db;
try {
  // Tentative d'initialisation avec les paramètres optimisés
  db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
    experimentalForceLongPolling: true
  });
} catch {
  // Si déjà initialisé (HMR), on récupère l'instance existante
  db = getFirestore(app);
}

export { db };
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;