"use client";

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, Auth } from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  Firestore,
} from "firebase/firestore";
import {
  getStorage,
  connectStorageEmulator,
  FirebaseStorage,
} from "firebase/storage";
import { getFunctions, connectFunctionsEmulator, Functions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let functions: Functions;

function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  return app;
}

let emulatorsConnected = false;

function connectEmulators(
  authInstance: Auth,
  dbInstance: Firestore,
  storageInstance: FirebaseStorage,
  functionsInstance: Functions
) {
  if (emulatorsConnected) return;
  emulatorsConnected = true;
  connectAuthEmulator(authInstance, "http://localhost:9099", {
    disableWarnings: true,
  });
  connectFirestoreEmulator(dbInstance, "localhost", 8080);
  connectStorageEmulator(storageInstance, "localhost", 9199);
  connectFunctionsEmulator(functionsInstance, "localhost", 5001);
}

export function getClientFirebase() {
  const firebaseApp = getFirebaseApp();

  if (!auth) auth = getAuth(firebaseApp);
  if (!db) db = getFirestore(firebaseApp);
  if (!storage) storage = getStorage(firebaseApp);
  if (!functions) functions = getFunctions(firebaseApp);

  if (process.env.NEXT_PUBLIC_USE_EMULATORS === "true") {
    connectEmulators(auth, db, storage, functions);
  }

  return { app: firebaseApp, auth, db, storage, functions };
}

// Convenience exports
export { auth, db, storage, functions };
export default getFirebaseApp;
