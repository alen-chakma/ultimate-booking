import { create } from "zustand";
import { User } from "firebase/auth";
import type { AppUser } from "@/types";

interface AuthState {
  firebaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  initialized: boolean;
  setFirebaseUser: (user: User | null) => void;
  setAppUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  appUser: null,
  loading: true,
  initialized: false,
  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setAppUser: (user) => set({ appUser: user }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  reset: () =>
    set({ firebaseUser: null, appUser: null, loading: false, initialized: true }),
}));
