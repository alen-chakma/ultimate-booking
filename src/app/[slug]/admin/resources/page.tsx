"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { getTenantBySlug, getResources, createResource, updateResource, deleteResource } from "@/lib/firebase/firestore";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import toast from "react-hot-toast";
import Image from "next/image";
import type { Resource } from "@/types";
import { RESOURCE_TYPE_LABELS } from "@/types";

interface Props {
  params: { slug: string };
}

const TYPE_COLORS: Record<string, "default" | "success" | "warning" | "info" | "gray"> = {
  Staff: "info",
  Room: "success",
  Table: "gray",
  Transport: "warning",
};

export default function ResourcesPage({ params }: Props) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const { data: tenant } = useQuery({
    queryKey: ["tenant", params.slug],
    queryFn: () => getTenantBySlug(params.slug),
  });

  const { data: resources, isLoading } = useQuery({
    queryKey: ["resources", tenant?.tenantId],
    queryFn: () => getResources(tenant!.tenantId),
    enabled: !!tenant,
  });

  const handleCreate = async (data: Omit<Resource, "id">) => {
    setFormLoading(true);
    try {
      await createResource(tenant!.tenantId, data);
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setIsOpen(false);
      toast.success("Resource created");
    } catch {
      toast.error("Failed to create resource");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: Omit<Resource, "id">) => {
    if (!editingResource) return;
    setFormLoading(true);
    try {
      await updateResource(tenant!.tenantId, editingResource.id, data);
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setEditingResource(null);
      toast.success("Resource updated");
    } catch {
      toast.error("Failed to update resource");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!confirm("Delete this resource?")) return;
    try {
      await deleteResource(tenant!.tenantId, resourceId);
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success("Resource deleted");
    } catch {
      toast.error("Failed to delete resource");
    }
  };

  if (!tenant) return null;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage staff, rooms, tables, and transport.
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus size={16} />
          Add Resource
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : !resources?.length ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-400">No resources yet. Add your first resource.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.id} className="overflow-hidden !p-0">
              {/* Thumbnail strip */}
              {resource.images?.length > 0 ? (
                <div className="relative h-28 w-full bg-gray-100">
                  <Image
                    src={resource.images[0]}
                    alt={resource.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-16 items-center justify-center bg-gray-50">
                  <ImageIcon size={24} className="text-gray-300" />
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{resource.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge variant={TYPE_COLORS[resource.resourceType] ?? "gray"}>
                        {RESOURCE_TYPE_LABELS[resource.resourceType] ?? resource.resourceType}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        cap: {resource.baseCapacity}
                      </span>
                    </div>
                    {resource.exceptions?.length > 0 && (
                      <p className="mt-1 text-xs text-amber-600">
                        {resource.exceptions.length} exception{resource.exceptions.length !== 1 ? "s" : ""}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      {Object.entries(resource.schedule ?? {})
                        .filter(([, r]) => r.length > 0)
                        .map(([d]) => d.slice(0, 3))
                        .join(", ") || "No schedule"}
                    </p>
                  </div>
                  <div className="ml-2 flex gap-1 shrink-0">
                    <button
                      onClick={() => setEditingResource(resource)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Resource" size="xl">
        <ResourceForm
          tenantId={tenant.tenantId}
          onSubmit={handleCreate}
          onCancel={() => setIsOpen(false)}
          loading={formLoading}
        />
      </Modal>

      <Modal
        isOpen={!!editingResource}
        onClose={() => setEditingResource(null)}
        title="Edit Resource"
        size="xl"
      >
        {editingResource && (
          <ResourceForm
            defaultValues={editingResource}
            tenantId={tenant.tenantId}
            resourceId={editingResource.id}
            onSubmit={handleUpdate}
            onCancel={() => setEditingResource(null)}
            loading={formLoading}
          />
        )}
      </Modal>
    </>
  );
}
