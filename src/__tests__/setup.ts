import "@testing-library/jest-dom";

// Mock Firebase modules
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({
    addScope: jest.fn(),
  })),
  FacebookAuthProvider: jest.fn().mockImplementation(() => ({
    addScope: jest.fn(),
  })),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  connectAuthEmulator: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  Timestamp: {
    fromDate: jest.fn((d: Date) => ({ toDate: () => d, _seconds: d.getTime() / 1000 })),
    now: jest.fn(() => ({ toDate: () => new Date() })),
  },
  connectFirestoreEmulator: jest.fn(),
}));

jest.mock("firebase/storage", () => ({
  getStorage: jest.fn(),
  connectStorageEmulator: jest.fn(),
}));

jest.mock("firebase/functions", () => ({
  getFunctions: jest.fn(),
  connectFunctionsEmulator: jest.fn(),
}));
