"use client";

import { useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import dynamic from "next/dynamic";

const MapLocationPicker = dynamic(
  () => import("@/components/onboarding/MapLocationPicker"),
  { ssr: false }
);
import { MapPin, Phone, Clock, ChevronRight, Zap } from "lucide-react";
import { format } from "date-fns";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ServiceCard } from "@/components/booking/ServiceCard";
import { BookingForm } from "@/components/booking/BookingForm";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { Modal } from "@/components/ui/Modal";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import {
  getTenantBySlug,
  getServices,
  getInventories,
  getAvailableSlots,
} from "@/lib/firebase/firestore";
import { addMonths } from "date-fns";
import type { Service, ServiceSlot, Tenant } from "@/types";

interface Props {
  params: { slug: string };
}

export default function BusinessPage({ params }: Props) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<ServiceSlot[]>([]);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);

  const { data: tenant, isLoading: tenantLoading, error: tenantError } = useQuery({
    queryKey: ["tenant", params.slug],
    queryFn: () => getTenantBySlug(params.slug),
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["services", tenant?.tenantId],
    queryFn: () => getServices(tenant!.tenantId),
    enabled: !!tenant,
  });

  const { data: inventories } = useQuery({
    queryKey: ["inventories", tenant?.tenantId],
    queryFn: () => getInventories(tenant!.tenantId),
    enabled: !!tenant,
  });

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ["slots", tenant?.tenantId, selectedService?.id],
    queryFn: () =>
      getAvailableSlots(
        tenant!.tenantId,
        selectedService!.id,
        new Date(),
        addMonths(new Date(), 3)
      ),
    enabled: !!tenant && !!selectedService,
  });

  if (tenantLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!tenant || tenantError) notFound();

  const coverImage = tenant.themeConfig.bannerUrl || tenant.themeConfig.images?.[0] || null;
  const primaryColor = tenant.themeConfig.primaryColor || "#2563eb";

  const handleServiceClick = (service: Service) => {
    setSelectedSlots([]);
    setSelectedService((prev) => (prev?.id === service.id ? null : service));
  };

  const toggleSlot = (slot: ServiceSlot) => {
    setSelectedSlots((prev) => {
      const exists = prev.find((s) => s.serviceSlotId === slot.serviceSlotId);
      return exists
        ? prev.filter((s) => s.serviceSlotId !== slot.serviceSlotId)
        : [...prev, slot];
    });
  };

  const handleBook = () => {
    if (!selectedSlots.length) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=/${params.slug}`);
      return;
    }
    setBookingOpen(true);
  };

  // Group slots by date
  const slotsByDate = (slots ?? []).reduce<Record<string, ServiceSlot[]>>((acc, slot) => {
    const date = slot.startTime.toDate();
    const key = format(date, "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  const sortedDates = Object.keys(slotsByDate).sort();

  return (
    <>
      <Navbar
        tenantSlug={params.slug}
        tenantId={tenant.tenantId}
        logoUrl={tenant.themeConfig.logoUrl}
        businessName={tenant.businessName}
        primaryColor={primaryColor}
      />

      <main>
        {/* Hero banner */}
        <div
          className="relative h-64 overflow-hidden"
          style={{ backgroundColor: primaryColor }}
        >
          {coverImage && (
            <Image
              src={coverImage}
              alt={tenant.businessName}
              fill
              className="object-cover opacity-40"
            />
          )}
          {/* Logo overlay */}
          {tenant.themeConfig.logoUrl && (
            <div className="absolute left-1/2 top-6 -translate-x-1/2">
              <div className="relative h-16 w-16 overflow-hidden rounded-full border-4 border-white shadow-lg">
                <Image
                  src={tenant.themeConfig.logoUrl}
                  alt="Logo"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
          <div className="absolute inset-0 flex items-end">
            <div className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold text-white drop-shadow-md">
                {tenant.businessName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/90">
                {tenant.address.city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {tenant.address.city}, {tenant.address.country}
                  </span>
                )}
                {tenant.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={14} />
                    {tenant.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* Services — horizontal scroll */}
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Our Services</h2>

            {servicesLoading ? (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 w-64 shrink-0 animate-pulse rounded-xl bg-gray-100" />
                ))}
              </div>
            ) : !services?.length ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
                <Clock size={36} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No services available yet.</p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
                {services.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <button
                      key={service.id}
                      onClick={() => handleServiceClick(service)}
                      className={`shrink-0 w-56 rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      {service.images?.[0] && (
                        <div className="relative mb-3 h-28 w-full overflow-hidden rounded-lg">
                          <Image
                            src={service.images[0]}
                            alt={service.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <p className={`font-semibold text-sm leading-tight ${isSelected ? "text-blue-700" : "text-gray-900"}`}>
                        {service.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {tenant.settings.currency} {service.basePrice.toFixed(2)} · {service.duration} min
                      </p>
                      {isSelected && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 font-medium">
                          <ChevronRight size={12} />
                          Pick a slot below
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Slots panel — shown when service is selected */}
          {selectedService && (
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  Available Slots — {selectedService.name}
                </h2>
                {selectedSlots.length > 0 && (
                  <button
                    onClick={handleBook}
                    className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Book {selectedSlots.length} slot{selectedSlots.length !== 1 ? "s" : ""}
                  </button>
                )}
              </div>

              {slotsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
                  ))}
                </div>
              ) : !sortedDates.length ? (
                <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center">
                  <p className="text-gray-400">No available slots at the moment.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {sortedDates.map((dateKey) => (
                    <div key={dateKey}>
                      <p className="mb-2 text-sm font-semibold text-gray-600">
                        {format(new Date(dateKey + "T00:00:00"), "EEEE, MMMM d, yyyy")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {slotsByDate[dateKey].map((slot) => {
                          const isChosen = selectedSlots.some(
                            (s) => s.serviceSlotId === slot.serviceSlotId
                          );
                          const startDate = slot.startTime.toDate();
                          const endDate = slot.endTime.toDate();
                          const hasRush = slot.rushHourCharge > 0;
                          return (
                            <button
                              key={slot.serviceSlotId}
                              onClick={() => toggleSlot(slot)}
                              className={`rounded-xl border-2 px-4 py-2.5 text-sm transition-all ${
                                isChosen
                                  ? "border-blue-500 bg-blue-600 text-white shadow-md"
                                  : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                              }`}
                            >
                              <p className="font-semibold">
                                {format(startDate, "HH:mm")} – {format(endDate, "HH:mm")}
                              </p>
                              <div className="mt-0.5 flex items-center gap-1.5">
                                <span className={`text-xs ${isChosen ? "text-blue-100" : "text-gray-400"}`}>
                                  {tenant.settings.currency}{" "}
                                  {(selectedService.basePrice + (slot.rushHourCharge ?? 0)).toFixed(2)}
                                </span>
                                {hasRush && (
                                  <span className={`flex items-center gap-0.5 text-xs font-medium ${isChosen ? "text-orange-200" : "text-orange-500"}`}>
                                    <Zap size={10} />
                                    Rush
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Location map */}
        {tenant.address?.geo?.lat && tenant.address.geo.lat !== 0 && (
          <div className="border-t bg-gray-50">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Our Location</h2>
              {tenant.address.street && (
                <p className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={15} className="text-gray-400" />
                  {tenant.address.street}, {tenant.address.city}, {tenant.address.state}{" "}
                  {tenant.address.zip}, {tenant.address.country}
                </p>
              )}
              <div className="h-72 w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                <MapLocationPicker
                  lat={tenant.address.geo.lat}
                  lng={tenant.address.geo.lng}
                  readOnly
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Booking modal */}
      <Modal
        isOpen={bookingOpen && !confirmedBookingId}
        onClose={() => setBookingOpen(false)}
        title={`Book: ${selectedService?.name ?? ""}`}
        size="xl"
      >
        {selectedService && tenant && (
          <BookingForm
            service={selectedService}
            tenant={tenant}
            selectedSlots={selectedSlots}
            inventories={inventories ?? []}
            tenantId={tenant.tenantId}
            onSuccess={(bookingId) => {
              setBookingOpen(false);
              setSelectedSlots([]);
              setConfirmedBookingId(bookingId);
            }}
            onCancel={() => setBookingOpen(false)}
          />
        )}
      </Modal>

      {/* Confirmation modal */}
      <Modal
        isOpen={!!confirmedBookingId}
        onClose={() => setConfirmedBookingId(null)}
        title="Booking Confirmed"
        size="sm"
      >
        {confirmedBookingId && (
          <BookingConfirmation
            bookingId={confirmedBookingId}
            slug={params.slug}
            onClose={() => setConfirmedBookingId(null)}
          />
        )}
      </Modal>
    </>
  );
}
