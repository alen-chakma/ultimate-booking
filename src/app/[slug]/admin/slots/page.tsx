"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Zap } from "lucide-react";
import {
  getTenantBySlug,
  getServices,
  getResources,
  getAvailableSlots,
  createServiceSlot,
} from "@/lib/firebase/firestore";
import { ServiceSlotForm } from "@/components/admin/ServiceSlotForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { formatSlotTime } from "@/lib/utils/booking";
import toast from "react-hot-toast";
import type { ServiceSlot } from "@/types";
import { addMonths } from "date-fns";

interface Props {
  params: { slug: string };
}

interface SlotPayload {
  serviceId: string;
  startTime: import("firebase/firestore").Timestamp;
  endTime: import("firebase/firestore").Timestamp;
  resourceRemaining: Array<{ resourceId: string; qty: number }>;
  rushHourCharge: number;
}

export default function SlotsPage({ params }: Props) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [formLoading, setFormLoading] = useState(false);

  const { data: tenant } = useQuery({
    queryKey: ["tenant", params.slug],
    queryFn: () => getTenantBySlug(params.slug),
  });

  const { data: services } = useQuery({
    queryKey: ["services", tenant?.tenantId],
    queryFn: () => getServices(tenant!.tenantId),
    enabled: !!tenant,
  });

  const { data: resources } = useQuery({
    queryKey: ["resources", tenant?.tenantId],
    queryFn: () => getResources(tenant!.tenantId),
    enabled: !!tenant,
  });

  const { data: slots, isLoading } = useQuery({
    queryKey: ["admin-slots", tenant?.tenantId, selectedServiceId],
    queryFn: () =>
      getAvailableSlots(
        tenant!.tenantId,
        selectedServiceId,
        new Date(),
        addMonths(new Date(), 3)
      ),
    enabled: !!tenant && !!selectedServiceId,
  });

  const createSlot = async (payload: SlotPayload) => {
    await createServiceSlot(tenant!.tenantId, payload.serviceId, {
      serviceId: payload.serviceId,
      startTime: payload.startTime,
      endTime: payload.endTime,
      resourceRemaining: payload.resourceRemaining,
      bookingIds: [],
      status: "available",
      rushHourCharge: payload.rushHourCharge,
    });
  };

  const handleSingle = async (payload: SlotPayload) => {
    setFormLoading(true);
    try {
      await createSlot(payload);
      queryClient.invalidateQueries({ queryKey: ["admin-slots"] });
      setIsOpen(false);
      toast.success("Slot created");
    } catch {
      toast.error("Failed to create slot");
    } finally {
      setFormLoading(false);
    }
  };

  const handleBulk = async (payloads: SlotPayload[]) => {
    setFormLoading(true);
    try {
      await Promise.all(payloads.map(createSlot));
      queryClient.invalidateQueries({ queryKey: ["admin-slots"] });
      setIsOpen(false);
      toast.success(`${payloads.length} slot${payloads.length !== 1 ? "s" : ""} created`);
    } catch {
      toast.error("Failed to create some slots");
    } finally {
      setFormLoading(false);
    }
  };

  if (!tenant) return null;

  const serviceOptions = services?.map((s) => ({ value: s.id, label: s.name })) ?? [];

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Slots</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage time slots for your services.
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)} disabled={!services?.length}>
          <Plus size={16} />
          Add Slot
        </Button>
      </div>

      {!services?.length && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Create services first before adding time slots.
        </div>
      )}

      {services && services.length > 0 && (
        <div className="mb-6">
          <Select
            label="Filter by service"
            options={serviceOptions}
            placeholder="Select a service…"
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
          />
        </div>
      )}

      {selectedServiceId && (
        <>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : !slots?.length ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
              <p className="text-gray-400">No upcoming slots for this service.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {slots.map((slot) => (
                <div
                  key={slot.serviceSlotId}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatSlotTime(slot, tenant.settings.timezone)}
                    </p>
                    <div className="mt-1 flex gap-3 text-xs text-gray-400">
                      {slot.resourceRemaining.map((r) => (
                        <span key={r.resourceId}>{r.qty} spots</span>
                      ))}
                      <span>· {slot.bookingIds.length} booked</span>
                      {slot.rushHourCharge > 0 && (
                        <span className="flex items-center gap-0.5 text-orange-500">
                          <Zap size={11} />
                          Rush +{tenant.settings.currency} {slot.rushHourCharge.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant={slot.status === "available" ? "success" : "gray"}>
                    {slot.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create Service Slot"
        size="md"
      >
        <ServiceSlotForm
          services={services ?? []}
          resources={resources ?? []}
          onSubmitSingle={handleSingle}
          onSubmitBulk={handleBulk}
          onCancel={() => setIsOpen(false)}
          loading={formLoading}
        />
      </Modal>
    </>
  );
}
