import { addMinutes, format, isValid, isWithinInterval } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import type { Service, ServiceSlot, Resource, SelectedInventory, Inventory } from "@/types";

export function calculateBookingTotal(
  service: Service,
  selectedInventories: Array<{ inventory: Inventory; qty: number }>
): number {
  const inventoryTotal = selectedInventories.reduce(
    (sum, { inventory, qty }) => sum + inventory.price * qty,
    0
  );
  return service.basePrice + inventoryTotal;
}

export function isSlotAvailable(slot: ServiceSlot): boolean {
  return (
    slot.status === "available" &&
    slot.resourceRemaining.some((r) => r.qty > 0)
  );
}

export function getRemainingCapacity(slot: ServiceSlot): number {
  return slot.resourceRemaining.reduce((min, r) => Math.min(min, r.qty), Infinity);
}

export function formatSlotTime(slot: ServiceSlot, timezone = "UTC"): string {
  const startRaw = slot.startTime.toDate();
  const endRaw = slot.endTime.toDate();
  if (!isValid(startRaw) || !isValid(endRaw)) return "—";
  // Fall back to UTC if the tenant timezone string is unrecognised by the Intl API
  const tz = (() => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return timezone;
    } catch {
      return "UTC";
    }
  })();
  const sameDay =
    formatInTimeZone(startRaw, tz, "yyyy-MM-dd") ===
    formatInTimeZone(endRaw, tz, "yyyy-MM-dd");
  if (sameDay) {
    return `${formatInTimeZone(startRaw, tz, "EEE, MMM d")} · ${formatInTimeZone(startRaw, tz, "h:mm a")} – ${formatInTimeZone(endRaw, tz, "h:mm a")}`;
  }
  return `${formatInTimeZone(startRaw, tz, "EEE, MMM d h:mm a")} – ${formatInTimeZone(endRaw, tz, "EEE, MMM d h:mm a")}`;
}

export function formatBookingDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function isResourceAvailableForSlot(
  resource: Resource,
  slotStart: Date,
  slotEnd: Date
): boolean {
  const dayKey = format(slotStart, "EEEE"); // e.g. "Monday"
  const schedule = resource.schedule[dayKey] ?? resource.schedule["*"] ?? [];

  const slotStartStr = format(slotStart, "HH:mm");
  const slotEndStr = format(slotEnd, "HH:mm");

  return schedule.some(
    (range) => slotStartStr >= range.start && slotEndStr <= range.end
  );
}

export function groupSlotsByDate(
  slots: ServiceSlot[]
): Record<string, ServiceSlot[]> {
  return slots.reduce<Record<string, ServiceSlot[]>>((acc, slot) => {
    const date = format(slot.startTime.toDate(), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {});
}

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  available: "Available",
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  available: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-gray-100 text-gray-800",
};
