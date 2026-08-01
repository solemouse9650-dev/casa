import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

/**
 * Fallback de cliente (las API keys de Firebase web son públicas).
 * Prioriza variables VITE_* del build (Vercel/local).
 */
const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD9MsiQ1VTlXNp9HLmYyCyn9ghqEHYYrrk',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'casa-a0dfc.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'casa-a0dfc',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'casa-a0dfc.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '890269158381',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    '1:890269158381:web:355ef9df227d1b451df5e4',
}

export const firebaseReady = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
)

let app: FirebaseApp
let auth: Auth
let db: Firestore
let storage: FirebaseStorage

try {
  app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
  void setPersistence(auth, browserLocalPersistence)
} catch (error) {
  console.error('[Casa] Error iniciando Firebase', error)
  app = undefined as unknown as FirebaseApp
  auth = undefined as unknown as Auth
  db = undefined as unknown as Firestore
  storage = undefined as unknown as FirebaseStorage
}

export { app, auth, db, storage }
