"use client";

import { useEffect, ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getClientFirebase } from "@/lib/firebase/client";
import { getUser, upsertUser } from "@/lib/firebase/firestore";
import { useAuthStore } from "@/store/auth";
import { serverTimestamp } from "firebase/firestore";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setFirebaseUser, setAppUser, setLoading, setInitialized } =
    useAuthStore();

  useEffect(() => {
    const { auth } = getClientFirebase();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          let appUser = await getUser(firebaseUser.uid);
          if (!appUser) {
            // First sign-in — create the user document
            const newUser = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName ?? "",
              email: firebaseUser.email ?? "",
              phoneNumber: firebaseUser.phoneNumber ?? "",
              photoURL: firebaseUser.photoURL ?? "",
              role: "user" as const,
              tenantId: null,
            };
            await upsertUser(firebaseUser.uid, newUser);
            appUser = await getUser(firebaseUser.uid);
          }
          setAppUser(appUser);
        } catch (error) {
          console.error("Error fetching/creating user:", error);
          setAppUser(null);
        }
      } else {
        setAppUser(null);
      }

      setLoading(false);
      setInitialized(true);
    });

    return unsubscribe;
  }, [setFirebaseUser, setAppUser, setLoading, setInitialized]);

  return <>{children}</>;
}
