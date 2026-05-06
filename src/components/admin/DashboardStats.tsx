import { Calendar, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { Booking } from "@/types";

interface DashboardStatsProps {
  bookings: Booking[];
  currency: string;
}

export function DashboardStats({ bookings, currency }: DashboardStatsProps) {
  const total = bookings.length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;
  const revenue = bookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const stats = [
    {
      label: "Total Bookings",
      value: total,
      icon: Calendar,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Confirmed",
      value: confirmed,
      icon: CheckCircle,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Cancelled",
      value: cancelled,
      icon: XCircle,
      color: "text-red-600 bg-red-50",
    },
    {
      label: "Revenue",
      value: `${currency} ${revenue.toLocaleString("en", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <Card key={label}>
          <div className="flex items-center gap-4">
            <div className={`rounded-xl p-3 ${color}`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
