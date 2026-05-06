"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBookingsByUser, updateBooking } from "@/lib/firebase/firestore";
import { useAuthStore } from "@/store/auth";
import { calculateCancellationPolicy } from "@/lib/utils/cancellation";
import { serverTimestamp, Timestamp } from "firebase/firestore";
import toast from "react-hot-toast";

export function useUserBookings(tenantId: string) {
  const { firebaseUser } = useAuthStore();

  return useQuery({
    queryKey: ["bookings", tenantId, firebaseUser?.uid],
    queryFn: () => getBookingsByUser(tenantId, firebaseUser!.uid),
    enabled: !!firebaseUser && !!tenantId,
  });
}

export function useCancelBooking(tenantId: string) {
  const queryClient = useQueryClient();
  const { firebaseUser } = useAuthStore();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error ?? "Failed to cancel booking");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", tenantId] });
      toast.success("Booking cancelled successfully.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
