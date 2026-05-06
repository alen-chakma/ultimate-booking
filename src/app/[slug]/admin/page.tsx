"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTenantBySlug, getAllBookings, updateBooking } from "@/lib/firebase/firestore";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { BookingTable } from "@/components/admin/BookingTable";
import { Skeleton } from "@/components/ui/Skeleton";
import toast from "react-hot-toast";

interface Props {
  params: { slug: string };
}

export default function AdminDashboardPage({ params }: Props) {
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
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant!.tenantId }),
      });
      if (!response.ok) throw new Error("Failed to cancel");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      toast.success("Booking cancelled");
    },
    onError: () => toast.error("Failed to cancel booking"),
  });

  const confirmMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await updateBooking(tenant!.tenantId, bookingId, { status: "confirmed" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      toast.success("Booking confirmed");
    },
    onError: () => toast.error("Failed to confirm booking"),
  });

  if (!tenant) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {tenant.businessName}
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <DashboardStats
          bookings={bookings ?? []}
          currency={tenant.settings.currency}
        />
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Recent Bookings
        </h2>
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
    </div>
  );
}
