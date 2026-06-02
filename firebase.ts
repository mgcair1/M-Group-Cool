/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const isMockConfig = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('mock_api_key');

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const isMockFirebase = isMockConfig;

console.log('Firebase initialized. Mode:', isMockConfig ? 'Local Simulation (Development/Offline)' : 'Production (Live Cloud DB)');

// Simple connection tester as mandated by firebase-integration skill
import { doc, getDocFromServer } from 'firebase/firestore';
async function testConnection() {
  if (isMockConfig) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
