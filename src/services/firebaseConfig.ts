import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// 1. App Başlatma (Singleton Kontrolü)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Firestore Başlatma (Güvenli Yöntem)
// React Native'de HMR (Hot Reload) sırasında "initializeFirestore already called" hatasını önlemek için:
const initDb = () => {
  try {
    // Standart başlatma (WebChannel transport error'ı önlemek için simple init)
    return getFirestore(app);
  } catch (error) {
    // Eğer zaten başlatılmışsa
    return getFirestore(app);
  }
};

export const db = initDb();
