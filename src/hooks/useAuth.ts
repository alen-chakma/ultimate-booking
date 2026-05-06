"use client";

import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { getClientFirebase } from "@/lib/firebase/client";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { upsertUser } from "@/lib/firebase/firestore";

export function useAuth() {
  const { firebaseUser, appUser, loading, initialized } = useAuthStore();
  const router = useRouter();

  function getAuth() {
    return getClientFirebase().auth;
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");
    const result = await signInWithPopup(getAuth(), provider);
    await syncSession(result.user.uid);
    return result.user;
  }

  async function signInWithFacebook() {
    const provider = new FacebookAuthProvider();
    provider.addScope("email");
    const result = await signInWithPopup(getAuth(), provider);
    await syncSession(result.user.uid);
    return result.user;
  }

  async function signInWithEmail(email: string, password: string) {
    const result = await signInWithEmailAndPassword(getAuth(), email, password);
    await syncSession(result.user.uid);
    return result.user;
  }

  async function signUpWithEmail(
    email: string,
    password: string,
    displayName: string
  ) {
    const result = await createUserWithEmailAndPassword(
      getAuth(),
      email,
      password
    );
    await updateProfile(result.user, { displayName });
    await upsertUser(result.user.uid, {
      uid: result.user.uid,
      displayName,
      email,
      phoneNumber: "",
      photoURL: "",
      role: "user",
      tenantId: null,
    });
    await syncSession(result.user.uid);
    return result.user;
  }

  async function syncSession(uid: string) {
    // Set a session cookie via API route for middleware
    try {
      const { auth } = getClientFirebase();
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      }
    } catch {
      // Non-critical: middleware will fall back to client-side auth
    }
  }

  async function logout() {
    await signOut(getAuth());
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/");
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(getAuth(), email);
  }

  const isOwnerOf = (tenantId: string) =>
    appUser?.role === "owner" && appUser.tenantId === tenantId;

  const isSuperAdmin = () => appUser?.role === "admin";

  return {
    firebaseUser,
    appUser,
    loading,
    initialized,
    isAuthenticated: !!firebaseUser,
    signInWithGoogle,
    signInWithFacebook,
    signInWithEmail,
    signUpWithEmail,
    logout,
    resetPassword,
    isOwnerOf,
    isSuperAdmin,
  };
}
