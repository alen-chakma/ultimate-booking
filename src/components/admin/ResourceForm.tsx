"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, CalendarX, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ImageUpload } from "@/components/ui/ImageUpload";
import type { Resource, ResourceType, ScheduleException } from "@/types";
import { RESOURCE_TYPE_LABELS } from "@/types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const RESOURCE_TYPES: ResourceType[] = ["Staff", "Room", "Table", "Transport"];

const schema = z.object({
  name: z.string().min(1, "Name required"),
  resourceType: z.enum(["Staff", "Room", "Table", "Transport"]),
  baseCapacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  schedule: z.record(
    z.array(z.object({ start: z.string(), end: z.string() }))
  ),
});

type FormData = z.infer<typeof schema>;

interface ResourceFormProps {
  defaultValues?: Partial<Resource>;
  tenantId: string;
  resourceId?: string;   // For upload path on existing resources
  onSubmit: (data: Omit<Resource, "id">) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ResourceForm({
  defaultValues,
  tenantId,
  resourceId,
  onSubmit,
  onCancel,
  loading,
}: ResourceFormProps) {
  const [images, setImages] = useState<string[]>(defaultValues?.images ?? []);
  const [exceptions, setExceptions] = useState<ScheduleException[]>(
    defaultValues?.exceptions ?? []
  );
  const [newExc, setNewExc] = useState<ScheduleException>({
    date: new Date().toISOString().split("T")[0],
    type: "day_off",
    note: "",
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        name: defaultValues?.name ?? "",
        resourceType: (defaultValues?.resourceType as ResourceType) ?? "Staff",
        baseCapacity: defaultValues?.baseCapacity ?? 1,
        schedule: defaultValues?.schedule ?? {
          Monday: [{ start: "09:00", end: "17:00" }],
          Tuesday: [{ start: "09:00", end: "17:00" }],
          Wednesday: [{ start: "09:00", end: "17:00" }],
          Thursday: [{ start: "09:00", end: "17:00" }],
          Friday: [{ start: "09:00", end: "17:00" }],
        },
      },
    });

  const resourceType = watch("resourceType");
  const schedule = watch("schedule");

  // Auto-set capacity to 1 for Staff/Person
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as ResourceType;
    register("resourceType").onChange(e);
    if (val === "Staff") setValue("baseCapacity", 1);
  };

  const toggleDay = (day: string) => {
    const current = schedule[day] ?? [];
    setValue(`schedule.${day}`, current.length > 0 ? [] : [{ start: "09:00", end: "17:00" }]);
  };

  const addTimeRange = (day: string) => {
    setValue(`schedule.${day}`, [...(schedule[day] ?? []), { start: "09:00", end: "17:00" }]);
  };

  const removeTimeRange = (day: string, idx: number) => {
    setValue(`schedule.${day}`, (schedule[day] ?? []).filter((_, i) => i !== idx));
  };

  const addException = () => {
    if (!newExc.date) return;
    setExceptions((prev) => [...prev, { ...newExc }]);
    setNewExc({ date: new Date().toISOString().split("T")[0], type: "day_off", note: "" });
  };

  const removeException = (idx: number) => {
    setExceptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit({
      ...data,
      exceptions,
      images,
    });
  };

  const uploadPath = `tenants/${tenantId}/resources/${resourceId ?? "new"}`;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Resource name"
          error={errors.name?.message}
          required
          placeholder="e.g. Dr. Smith, Court A, Table 1..."
          {...register("name")}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Type <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            {...register("resourceType")}
            onChange={handleTypeChange}
          >
            {RESOURCE_TYPES.map((t) => (
              <option key={t} value={t}>{RESOURCE_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
      </div>

      <Input
        label="Capacity"
        type="number"
        min={1}
        error={errors.baseCapacity?.message}
        required
        hint={
          resourceType === "Staff"
            ? "Auto-set to 1 for Staff/Person (one person per slot)"
            : "How many simultaneous bookings this resource can handle"
        }
        disabled={resourceType === "Staff"}
        {...register("baseCapacity")}
      />

      {/* Images */}
      <ImageUpload
        label="Photos"
        images={images}
        onChange={setImages}
        uploadPath={uploadPath}
        maxImages={5}
      />

      {/* Weekly schedule */}
      <div>
        <p className="mb-3 text-sm font-medium text-gray-700">Weekly Schedule</p>
        <div className="space-y-2">
          {DAYS.map((day) => {
            const ranges = schedule[day] ?? [];
            const active = ranges.length > 0;
            return (
              <div key={day} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleDay(day)}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    {day}
                  </label>
                  {active && (
                    <button
                      type="button"
                      onClick={() => addTimeRange(day)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      + range
                    </button>
                  )}
                </div>
                {active && (
                  <div className="mt-2 space-y-1.5">
                    {ranges.map((range, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="time"
                          value={range.start}
                          onChange={(e) => {
                            const updated = [...ranges];
                            updated[idx] = { ...updated[idx], start: e.target.value };
                            setValue(`schedule.${day}`, updated);
                          }}
                          className="rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                        <span className="text-gray-400 text-xs">to</span>
                        <input
                          type="time"
                          value={range.end}
                          onChange={(e) => {
                            const updated = [...ranges];
                            updated[idx] = { ...updated[idx], end: e.target.value };
                            setValue(`schedule.${day}`, updated);
                          }}
                          className="rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                        {ranges.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTimeRange(day, idx)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule exceptions */}
      <div>
        <p className="mb-3 text-sm font-medium text-gray-700 flex items-center gap-1.5">
          <CalendarX size={15} />
          Schedule Exceptions
        </p>

        {/* Existing exceptions */}
        {exceptions.length > 0 && (
          <div className="mb-3 space-y-1.5">
            {exceptions.map((exc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-3 py-2"
              >
                <div className="text-sm">
                  <span className="font-medium text-amber-900">{exc.date}</span>
                  <span className="mx-2 text-amber-600">·</span>
                  <span className="text-amber-700 capitalize">
                    {exc.type === "day_off" ? "Day Off" : exc.type === "half_day" ? "Half Day" : "Holiday"}
                  </span>
                  {exc.type === "half_day" && exc.timeRange && (
                    <span className="ml-1 text-amber-600">
                      ({exc.timeRange.start}–{exc.timeRange.end})
                    </span>
                  )}
                  {exc.note && (
                    <span className="ml-2 text-xs text-amber-500">· {exc.note}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeException(idx)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new exception */}
        <div className="rounded-lg border border-dashed border-gray-300 p-3 space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Add Exception</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="date"
              value={newExc.date}
              onChange={(e) => setNewExc((p) => ({ ...p, date: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              value={newExc.type}
              onChange={(e) => setNewExc((p) => ({ ...p, type: e.target.value as any }))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="day_off">Day Off</option>
              <option value="half_day">Half Day</option>
              <option value="holiday">Holiday</option>
            </select>
            <input
              type="text"
              value={newExc.note ?? ""}
              onChange={(e) => setNewExc((p) => ({ ...p, note: e.target.value }))}
              placeholder="Note (optional)"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          {newExc.type === "half_day" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Working hours:</span>
              <input
                type="time"
                value={newExc.timeRange?.start ?? "09:00"}
                onChange={(e) =>
                  setNewExc((p) => ({
                    ...p,
                    timeRange: { start: e.target.value, end: p.timeRange?.end ?? "13:00" },
                  }))
                }
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="time"
                value={newExc.timeRange?.end ?? "13:00"}
                onChange={(e) =>
                  setNewExc((p) => ({
                    ...p,
                    timeRange: { start: p.timeRange?.start ?? "09:00", end: e.target.value },
                  }))
                }
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
          )}
          <Button type="button" variant="outline" size="sm" onClick={addException}>
            <Plus size={13} />
            Add Exception
          </Button>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {defaultValues?.name ? "Update Resource" : "Create Resource"}
        </Button>
      </div>
    </form>
  );
}
