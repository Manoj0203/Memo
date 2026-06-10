// firebaseAuth.js

import { initializeApp, getApps, getApp } from "firebase/app";

import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from "firebase/auth";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDzywwaAKQUI3IwqyVK03-lNk2RFKSKnQM",
  authDomain: "connect-9cd26.firebaseapp.com",
  projectId: "connect-9cd26",
  storageBucket: "connect-9cd26.firebasestorage.app",
  messagingSenderId: "264923450484",
  appId: "1:264923450484:web:e9767812d97fbe81fd5521",
};

let app;
let auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);

  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} else {
  app = getApp();
  auth = getAuth(app);
}

export { auth };

export const db = getFirestore(app);

export const storage = getStorage(app);