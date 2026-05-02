// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: "parking-smart-6ef82.firebaseapp.com",
  projectId: "parking-smart-6ef82",
  storageBucket: "parking-smart-6ef82.firebasestorage.app",
  messagingSenderId: "381494004880",
  appId: "1:381494004880:web:eb8bf82c77e82996941c15"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Use initializeAuth with React Native compatible persistence
// getAuth() defaults to indexedDB persistence which doesn't exist in RN
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
export default app;