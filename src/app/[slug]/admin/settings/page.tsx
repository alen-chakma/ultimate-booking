"use client";

import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Upload, X } from "lucide-react";
import { getTenantBySlug, updateTenant } from "@/lib/firebase/firestore";
import { uploadImage } from "@/lib/firebase/storage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import toast from "react-hot-toast";

const MapLocationPicker = dynamic(
  () => import("@/components/onboarding/MapLocationPicker"),
  { ssr: false }
);

interface Props {
  params: { slug: string };
}

const PRESET_COLORS = [
  "#2563eb", "#7c3aed", "#db2777", "#dc2626",
  "#d97706", "#16a34a", "#0891b2", "#374151",
];

const schema = z.object({
  businessName: z.string().min(2),
  phone: z.string().min(6),
  primaryColor: z.string(),
  currency: z.string().min(1),
  timezone: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string(),
  zip: z.string(),
  country: z.string().min(1),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
});

type FormData = z.infer<typeof schema>;

export default function AdminSettingsPage({ params }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const { data: tenant } = useQuery({
    queryKey: ["tenant", params.slug],
    queryFn: () => getTenantBySlug(params.slug),
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: tenant && !initialized
      ? (() => {
          setInitialized(true);
          setLogoUrl(tenant.themeConfig.logoUrl ?? "");
          setBannerUrl(tenant.themeConfig.bannerUrl ?? "");
          return {
            businessName: tenant.businessName,
            phone: tenant.phone,
            primaryColor: tenant.themeConfig.primaryColor,
            currency: tenant.settings.currency,
            timezone: tenant.settings.timezone,
            street: tenant.address?.street ?? "",
            city: tenant.address?.city ?? "",
            state: tenant.address?.state ?? "",
            zip: tenant.address?.zip ?? "",
            country: tenant.address?.country ?? "",
            lat: tenant.address?.geo?.lat ?? 0,
            lng: tenant.address?.geo?.lng ?? 0,
          };
        })()
      : undefined,
  });

  const primaryColor = watch("primaryColor") ?? "#2563eb";
  const lat = watch("lat");
  const lng = watch("lng");

  const uploadFile = async (
    file: File,
    type: "logo" | "banner",
    setUrl: (u: string) => void,
    setUploading: (v: boolean) => void
  ) => {
    if (!tenant) return;
    setUploading(true);
    try {
      const path = `tenants/${tenant.tenantId}/${type}`;
      const { fullUrl } = await uploadImage(path, file);
      setUrl(fullUrl);
      toast.success(`${type === "logo" ? "Logo" : "Banner"} uploaded`);
    } catch {
      toast.error(`Failed to upload ${type}`);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!tenant) return;
    setLoading(true);
    try {
      await updateTenant(tenant.tenantId, {
        businessName: data.businessName,
        phone: data.phone,
        themeConfig: {
          ...tenant.themeConfig,
          primaryColor: data.primaryColor,
          logoUrl,
          bannerUrl,
        },
        settings: {
          currency: data.currency,
          timezone: data.timezone,
        },
        address: {
          street: data.street,
          city: data.city,
          state: data.state,
          zip: data.zip,
          country: data.country,
          geo: { lat: data.lat, lng: data.lng },
        },
      });
      queryClient.invalidateQueries({ queryKey: ["tenant", params.slug] });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  if (!tenant) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your business profile and preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Business Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <Input
              label="Business name"
              error={errors.businessName?.message}
              {...register("businessName")}
            />
            <Input label="Phone" {...register("phone")} />
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              <span className="font-medium">URL:</span> bookly.com/
              <strong>{tenant.slug}</strong>
              <br />
              <span className="text-xs text-gray-400">
                Slug cannot be changed after creation.
              </span>
            </div>
          </div>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
          </CardHeader>
          <div className="space-y-5">
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
                      boxShadow:
                        primaryColor === color
                          ? `0 0 0 3px white, 0 0 0 5px ${color}`
                          : "none",
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
            </div>

            {/* Logo */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Logo</p>
              <div className="flex items-start gap-4">
                {logoUrl ? (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-200">
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
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
                    <span className="text-xs text-gray-400">No logo</span>
                  </div>
                )}
                <div className="space-y-1">
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
                  <p className="text-xs text-gray-400">Shown in the header. Square image recommended.</p>
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

            {/* Banner */}
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
                      <p className="text-xs text-gray-300">Shown as hero image on your business page</p>
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
          </div>
        </Card>

        {/* Address & Location */}
        <Card>
          <CardHeader>
            <CardTitle>Address &amp; Location</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <Input label="Street address" {...register("street")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="City" {...register("city")} />
              <Input label="State / Province" {...register("state")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="ZIP / Postal code" {...register("zip")} />
              <Input label="Country" {...register("country")} />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">
                Map location
                <span className="ml-1 text-xs font-normal text-gray-400">
                  Click on the map to update the pin
                </span>
              </p>
              <div className="h-64 w-full overflow-hidden rounded-xl border border-gray-200">
                <MapLocationPicker
                  lat={lat || 14.5995}
                  lng={lng || 120.9842}
                  onLocationSelect={(newLat, newLng) => {
                    setValue("lat", newLat);
                    setValue("lng", newLng);
                  }}
                />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <Input
                  label="Latitude"
                  type="number"
                  step="any"
                  {...register("lat")}
                />
                <Input
                  label="Longitude"
                  type="number"
                  step="any"
                  {...register("lng")}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Regional Settings</CardTitle>
          </CardHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Currency code"
              placeholder="PHP"
              error={errors.currency?.message}
              {...register("currency")}
            />
            <Input
              label="Timezone"
              placeholder="Asia/Manila"
              error={errors.timezone?.message}
              {...register("timezone")}
            />
          </div>
        </Card>

        <Button type="submit" loading={loading}>
          Save Settings
        </Button>
      </form>
    </div>
  );
}
