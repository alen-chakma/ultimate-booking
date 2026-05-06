"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTenantBySlug, getAllBookings, updateBooking } from "@/lib/firebase/firestore";
import { BookingTable } from "@/components/admin/BookingTable";
import { Skeleton } from "@/components/ui/Skeleton";
import toast from "react-hot-toast";

interface Props {
  params: { slug: string };
}

export default function AdminBookingsPage({ params }: Props) {
  const queryClient = useQueryClient();

  const { data: tenant } = useQuery({
    queryKey: ["tenant", params.slug],
    queryFn: () => getTenantBySlug(params.slug),
  });

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings", tenant?.tenantId],
    queryFn: () => getAllBookings(tenant!.tenantId),
    enabled: !!tenant,
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant!.tenantId }),
      });
      if (!res.ok) throw new Error("Cancel failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      toast.success("Booking cancelled");
    },
    onError: () => toast.error("Cancel failed"),
  });

  const confirmMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await updateBooking(tenant!.tenantId, bookingId, { status: "confirmed" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      toast.success("Booking confirmed");
    },
  });

  if (!tenant) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage and review all customer bookings.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <BookingTable
          bookings={bookings ?? []}
          tenant={tenant}
          onCancel={(id) => cancelMutation.mutate(id)}
          onConfirm={(id) => confirmMutation.mutate(id)}
        />
      )}
    </div>
  );
}
