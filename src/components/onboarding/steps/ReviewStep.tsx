"use client";

import { MapPin, Palette, Building2, Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { OnboardingFormData } from "@/types";

interface Props {
  data: OnboardingFormData;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}

export function ReviewStep({ data, onSubmit, onBack, loading }: Props) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Review & Launch</h2>
        <p className="mt-1 text-gray-500">
          Everything look good? Launch your business page.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Business Info */}
        <Card className="space-y-2">
          <div className="flex items-center gap-2 text-blue-600 mb-3">
            <Building2 size={18} />
            <span className="font-semibold text-sm">Business Info</span>
          </div>
          <p className="font-semibold text-gray-900">{data.businessName}</p>
          <p className="text-sm text-gray-500 capitalize">
            {data.businessType?.replace("_", " ")}
          </p>
          <p className="text-sm text-gray-500">{data.phone}</p>
          <div className="flex items-center gap-1 text-sm text-blue-600">
            <Globe size={14} />
            bookly.com/{data.slug}
          </div>
        </Card>

        {/* Location */}
        <Card className="space-y-2">
          <div className="flex items-center gap-2 text-green-600 mb-3">
            <MapPin size={18} />
            <span className="font-semibold text-sm">Location</span>
          </div>
          <p className="text-sm text-gray-700">{data.address?.street}</p>
          <p className="text-sm text-gray-700">
            {data.address?.city}
            {data.address?.state && `, ${data.address.state}`}
          </p>
          <p className="text-sm text-gray-500">
            {data.address?.country}
            {data.address?.zip && ` ${data.address.zip}`}
          </p>
        </Card>

        {/* Theme */}
        <Card className="space-y-2">
          <div className="flex items-center gap-2 text-purple-600 mb-3">
            <Palette size={18} />
            <span className="font-semibold text-sm">Branding</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded-full"
              style={{
                backgroundColor: data.themeConfig?.primaryColor ?? "#2563eb",
              }}
            />
            <span className="text-sm text-gray-600">
              {data.themeConfig?.primaryColor}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Font: {data.themeConfig?.fontFamily ?? "Inter"}
          </p>
        </Card>

        {/* Settings */}
        <Card className="space-y-2">
          <div className="flex items-center gap-2 text-gray-600 mb-3">
            <Globe size={18} />
            <span className="font-semibold text-sm">Settings</span>
          </div>
          <p className="text-sm text-gray-700">
            Currency: {data.settings?.currency}
          </p>
          <p className="text-sm text-gray-700">
            Timezone: {data.settings?.timezone}
          </p>
        </Card>
      </div>

      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium">What happens next?</p>
        <ul className="mt-2 space-y-1 list-disc list-inside text-blue-700">
          <li>Your business page will be live at bookly.com/{data.slug}</li>
          <li>You&apos;ll be taken to the admin panel to add resources and services</li>
          <li>Customers can find and book your services immediately</li>
        </ul>
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onSubmit} loading={loading} size="lg">
          Launch My Business Page 🚀
        </Button>
      </div>
    </div>
  );
}
