"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  getTenantBySlug,
  getServices,
  getInventories,
  getResources,
  createService,
  updateService,
  deleteService,
} from "@/lib/firebase/firestore";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatBookingDuration } from "@/lib/utils/booking";
import toast from "react-hot-toast";
import Image from "next/image";
import type { Service } from "@/types";

interface Props {
  params: { slug: string };
}

export default function ServicesPage({ params }: Props) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const { data: tenant } = useQuery({
    queryKey: ["tenant", params.slug],
    queryFn: () => getTenantBySlug(params.slug),
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ["services", tenant?.tenantId],
    queryFn: () => getServices(tenant!.tenantId),
    enabled: !!tenant,
  });

  const { data: inventories } = useQuery({
    queryKey: ["inventories", tenant?.tenantId],
    queryFn: () => getInventories(tenant!.tenantId),
    enabled: !!tenant,
  });

  const { data: resources } = useQuery({
    queryKey: ["resources", tenant?.tenantId],
    queryFn: () => getResources(tenant!.tenantId),
    enabled: !!tenant,
  });

  const handleCreate = async (data: Omit<Service, "id" | "rating" | "reviewCount">) => {
    setFormLoading(true);
    try {
      await createService(tenant!.tenantId, { ...data, rating: 0, reviewCount: 0 });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setIsOpen(false);
      toast.success("Service created");
    } catch {
      toast.error("Failed to create service");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: Omit<Service, "id" | "rating" | "reviewCount">) => {
    if (!editingService) return;
    setFormLoading(true);
    try {
      await updateService(tenant!.tenantId, editingService.id, data);
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setEditingService(null);
      toast.success("Service updated");
    } catch {
      toast.error("Failed to update service");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm("Delete this service? This will also remove all its slots.")) return;
    try {
      await deleteService(tenant!.tenantId, serviceId);
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service deleted");
    } catch {
      toast.error("Failed to delete service");
    }
  };

  if (!tenant) return null;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="mt-1 text-sm text-gray-500">
            Define the services you offer to customers.
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus size={16} />
          Add Service
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : !services?.length ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-400">No services yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <Card key={service.id} className="overflow-hidden">
              <div className="flex items-center gap-4">
                {/* Thumbnail */}
                {service.images?.[0] && (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <Image src={service.images[0]} alt={service.name} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-semibold text-gray-900">{service.name}</p>
                    <Badge variant="info">
                      {tenant.settings.currency} {service.basePrice.toFixed(2)}
                    </Badge>
                  </div>
                  {service.description && (
                    <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">
                      {service.description}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-gray-400">
                    <span>{formatBookingDuration(service.duration)}</span>
                    {service.bufferTime > 0 && (
                      <span>+{formatBookingDuration(service.bufferTime)} buffer</span>
                    )}
                    {(service.requirements?.resourceIds ?? []).length > 0 && (
                      <Badge variant="gray">
                        {service.requirements.resourceIds.length} resource(s)
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setEditingService(service)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="rounded p-1 text-red-400 hover:bg-red-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Service" size="xl">
        <ServiceForm
          inventories={inventories ?? []}
          resources={resources ?? []}
          tenantId={tenant.tenantId}
          onSubmit={handleCreate}
          onCancel={() => setIsOpen(false)}
          loading={formLoading}
        />
      </Modal>

      <Modal isOpen={!!editingService} onClose={() => setEditingService(null)} title="Edit Service" size="xl">
        {editingService && (
          <ServiceForm
            defaultValues={editingService}
            inventories={inventories ?? []}
            resources={resources ?? []}
            tenantId={tenant.tenantId}
            serviceId={editingService.id}
            onSubmit={handleUpdate}
            onCancel={() => setEditingService(null)}
            loading={formLoading}
          />
        )}
      </Modal>
    </>
  );
}
