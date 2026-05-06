import { CheckCircle, Calendar, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface BookingConfirmationProps {
  bookingId: string;
  slug: string;
  onClose: () => void;
}

export function BookingConfirmation({
  bookingId,
  slug,
  onClose,
}: BookingConfirmationProps) {
  return (
    <div className="text-center py-4 space-y-4">
      <div className="flex justify-center">
        <CheckCircle size={56} className="text-green-500" />
      </div>
      <h3 className="text-xl font-bold text-gray-900">Booking Confirmed!</h3>
      <p className="text-gray-600 text-sm">
        Your booking #{bookingId.slice(0, 8).toUpperCase()} has been placed
        successfully.
      </p>

      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 space-y-2">
        <div className="flex items-center gap-2 justify-center">
          <Mail size={16} />
          <span>A confirmation email has been sent to you.</span>
        </div>
        <div className="flex items-center gap-2 justify-center">
          <Calendar size={16} />
          <span>Manage your bookings in My Bookings.</span>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Close
        </Button>
        <Link href={`/${slug}/bookings`} className="flex-1">
          <Button className="w-full">View My Bookings</Button>
        </Link>
      </div>
    </div>
  );
}
