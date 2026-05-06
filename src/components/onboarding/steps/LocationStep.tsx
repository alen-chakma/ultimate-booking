"use client";

import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { OnboardingFormData } from "@/types";

// Leaflet requires browser APIs — load only on client
const MapLocationPicker = dynamic(
  () => import("@/components/onboarding/MapLocationPicker"),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-xl bg-gray-100" /> }
);

const schema = z.object({
  street: z.string().min(1, "Street required"),
  city: z.string().min(1, "City required"),
  state: z.string(),
  zip: z.string(),
  country: z.string().min(1, "Country required"),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues: Partial<OnboardingFormData>;
  onNext: (data: Partial<OnboardingFormData>) => void;
  onBack: () => void;
}

export function LocationStep({ defaultValues, onNext, onBack }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      street: defaultValues.address?.street ?? "",
      city: defaultValues.address?.city ?? "",
      state: defaultValues.address?.state ?? "",
      zip: defaultValues.address?.zip ?? "",
      country: defaultValues.address?.country ?? "",
      lat: defaultValues.address?.geo?.lat ?? 0,
      lng: defaultValues.address?.geo?.lng ?? 0,
    },
  });

  const lat = watch("lat") ?? 0;
  const lng = watch("lng") ?? 0;

  const handleMapClick = (newLat: number, newLng: number) => {
    setValue("lat", newLat, { shouldValidate: true });
    setValue("lng", newLng, { shouldValidate: true });
  };

  const onSubmit = (data: FormData) => {
    onNext({
      address: {
        street: data.street,
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: data.country,
        geo: { lat: data.lat, lng: data.lng },
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Location</h2>
        <p className="mt-1 text-gray-500">
          Where is your business located? Click the map to set your exact coordinates.
        </p>
      </div>

      {/* Map picker */}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700 flex items-center gap-1.5">
          <MapPin size={15} />
          Pin your location
        </p>
        <div className="h-64 w-full overflow-hidden rounded-xl">
          <MapLocationPicker lat={lat} lng={lng} onLocationSelect={handleMapClick} />
        </div>
        {(lat !== 0 || lng !== 0) && (
          <p className="mt-1 text-xs text-gray-500">
            Pinned: {lat.toFixed(6)}, {lng.toFixed(6)}
          </p>
        )}
      </div>

      <Input
        label="Street address"
        error={errors.street?.message}
        required
        placeholder="123 Main Street"
        {...register("street")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="City"
          error={errors.city?.message}
          required
          placeholder="Manila"
          {...register("city")}
        />
        <Input
          label="State / Province"
          placeholder="Metro Manila"
          {...register("state")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="ZIP / Postal code" placeholder="1000" {...register("zip")} />
        <Input
          label="Country"
          error={errors.country?.message}
          required
          placeholder="Philippines"
          {...register("country")}
        />
      </div>

      {/* Manual coordinate override */}
      <details className="text-sm">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
          Enter coordinates manually
        </summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Input
            label="Latitude"
            type="number"
            step="0.000001"
            placeholder="14.5995"
            {...register("lat")}
          />
          <Input
            label="Longitude"
            type="number"
            step="0.000001"
            placeholder="120.9842"
            {...register("lng")}
          />
        </div>
      </details>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button type="submit">Next →</Button>
      </div>
    </form>
  );
}
