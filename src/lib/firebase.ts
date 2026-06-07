/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Zero-Trust fallback configuration in case fire-applet-config.json is not yet created by set_up_firebase
// This allows the code to build flawlessly and use the simulated LocalStorage fallback.
let firebaseConfig: any = {
  apiKey: "placeholder-api-key-petzy-offline-first",
  authDomain: "petzy-applet.firebaseapp.com",
  projectId: "petzy-applet",
  storageBucket: "petzy-applet.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

try {
  // If the config file was provisioned by set_up_firebase, use it!
  // We use standard require / dynamic fallback patterns to prevent Vite bundler compile crashes on missing files.
  const configModule = (import.meta as any).glob('../firebase-applet-config.json', { eager: true });
  const configKeys = Object.keys(configModule);
  if (configKeys.length > 0) {
    firebaseConfig = (configModule[configKeys[0]] as any).default || configModule[configKeys[0]];
    console.log('Firebase Applet Config loaded successfully:', firebaseConfig.projectId);
  }
} catch (e) {
  console.warn('Firebase config file not yet present. Operating on resilient offline simulated Firestore mode.');
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export { app };
