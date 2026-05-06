"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Search, CheckCircle, XCircle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from "@/lib/utils/booking";
import { calculateCancellationPolicy } from "@/lib/utils/cancellation";
import type { Booking, Tenant } from "@/types";

interface BookingTableProps {
  bookings: Booking[];
  tenant: Tenant;
  onCancel: (bookingId: string) => void;
  onConfirm: (bookingId: string) => void;
  loading?: boolean;
}

export function BookingTable({
  bookings,
  tenant,
  onCancel,
  onConfirm,
  loading,
}: BookingTableProps) {
  const [query, setQuery] = useState("");
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);

  const filtered = bookings.filter(
    (b) =>
      b.customerSnapshot.displayName
        .toLowerCase()
        .includes(query.toLowerCase()) ||
      b.customerSnapshot.email.toLowerCase().includes(query.toLowerCase()) ||
      b.bookingId.includes(query)
  );

  return (
    <>
      <div className="space-y-4">
        <Input
          placeholder="Search by customer name, email, or booking ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 text-left">Booking ID</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Date & Time</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No bookings found.
                  </td>
                </tr>
              ) : (
                filtered.map((booking) => {
                  const startDate = booking.startTime.toDate();
                  return (
                    <tr
                      key={booking.bookingId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        #{booking.bookingId.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {booking.customerSnapshot.displayName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {booking.customerSnapshot.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {format(startDate, "MMM d, yyyy")}
                        <br />
                        <span className="text-xs text-gray-400">
                          {format(startDate, "h:mm a")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {tenant.settings.currency}{" "}
                        {booking.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            BOOKING_STATUS_COLORS[booking.status] ??
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {BOOKING_STATUS_LABELS[booking.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewBooking(booking)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          >
                            <Eye size={16} />
                          </button>
                          {booking.status === "pending" && (
                            <button
                              onClick={() => onConfirm(booking.bookingId)}
                              className="rounded p-1 text-green-500 hover:bg-green-50"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          {(booking.status === "pending" ||
                            booking.status === "confirmed") && (
                            <button
                              onClick={() => onCancel(booking.bookingId)}
                              className="rounded p-1 text-red-500 hover:bg-red-50"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking detail modal */}
      <Modal
        isOpen={!!viewBooking}
        onClose={() => setViewBooking(null)}
        title={`Booking #${viewBooking?.bookingId.slice(0, 8).toUpperCase()}`}
        size="lg"
      >
        {viewBooking && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  Customer
                </p>
                <p className="font-medium">
                  {viewBooking.customerSnapshot.displayName}
                </p>
                <p className="text-gray-500">
                  {viewBooking.customerSnapshot.email}
                </p>
                <p className="text-gray-500">
                  {viewBooking.customerSnapshot.phone}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  Schedule
                </p>
                <p className="font-medium">
                  {format(viewBooking.startTime.toDate(), "EEE, MMM d, yyyy")}
                </p>
                <p className="text-gray-500">
                  {format(viewBooking.startTime.toDate(), "h:mm a")} –{" "}
                  {format(viewBooking.endTime.toDate(), "h:mm a")}
                </p>
              </div>
            </div>

            {viewBooking.selectedInventories.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase text-gray-400 mb-1">
                  Add-ons
                </p>
                {viewBooking.selectedInventories.map((inv) => (
                  <div key={inv.inventoryId} className="flex justify-between">
                    <span>{inv.inventoryId} ×{inv.qty}</span>
                    <span>
                      {tenant.settings.currency}{" "}
                      {(inv.priceAtBooking * inv.qty).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {viewBooking.userNote && (
              <div>
                <p className="text-xs font-medium uppercase text-gray-400 mb-1">
                  Customer Note
                </p>
                <p className="rounded-lg bg-gray-50 p-3 text-gray-700">
                  {viewBooking.userNote}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 font-semibold">
              <span>Total</span>
              <span>
                {tenant.settings.currency}{" "}
                {viewBooking.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
