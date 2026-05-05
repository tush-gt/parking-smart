import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "parking-smart-6ef82.firebaseapp.com",
  projectId: "parking-smart-6ef82",
  storageBucket: "parking-smart-6ef82.firebasestorage.app",
  messagingSenderId: "381494004880",
  appId: "1:381494004880:web:eb8bf82c77e82996941c15"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
