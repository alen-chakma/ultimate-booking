"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { useAuthStore } from "@/store/auth";

export default function OnboardingPage() {
  const router = useRouter();
  const { firebaseUser, loading, initialized } = useAuthStore();

  useEffect(() => {
    if (initialized && !firebaseUser) {
      router.push("/login?redirect=/onboarding");
    }
  }, [initialized, firebaseUser, router]);

  if (loading || !initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!firebaseUser) return null;

  return <OnboardingWizard />;
}
