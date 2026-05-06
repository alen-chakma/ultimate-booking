"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { generateSlug, slugError, isReservedSlug } from "@/lib/utils/slug";
import type { OnboardingFormData } from "@/types";

const schema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  businessType: z.enum([
    "clinic", "spa", "salon", "restaurant", "transport", "hotel",
    "swimming_pool", "playground", "gym", "court", "other",
  ]),
  phone: z.string().min(6, "Valid phone number required"),
  slug: z.string().refine((v) => !slugError(v), {
    message: "Invalid slug format",
  }).refine((v) => !isReservedSlug(v), {
    message: "This name is reserved. Please choose another.",
  }),
  currency: z.string().min(1),
  timezone: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

const BUSINESS_TYPES = [
  { value: "clinic", label: "Clinic / Medical" },
  { value: "spa", label: "Spa / Wellness" },
  { value: "salon", label: "Salon / Barbershop" },
  { value: "restaurant", label: "Restaurant / Dining" },
  { value: "hotel", label: "Hotel / Accommodation" },
  { value: "swimming_pool", label: "Swimming Pool" },
  { value: "gym", label: "Gym / Fitness" },
  { value: "court", label: "Court / Sports Facility" },
  { value: "transport", label: "Transport / Travel" },
  { value: "playground", label: "Playground / Recreation" },
  { value: "other", label: "Other" },
];

interface Props {
  defaultValues: Partial<OnboardingFormData>;
  onNext: (data: Partial<OnboardingFormData>) => void;
}

export function BusinessInfoStep({ defaultValues, onNext }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: defaultValues.businessName ?? "",
      businessType: defaultValues.businessType ?? "other",
      phone: defaultValues.phone ?? "",
      slug: defaultValues.slug ?? "",
      currency: defaultValues.settings?.currency ?? "PHP",
      timezone: defaultValues.settings?.timezone ?? "Asia/Manila",
    },
  });

  const businessName = watch("businessName");

  // Auto-generate slug from business name
  useEffect(() => {
    if (businessName && !defaultValues.slug) {
      setValue("slug", generateSlug(businessName));
    }
  }, [businessName, setValue, defaultValues.slug]);

  const onSubmit = (data: FormData) => {
    onNext({
      businessName: data.businessName,
      businessType: data.businessType as any,
      phone: data.phone,
      slug: data.slug,
      settings: { currency: data.currency, timezone: data.timezone },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Business Details</h2>
        <p className="mt-1 text-gray-500">Tell us about your business.</p>
      </div>

      <Input
        label="Business name"
        error={errors.businessName?.message}
        required
        placeholder="e.g. City Wellness Spa"
        {...register("businessName")}
      />

      <Select
        label="Business type"
        options={BUSINESS_TYPES}
        error={errors.businessType?.message}
        required
        {...register("businessType")}
      />

      <Input
        label="Phone number"
        type="tel"
        error={errors.phone?.message}
        required
        placeholder="+63 912 345 6789"
        {...register("phone")}
      />

      <div>
        <Input
          label="URL slug"
          error={errors.slug?.message}
          required
          hint="Your page will be at bookly.com/your-slug. Lowercase letters, numbers and hyphens only."
          {...register("slug")}
        />
        <p className="mt-1 text-xs text-gray-400">
          Preview: bookly.com/{watch("slug") || "your-slug"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Currency"
          error={errors.currency?.message}
          required
          placeholder="PHP"
          {...register("currency")}
        />
        <Input
          label="Timezone"
          error={errors.timezone?.message}
          required
          placeholder="Asia/Manila"
          {...register("timezone")}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit">Next →</Button>
      </div>
    </form>
  );
}
