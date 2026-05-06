"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, isSameDay, isToday, isPast, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatSlotTime, groupSlotsByDate } from "@/lib/utils/booking";
import type { ServiceSlot, Tenant } from "@/types";

interface BookingCalendarProps {
  slots: ServiceSlot[];
  tenant: Tenant;
  onSlotSelect: (slot: ServiceSlot) => void;
  selectedSlot?: ServiceSlot | null;
}

export function BookingCalendar({
  slots,
  tenant,
  onSlotSelect,
  selectedSlot,
}: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const slotsByDate = groupSlotsByDate(slots);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad days to start from Sunday
  const startPad = monthStart.getDay();

  const dateSlots = selectedDate
    ? (slotsByDate[format(selectedDate, "yyyy-MM-dd")] ?? [])
    : [];

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="rounded-lg p-2 hover:bg-gray-100"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold text-gray-900">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="rounded-lg p-2 hover:bg-gray-100"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const hasSlots = !!slotsByDate[key]?.length;
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const disabled = isPast(startOfDay(day)) && !isToday(day);

          return (
            <button
              key={key}
              disabled={disabled || !hasSlots}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors",
                isSelected
                  ? "bg-blue-600 text-white"
                  : hasSlots && !disabled
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
                  : "text-gray-400 cursor-not-allowed",
                isToday(day) && !isSelected && "ring-2 ring-blue-300"
              )}
            >
              {format(day, "d")}
              {hasSlots && !disabled && (
                <span
                  className={cn(
                    "mt-0.5 h-1 w-1 rounded-full",
                    isSelected ? "bg-white" : "bg-blue-500"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Time slots for selected date */}
      {selectedDate && (
        <div className="mt-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Available slots on {format(selectedDate, "EEE, MMM d")}
          </h3>
          {dateSlots.length === 0 ? (
            <p className="text-sm text-gray-500">No slots available.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {dateSlots.map((slot) => {
                const isSlotSelected =
                  selectedSlot?.serviceSlotId === slot.serviceSlotId;
                const remaining = slot.resourceRemaining.reduce(
                  (min, r) => Math.min(min, r.qty),
                  Infinity
                );

                return (
                  <button
                    key={slot.serviceSlotId}
                    onClick={() => onSlotSelect(slot)}
                    className={cn(
                      "rounded-lg border px-4 py-3 text-left text-sm transition-all",
                      isSlotSelected
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                    )}
                  >
                    <div className="font-medium text-gray-900">
                      {formatSlotTime(slot, tenant.settings.timezone)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {remaining === Infinity
                        ? "Available"
                        : `${remaining} spot${remaining !== 1 ? "s" : ""} left`}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
