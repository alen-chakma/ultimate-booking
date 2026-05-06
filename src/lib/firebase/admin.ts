import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";
import { getStorage, Storage } from "firebase-admin/storage";

let adminApp: App;
let adminDb: Firestore;
let adminAuth: Auth;
let adminStorage: Storage;

function getAdminApp(): App {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === "true";

  if (useEmulators) {
    process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
    process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = "localhost:9199";
    adminApp = initializeApp({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "demo-ultimate-booking",
    });
  } else {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n"
    );

    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
        privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  return adminApp;
}

export function getAdminFirebase() {
  const app = getAdminApp();

  if (!adminDb) adminDb = getFirestore(app);
  if (!adminAuth) adminAuth = getAuth(app);
  if (!adminStorage) adminStorage = getStorage(app);

  return { app, db: adminDb, auth: adminAuth, storage: adminStorage };
}

export { adminDb, adminAuth, adminStorage };
