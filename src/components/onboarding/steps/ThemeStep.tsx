"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { uploadImage } from "@/lib/firebase/storage";
import type { OnboardingFormData } from "@/types";

const PRESET_COLORS = [
  "#2563eb", "#7c3aed", "#db2777", "#dc2626",
  "#d97706", "#16a34a", "#0891b2", "#374151",
];

const schema = z.object({
  primaryColor: z.string().min(1),
  fontFamily: z.string(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues: Partial<OnboardingFormData>;
  tenantId?: string;  // Available after tenant creation in step 1
  onNext: (data: Partial<OnboardingFormData>) => void;
  onBack: () => void;
}

export function ThemeStep({ defaultValues, tenantId, onNext, onBack }: Props) {
  const [logoUrl, setLogoUrl] = useState(defaultValues.themeConfig?.logoUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState(defaultValues.themeConfig?.bannerUrl ?? "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      primaryColor: defaultValues.themeConfig?.primaryColor ?? "#2563eb",
      fontFamily: defaultValues.themeConfig?.fontFamily ?? "Inter",
    },
  });

  const primaryColor = watch("primaryColor");

  const uploadFile = async (
    file: File,
    type: "logo" | "banner",
    setUrl: (u: string) => void,
    setUploading: (v: boolean) => void
  ) => {
    setUploading(true);
    try {
      const path = `tenants/${tenantId ?? "onboarding"}/${type}`;
      const { fullUrl } = await uploadImage(path, file);
      setUrl(fullUrl);
    } catch {
      console.error(`Failed to upload ${type}`);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: FormData) => {
    onNext({
      themeConfig: {
        primaryColor: data.primaryColor,
        logoUrl,
        bannerUrl,
        fontFamily: data.fontFamily,
        images: defaultValues.themeConfig?.images ?? [],
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Branding</h2>
        <p className="mt-1 text-gray-500">
          Customize how your business page looks to customers.
        </p>
      </div>

      {/* Brand color */}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Brand color</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue("primaryColor", color)}
              className="h-8 w-8 rounded-full transition-all"
              style={{
                backgroundColor: color,
                boxShadow: primaryColor === color ? `0 0 0 3px white, 0 0 0 5px ${color}` : "none",
              }}
            />
          ))}
          <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-xs text-gray-400 hover:border-gray-400">
            <input
              type="color"
              className="sr-only"
              value={primaryColor}
              onChange={(e) => setValue("primaryColor", e.target.value)}
            />
            +
          </label>
        </div>
        <div
          className="mt-3 flex h-10 items-center justify-center rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: primaryColor }}
        >
          Preview button
        </div>
      </div>

      {/* Logo upload */}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Logo</p>
        <div className="flex items-start gap-4">
          {logoUrl ? (
            <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-gray-200">
              <Image src={logoUrl} alt="Logo" fill className="object-cover" />
              <button
                type="button"
                onClick={() => setLogoUrl("")}
                className="absolute right-0.5 top-0.5 rounded-full bg-white/80 p-0.5 text-red-500"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
              <span className="text-xs text-gray-400">No logo</span>
            </div>
          )}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => logoRef.current?.click()}
              disabled={uploadingLogo}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50"
            >
              {uploadingLogo ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              ) : (
                <Upload size={14} />
              )}
              {uploadingLogo ? "Uploading…" : "Upload logo"}
            </button>
            <p className="text-xs text-gray-400">
              Shown in the header. Square image recommended.
            </p>
          </div>
        </div>
        <input
          ref={logoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file, "logo", setLogoUrl, setUploadingLogo);
            e.target.value = "";
          }}
        />
      </div>

      {/* Banner upload */}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Banner image</p>
        <div className="space-y-2">
          {bannerUrl ? (
            <div className="relative h-36 w-full overflow-hidden rounded-xl border border-gray-200">
              <Image src={bannerUrl} alt="Banner" fill className="object-cover" />
              <button
                type="button"
                onClick={() => setBannerUrl("")}
                className="absolute right-2 top-2 rounded-full bg-white/80 p-1 text-red-500 shadow"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex h-28 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
              <div className="text-center">
                <p className="text-sm text-gray-400">No banner uploaded</p>
                <p className="text-xs text-gray-300">Shown as hero image on your page</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => bannerRef.current?.click()}
            disabled={uploadingBanner}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50"
          >
            {uploadingBanner ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            ) : (
              <Upload size={14} />
            )}
            {uploadingBanner ? "Uploading…" : "Upload banner"}
          </button>
        </div>
        <input
          ref={bannerRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file, "banner", setBannerUrl, setUploadingBanner);
            e.target.value = "";
          }}
        />
      </div>

      {/* Font family */}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Font family</p>
        <div className="grid grid-cols-3 gap-2">
          {["Inter", "Georgia", "Roboto Mono"].map((font) => (
            <label
              key={font}
              className="flex cursor-pointer items-center justify-center rounded-lg border p-3 text-sm transition-colors hover:bg-gray-50"
              style={{
                borderColor: watch("fontFamily") === font ? primaryColor : "#e5e7eb",
                backgroundColor: watch("fontFamily") === font ? `${primaryColor}15` : "white",
              }}
            >
              <input type="radio" className="sr-only" value={font} {...register("fontFamily")} />
              <span style={{ fontFamily: font }}>{font}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button type="submit">Next →</Button>
      </div>
    </form>
  );
}
