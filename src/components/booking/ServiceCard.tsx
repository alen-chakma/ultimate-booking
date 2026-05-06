import Image from "next/image";
import { Clock, Star, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatBookingDuration } from "@/lib/utils/booking";
import type { Service, Tenant } from "@/types";

interface ServiceCardProps {
  service: Service;
  tenant: Tenant;
  onBook: (service: Service) => void;
  isAuthenticated: boolean;
}

export function ServiceCard({
  service,
  tenant,
  onBook,
  isAuthenticated,
}: ServiceCardProps) {
  const coverImage = service.images?.[0] ?? null;
  const currency = tenant.settings.currency ?? "USD";

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-100">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={service.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-blue-200">
            <Clock size={48} />
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900">{service.name}</h3>
          {service.rating > 0 && (
            <div className="flex items-center gap-1 text-sm text-yellow-600">
              <Star size={14} fill="currentColor" />
              <span>{service.rating.toFixed(1)}</span>
              <span className="text-gray-400">({service.reviewCount})</span>
            </div>
          )}
        </div>

        {service.description && (
          <p className="mt-2 text-sm text-gray-500 line-clamp-2">
            {service.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="gray">
            <Clock size={12} className="mr-1" />
            {formatBookingDuration(service.duration)}
          </Badge>
          {service.bufferTime > 0 && (
            <Badge variant="gray">
              +{formatBookingDuration(service.bufferTime)} buffer
            </Badge>
          )}
        </div>

        {/* Requirements */}
        {(service.requirements.resourceIds ?? []).length > 0 && (
          <div className="mt-3">
            <Badge variant="info">
              {service.requirements.resourceIds.length} resource(s)
            </Badge>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="text-lg font-bold text-gray-900">
            {currency} {service.basePrice.toFixed(2)}
          </div>
          <Button
            size="sm"
            onClick={() => onBook(service)}
          >
            {isAuthenticated ? "Book now" : "Sign in to book"}
          </Button>
        </div>
      </div>
    </div>
  );
}
