"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/store/auth";
import type { OnboardingFormData, BusinessType } from "@/types";

// Step components
import { BusinessInfoStep } from "./steps/BusinessInfoStep";
import { LocationStep } from "./steps/LocationStep";
import { ThemeStep } from "./steps/ThemeStep";
import { ReviewStep } from "./steps/ReviewStep";

const STEPS = ["Business Info", "Location", "Branding", "Review"];

export function OnboardingWizard() {
  const router = useRouter();
  const { firebaseUser, appUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<OnboardingFormData>>({
    settings: { currency: "PHP", timezone: "Asia/Manila" },
    themeConfig: {
      primaryColor: "#2563eb",
      logoUrl: "",
      bannerUrl: "",
      fontFamily: "Inter",
      images: [],
    },
  });

  const updateData = (data: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          ownerEmail: firebaseUser.email,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error ?? "Failed to create business");
      }

      const { slug } = await response.json();
      toast.success("Business page created!");
      router.push(`/${slug}/admin`);
    } catch (error: any) {
      toast.error(error.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress bar */}
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((label, idx) => (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                      idx < step
                        ? "bg-green-500 text-white"
                        : idx === step
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    )}
                  >
                    {idx < step ? <Check size={16} /> : idx + 1}
                  </div>
                  <span
                    className={cn(
                      "mt-1 hidden text-xs sm:block",
                      idx === step ? "font-medium text-gray-900" : "text-gray-400"
                    )}
                  >
                    {label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 h-0.5 w-12 sm:w-24 transition-colors",
                      idx < step ? "bg-green-500" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          {step === 0 && (
            <BusinessInfoStep
              defaultValues={formData}
              onNext={(data) => {
                updateData(data);
                next();
              }}
            />
          )}
          {step === 1 && (
            <LocationStep
              defaultValues={formData}
              onNext={(data) => {
                updateData(data);
                next();
              }}
              onBack={back}
            />
          )}
          {step === 2 && (
            <ThemeStep
              defaultValues={formData}
              onNext={(data) => {
                updateData(data);
                next();
              }}
              onBack={back}
            />
          )}
          {step === 3 && (
            <ReviewStep
              data={formData as OnboardingFormData}
              onSubmit={submit}
              onBack={back}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
