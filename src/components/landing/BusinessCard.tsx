import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Tenant } from "@/types";

interface BusinessCardProps {
  tenant: Tenant;
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  clinic: "Clinic",
  spa: "Spa",
  salon: "Salon",
  restaurant: "Restaurant",
  hotel: "Hotel",
  swimming_pool: "Swimming Pool",
  gym: "Gym",
  court: "Court / Sports",
  transport: "Transport",
  playground: "Playground",
  other: "Other",
};

export function BusinessCard({ tenant }: BusinessCardProps) {
  const coverImage = tenant.themeConfig.images?.[0] ?? null;

  return (
    <Link href={`/${tenant.slug}`} className="group block">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        {/* Cover image */}
        <div className="relative h-44 bg-gradient-to-br from-blue-100 to-indigo-200">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={tenant.businessName}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-5xl font-bold text-blue-300">
                {tenant.businessName.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute left-3 top-3">
            <Badge variant="info">
              {BUSINESS_TYPE_LABELS[tenant.businessType] ?? tenant.businessType}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-1">
              {tenant.businessName}
            </h3>
          </div>

          <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
            <MapPin size={14} className="shrink-0" />
            <span className="line-clamp-1">
              {tenant.address.city}, {tenant.address.country}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <span className="text-xs text-blue-600 font-medium">
              Book now →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
