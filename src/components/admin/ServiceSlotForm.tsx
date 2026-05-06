"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDays, eachDayOfInterval, format, parseISO, addMinutes } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Service, Resource, ServiceSlot } from "@/types";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const singleSchema = z.object({
  serviceId: z.string().min(1, "Service required"),
  date: z.string().min(1, "Date required"),
  startTime: z.string().min(1, "Start time required"),
  rushHourCharge: z.coerce.number().min(0),
});

const bulkSchema = z.object({
  serviceId: z.string().min(1, "Service required"),
  fromDate: z.string().min(1, "Start date required"),
  toDate: z.string().min(1, "End date required"),
  slotTime: z.string().min(1, "Slot time required"),
  rushHourCharge: z.coerce.number().min(0),
});

type SingleForm = z.infer<typeof singleSchema>;
type BulkForm = z.infer<typeof bulkSchema>;

interface SlotPayload {
  serviceId: string;
  startTime: Timestamp;
  endTime: Timestamp;
  resourceRemaining: Array<{ resourceId: string; qty: number }>;
  rushHourCharge: number;
}

interface ServiceSlotFormProps {
  services: Service[];
  resources: Resource[];
  onSubmitSingle: (data: SlotPayload) => Promise<void>;
  onSubmitBulk: (slots: SlotPayload[]) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ServiceSlotForm({
  services,
  resources,
  onSubmitSingle,
  onSubmitBulk,
  onCancel,
  loading,
}: ServiceSlotFormProps) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const today = new Date().toISOString().split("T")[0];

  const singleForm = useForm<SingleForm>({
    resolver: zodResolver(singleSchema),
    defaultValues: {
      date: today,
      startTime: "09:00",
      rushHourCharge: 0,
    },
  });

  const bulkForm = useForm<BulkForm>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      fromDate: today,
      toDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      slotTime: "09:00",
      rushHourCharge: 0,
    },
  });

  const watchedServiceId =
    mode === "single"
      ? singleForm.watch("serviceId")
      : bulkForm.watch("serviceId");
  const selectedService = services.find((s) => s.id === watchedServiceId);

  // Calculate end time from service duration + buffer
  const calcEndTime = (dateStr: string, timeStr: string, service: Service): Date => {
    const start = new Date(`${dateStr}T${timeStr}:00`);
    return addMinutes(start, service.duration + service.bufferTime);
  };

  const buildResourceRemaining = (service: Service) =>
    (service.requirements.resourceIds ?? [])
      .map((rid) => resources.find((r) => r.id === rid))
      .filter(Boolean)
      .map((r) => ({ resourceId: r!.id, qty: r!.baseCapacity }));

  // Auto-update end time when start time changes (single mode)
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    singleForm.register("startTime").onChange(e);
  };

  const handleSingleSubmit = async (data: SingleForm) => {
    if (!selectedService) return;
    const start = new Date(`${data.date}T${data.startTime}:00`);
    const end = calcEndTime(data.date, data.startTime, selectedService);
    await onSubmitSingle({
      serviceId: data.serviceId,
      startTime: Timestamp.fromDate(start),
      endTime: Timestamp.fromDate(end),
      resourceRemaining: buildResourceRemaining(selectedService),
      rushHourCharge: data.rushHourCharge,
    });
  };

  const handleBulkSubmit = async (data: BulkForm) => {
    if (!selectedService) return;
    const from = parseISO(data.fromDate);
    const to = parseISO(data.toDate);
    const allDays = eachDayOfInterval({ start: from, end: to });
    const slots: SlotPayload[] = allDays
      .filter((d) => selectedDays.includes(d.getDay()))
      .map((d) => {
        const dateStr = format(d, "yyyy-MM-dd");
        const start = new Date(`${dateStr}T${data.slotTime}:00`);
        const end = calcEndTime(dateStr, data.slotTime, selectedService);
        return {
          serviceId: data.serviceId,
          startTime: Timestamp.fromDate(start),
          endTime: Timestamp.fromDate(end),
          resourceRemaining: buildResourceRemaining(selectedService),
          rushHourCharge: data.rushHourCharge,
        };
      });
    await onSubmitBulk(slots);
  };

  const serviceOptions = services.map((s) => ({ value: s.id, label: s.name }));

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden">
        {(["single", "bulk"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === m
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {m === "single" ? "Single Slot" : "Bulk Create"}
          </button>
        ))}
      </div>

      {/* ─── SINGLE MODE ─── */}
      {mode === "single" && (
        <form onSubmit={singleForm.handleSubmit(handleSingleSubmit)} className="space-y-4">
          <Select
            label="Service"
            options={serviceOptions}
            placeholder="Select a service…"
            error={singleForm.formState.errors.serviceId?.message}
            required
            {...singleForm.register("serviceId")}
          />

          {selectedService && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              Duration: <strong>{selectedService.duration} min</strong>
              {selectedService.bufferTime > 0 && (
                <> · Buffer: <strong>{selectedService.bufferTime} min</strong></>
              )}
              {" · "}End time is auto-calculated.
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                min={today}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                {...singleForm.register("date")}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Start time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                {...singleForm.register("startTime")}
              />
              {selectedService && singleForm.watch("startTime") && singleForm.watch("date") && (
                <p className="mt-1 text-xs text-gray-400">
                  End:{" "}
                  {format(
                    calcEndTime(
                      singleForm.watch("date"),
                      singleForm.watch("startTime"),
                      selectedService
                    ),
                    "HH:mm"
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Rush hour charge */}
          <div>
            <Input
              label="Rush hour extra charge"
              type="number"
              step="0.01"
              min={0}
              hint="Extra amount added to base price for this slot (0 = normal rate)"
              {...singleForm.register("rushHourCharge")}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              Create Slot
            </Button>
          </div>
        </form>
      )}

      {/* ─── BULK MODE ─── */}
      {mode === "bulk" && (
        <form onSubmit={bulkForm.handleSubmit(handleBulkSubmit)} className="space-y-4">
          <Select
            label="Service"
            options={serviceOptions}
            placeholder="Select a service…"
            error={bulkForm.formState.errors.serviceId?.message}
            required
            {...bulkForm.register("serviceId")}
          />

          {selectedService && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              Duration: <strong>{selectedService.duration} min</strong>
              {selectedService.bufferTime > 0 && (
                <> · Buffer: <strong>{selectedService.bufferTime} min</strong></>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="From date"
              type="date"
              min={today}
              error={bulkForm.formState.errors.fromDate?.message}
              required
              {...bulkForm.register("fromDate")}
            />
            <Input
              label="To date"
              type="date"
              min={today}
              error={bulkForm.formState.errors.toDate?.message}
              required
              {...bulkForm.register("toDate")}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Slot start time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              {...bulkForm.register("slotTime")}
            />
          </div>

          {/* Days of week selector */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Days of week</p>
            <div className="flex gap-1.5">
              {DAYS_OF_WEEK.map((day, idx) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`h-9 w-10 rounded-lg text-xs font-medium transition-colors ${
                    selectedDays.includes(idx)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Rush hour charge */}
          <Input
            label="Rush hour extra charge (applied to all created slots)"
            type="number"
            step="0.01"
            min={0}
            hint="Set 0 for standard pricing"
            {...bulkForm.register("rushHourCharge")}
          />

          {/* Preview count */}
          {bulkForm.watch("fromDate") && bulkForm.watch("toDate") && selectedDays.length > 0 && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              {(() => {
                try {
                  const from = parseISO(bulkForm.watch("fromDate"));
                  const to = parseISO(bulkForm.watch("toDate"));
                  if (to < from) return "End date must be after start date";
                  const count = eachDayOfInterval({ start: from, end: to }).filter((d) =>
                    selectedDays.includes(d.getDay())
                  ).length;
                  return `Will create ${count} slot${count !== 1 ? "s" : ""}`;
                } catch {
                  return null;
                }
              })()}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={selectedDays.length === 0}
              className="flex-1"
            >
              Create All Slots
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
