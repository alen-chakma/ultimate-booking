"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar, AlertTriangle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { useUserBookings, useCancelBooking } from "@/hooks/useBookings";
import { calculateCancellationPolicy, getPolicyDescription } from "@/lib/utils/cancellation";
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from "@/lib/utils/booking";
import type { Booking, Tenant } from "@/types";

interface UserBookingsProps {
  tenantId: string;
  tenant: Tenant;
}

export function UserBookings({ tenantId, tenant }: UserBookingsProps) {
  const { data: bookings, isLoading } = useUserBookings(tenantId);
  const cancelMutation = useCancelBooking(tenantId);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (!bookings?.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center">
        <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">No bookings yet.</p>
      </div>
    );
  }

  const policyInfo = cancelBooking
    ? calculateCancellationPolicy(cancelBooking.startTime.toDate())
    : null;

  return (
    <>
      <div className="space-y-4">
        {bookings.map((booking) => {
          const startDate = booking.startTime.toDate();
          const endDate = booking.endTime.toDate();
          const canCancel =
            booking.status === "confirmed" || booking.status === "pending";

          return (
            <Card key={booking.bookingId}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-400">
                      #{booking.bookingId.slice(0, 8).toUpperCase()}
                    </span>
                    <Badge
                      className={
                        BOOKING_STATUS_COLORS[booking.status] ??
                        "bg-gray-100 text-gray-800"
                      }
                    >
                      {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                    </Badge>
                  </div>

                  <p className="text-sm font-medium text-gray-900">
                    {format(startDate, "EEE, MMMM d, yyyy")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(startDate, "h:mm a")} – {format(endDate, "h:mm a")}
                  </p>

                  {booking.selectedInventories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {booking.selectedInventories.map((inv) => (
                        <Badge key={inv.inventoryId} variant="gray">
                          {inv.inventoryId} ×{inv.qty}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-right space-y-2">
                  <p className="font-semibold text-gray-900">
                    {tenant.settings.currency}{" "}
                    {booking.totalAmount.toFixed(2)}
                  </p>
                  {canCancel && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setCancelBooking(booking)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Cancel confirmation modal */}
      <Modal
        isOpen={!!cancelBooking}
        onClose={() => setCancelBooking(null)}
        title="Cancel Booking"
        size="sm"
      >
        {cancelBooking && policyInfo && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-yellow-50 p-4">
              <AlertTriangle
                size={20}
                className="mt-0.5 shrink-0 text-yellow-600"
              />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Cancellation Policy</p>
                <p className="mt-1">{policyInfo.message}</p>
              </div>
            </div>

            <div className="space-y-1 text-sm text-gray-500">
              <p className="font-medium text-gray-700">Refund tiers:</p>
              {getPolicyDescription().map((line) => (
                <p key={line}>• {line}</p>
              ))}
            </div>

            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <div className="flex justify-between">
                <span>Total paid</span>
                <span>
                  {tenant.settings.currency}{" "}
                  {cancelBooking.totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-green-700 mt-1">
                <span>Refund ({policyInfo.refundPercentage}%)</span>
                <span>
                  {tenant.settings.currency}{" "}
                  {(
                    (cancelBooking.totalAmount * policyInfo.refundPercentage) /
                    100
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCancelBooking(null)}
                className="flex-1"
              >
                Keep booking
              </Button>
              <Button
                variant="danger"
                loading={cancelMutation.isPending}
                onClick={() =>
                  cancelMutation.mutate(cancelBooking.bookingId, {
                    onSuccess: () => setCancelBooking(null),
                  })
                }
                className="flex-1"
              >
                <XCircle size={16} />
                Cancel booking
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
