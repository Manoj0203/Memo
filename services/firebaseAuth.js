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
  apiKey: "AIFKSKnQM",
  authDomain: "concom",
  projectId: "c",
  storageBucket: "ce.app",
  messagingSenderId: "24",
  appId: "1:d5521",
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
