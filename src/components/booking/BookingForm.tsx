"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { calculateBookingTotal } from "@/lib/utils/booking";
import { useAuthStore } from "@/store/auth";
import type { Service, ServiceSlot, Inventory, Tenant } from "@/types";
import { Zap } from "lucide-react";

const bookingSchema = z.object({
  phone: z.string().min(6, "Phone number required"),
  userNote: z.string().max(500, "Max 500 characters").optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  service: Service;
  tenant: Tenant;
  selectedSlots: ServiceSlot[];
  inventories: Inventory[];
  tenantId: string;
  onSuccess: (bookingId: string) => void;
  onCancel: () => void;
}

export function BookingForm({
  service,
  tenant,
  selectedSlots,
  inventories,
  tenantId,
  onSuccess,
  onCancel,
}: BookingFormProps) {
  const { appUser, firebaseUser } = useAuthStore();
  const [selectedInventories, setSelectedInventories] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { phone: appUser?.phoneNumber ?? "" },
  });

  const allowedInventories = inventories.filter((inv) =>
    (service.allowedInventories ?? []).includes(inv.id)
  );

  const inventoryItems = allowedInventories.map((inv) => ({
    inventory: inv,
    qty: selectedInventories[inv.id] ?? 0,
  }));

  // Total = sum of (base + rush) over all slots + add-ons
  const slotTotal = selectedSlots.reduce(
    (sum, s) => sum + service.basePrice + (s.rushHourCharge ?? 0),
    0
  );
  const addOnTotal = inventoryItems
    .filter((i) => i.qty > 0)
    .reduce((sum, { inventory, qty }) => sum + inventory.price * qty, 0);
  const total = slotTotal + addOnTotal;

  const firstSlot = selectedSlots[0];
  const lastSlot = selectedSlots[selectedSlots.length - 1];

  const onSubmit = async (data: BookingFormData) => {
    if (!selectedSlots.length) {
      toast.error("No slots selected");
      return;
    }
    if (!firebaseUser) return;

    setLoading(true);
    try {
      // Send timestamps as plain seconds (avoids Timestamp serialization issues)
      const body = {
        tenantId,
        serviceId: service.id,
        serviceSlotIds: selectedSlots.map((s) => s.serviceSlotId),
        // Use the first slot's ID as primary slot reference for capacity
        serviceSlotId: firstSlot.serviceSlotId,
        userId: firebaseUser.uid,
        customerSnapshot: {
          displayName: appUser?.displayName ?? firebaseUser.displayName ?? "",
          email: firebaseUser.email ?? "",
          phone: data.phone,
        },
        startTimeSeconds: firstSlot.startTime.seconds,
        endTimeSeconds: lastSlot.endTime.seconds,
        selectedInventories: Object.entries(selectedInventories)
          .filter(([, qty]) => qty > 0)
          .map(([inventoryId, qty]) => ({
            inventoryId,
            qty,
            priceAtBooking: inventories.find((i) => i.id === inventoryId)?.price ?? 0,
          })),
        totalAmount: total,
        userNote: data.userNote ?? "",
        assignedResourceIds: [],
      };

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error ?? "Booking failed");
      }

      const { bookingId } = await response.json();
      onSuccess(bookingId);
    } catch (error: any) {
      toast.error(error.message ?? "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900">{service.name}</h3>
        <p className="text-sm text-gray-500">
          {tenant.settings.currency} {service.basePrice.toFixed(2)} base price
        </p>
      </div>

      {/* Selected slots summary */}
      <div className="rounded-lg bg-blue-50 p-4 space-y-1.5">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
          {selectedSlots.length} slot{selectedSlots.length !== 1 ? "s" : ""} selected
        </p>
        {selectedSlots.map((slot) => {
          const start = slot.startTime.toDate();
          const end = slot.endTime.toDate();
          return (
            <div key={slot.serviceSlotId} className="flex items-center justify-between text-sm">
              <span className="text-blue-900 font-medium">
                {format(start, "EEE, MMM d")} · {format(start, "HH:mm")}–{format(end, "HH:mm")}
              </span>
              <span className="text-blue-700">
                {tenant.settings.currency}{" "}
                {(service.basePrice + (slot.rushHourCharge ?? 0)).toFixed(2)}
                {slot.rushHourCharge > 0 && (
                  <span className="ml-1 inline-flex items-center gap-0.5 text-xs text-orange-500">
                    <Zap size={10} />
                    Rush
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* Add-on inventories */}
      {allowedInventories.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-gray-700">Add-ons (optional)</h4>
          <div className="space-y-2">
            {allowedInventories.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{inv.name}</p>
                  <p className="text-xs text-gray-500">
                    {tenant.settings.currency} {inv.price.toFixed(2)} each
                    {inv.stockType === "finite" && ` · ${inv.remainingStock} left`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedInventories((prev) => ({
                        ...prev,
                        [inv.id]: Math.max(0, (prev[inv.id] ?? 0) - 1),
                      }))
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-full border text-sm hover:bg-gray-100"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-medium">
                    {selectedInventories[inv.id] ?? 0}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedInventories((prev) => ({
                        ...prev,
                        [inv.id]: Math.min(
                          inv.stockType === "finite" ? inv.remainingStock : 99,
                          (prev[inv.id] ?? 0) + 1
                        ),
                      }))
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-full border text-sm hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact details + submit */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Phone"
          type="tel"
          placeholder="+63 912 345 6789"
          error={errors.phone?.message}
          required
          {...register("phone")}
        />
        <Textarea
          label="Note (optional)"
          placeholder="Any special requests…"
          {...register("userNote")}
        />

        {/* Total breakdown */}
        <div className="rounded-lg bg-gray-50 p-4 space-y-1">
          {selectedSlots.map((slot) => (
            <div key={slot.serviceSlotId} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {format(slot.startTime.toDate(), "MMM d HH:mm")}
                {slot.rushHourCharge > 0 && " (Rush)"}
              </span>
              <span>
                {tenant.settings.currency}{" "}
                {(service.basePrice + (slot.rushHourCharge ?? 0)).toFixed(2)}
              </span>
            </div>
          ))}
          {inventoryItems
            .filter((i) => i.qty > 0)
            .map(({ inventory, qty }) => (
              <div key={inventory.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{inventory.name} ×{qty}</span>
                <span>
                  {tenant.settings.currency} {(inventory.price * qty).toFixed(2)}
                </span>
              </div>
            ))}
          <div className="flex items-center justify-between border-t pt-2 font-semibold">
            <span>Total</span>
            <span>
              {tenant.settings.currency} {total.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Confirm Booking
          </Button>
        </div>
      </form>
    </div>
  );
}
