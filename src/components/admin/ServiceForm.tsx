"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ImageUpload, ImagePicker } from "@/components/ui/ImageUpload";
import { RESOURCE_TYPE_LABELS } from "@/types";
import type { Service, Inventory, Resource } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  description: z.string(),
  duration: z.coerce.number().min(5, "Min 5 minutes"),
  bufferTime: z.coerce.number().min(0),
  basePrice: z.coerce.number().min(0),
});

type FormData = z.infer<typeof schema>;

interface ServiceFormProps {
  defaultValues?: Partial<Service>;
  inventories: Inventory[];
  resources: Resource[];
  tenantId: string;
  serviceId?: string;
  onSubmit: (data: Omit<Service, "id" | "rating" | "reviewCount">) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ServiceForm({
  defaultValues,
  inventories,
  resources,
  tenantId,
  serviceId,
  onSubmit,
  onCancel,
  loading,
}: ServiceFormProps) {
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>(
    defaultValues?.requirements?.resourceIds ?? []
  );
  const [resourceDropdownValue, setResourceDropdownValue] = useState("");

  const [allowedInventoryIds, setAllowedInventoryIds] = useState<string[]>(
    defaultValues?.allowedInventories ?? []
  );
  const [inventoryDropdownValue, setInventoryDropdownValue] = useState("");

  // Directly uploaded images
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    defaultValues?.images ?? []
  );
  // Images picked from resource/inventory photos
  const [pickedImages, setPickedImages] = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      duration: defaultValues?.duration ?? 60,
      bufferTime: defaultValues?.bufferTime ?? 0,
      basePrice: defaultValues?.basePrice ?? 0,
    },
  });

  const addResource = () => {
    if (resourceDropdownValue && !selectedResourceIds.includes(resourceDropdownValue)) {
      setSelectedResourceIds((prev) => [...prev, resourceDropdownValue]);
      setResourceDropdownValue("");
    }
  };

  const removeResource = (id: string) => {
    setSelectedResourceIds((prev) => prev.filter((r) => r !== id));
  };

  const addInventory = () => {
    if (inventoryDropdownValue && !allowedInventoryIds.includes(inventoryDropdownValue)) {
      setAllowedInventoryIds((prev) => [...prev, inventoryDropdownValue]);
      setInventoryDropdownValue("");
    }
  };

  const removeInventory = (id: string) => {
    setAllowedInventoryIds((prev) => prev.filter((i) => i !== id));
  };

  const availableResources = resources.filter(
    (r) => !selectedResourceIds.includes(r.id)
  );
  const availableInventories = inventories.filter(
    (i) => !allowedInventoryIds.includes(i.id)
  );

  // Collect images from selected resources and inventories for the picker
  const poolImages: { url: string; label: string }[] = [];
  selectedResourceIds.forEach((rid) => {
    const res = resources.find((r) => r.id === rid);
    res?.images?.forEach((url) => poolImages.push({ url, label: res.name }));
  });
  allowedInventoryIds.forEach((iid) => {
    const inv = inventories.find((i) => i.id === iid);
    inv?.images?.forEach((url) => poolImages.push({ url, label: inv.name }));
  });

  const uploadPath = `tenants/${tenantId}/services/${serviceId ?? "new"}`;

  const handleFormSubmit = async (data: FormData) => {
    // Merge uploaded + picked images, deduplicated
    const allImages = Array.from(new Set([...uploadedImages, ...pickedImages]));
    await onSubmit({
      name: data.name,
      description: data.description,
      duration: data.duration,
      bufferTime: data.bufferTime,
      basePrice: data.basePrice,
      requirements: { resourceIds: selectedResourceIds },
      allowedInventories: allowedInventoryIds,
      amenityIds: defaultValues?.amenityIds ?? [],
      images: allImages,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <Input
        label="Service name"
        error={errors.name?.message}
        required
        placeholder="e.g. 60-min Massage, Court Booking, Dental Checkup..."
        {...register("name")}
      />

      <Textarea
        label="Description"
        placeholder="What does this service include?"
        {...register("description")}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Duration (min)"
          type="number"
          min={5}
          error={errors.duration?.message}
          required
          {...register("duration")}
        />
        <Input
          label="Buffer / cleanup (min)"
          type="number"
          min={0}
          hint="Preparation time after each booking"
          {...register("bufferTime")}
        />
        <Input
          label="Base price"
          type="number"
          step="0.01"
          min={0}
          error={errors.basePrice?.message}
          required
          {...register("basePrice")}
        />
      </div>

      {/* Resources — dropdown + Add */}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">
          Required Resources
          <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
        </p>

        {selectedResourceIds.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {selectedResourceIds.map((rid) => {
              const res = resources.find((r) => r.id === rid);
              if (!res) return null;
              return (
                <span
                  key={rid}
                  className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                >
                  <span className="text-xs text-blue-500">
                    {RESOURCE_TYPE_LABELS[res.resourceType] ?? res.resourceType}
                  </span>
                  <span className="font-medium">{res.name}</span>
                  <button
                    type="button"
                    onClick={() => removeResource(rid)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-blue-200"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {availableResources.length > 0 ? (
          <div className="flex gap-2">
            <select
              value={resourceDropdownValue}
              onChange={(e) => setResourceDropdownValue(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a resource...</option>
              {availableResources.map((res) => (
                <option key={res.id} value={res.id}>
                  [{RESOURCE_TYPE_LABELS[res.resourceType] ?? res.resourceType}] {res.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addResource}
              disabled={!resourceDropdownValue}
            >
              <Plus size={16} />
              Add
            </Button>
          </div>
        ) : resources.length === 0 ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-600">
            No resources yet. Add resources first to assign them to services.
          </p>
        ) : (
          <p className="text-xs text-gray-400">All resources are already selected.</p>
        )}
      </div>

      {/* Allowed add-ons — dropdown + Add */}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">
          Allowed Add-ons
          <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
        </p>

        {allowedInventoryIds.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {allowedInventoryIds.map((iid) => {
              const inv = inventories.find((i) => i.id === iid);
              if (!inv) return null;
              return (
                <span
                  key={iid}
                  className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
                >
                  <span className="font-medium">{inv.name}</span>
                  <span className="text-xs text-green-500">
                    {inv.stockType === "finite" ? `${inv.remainingStock} left` : "∞"}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeInventory(iid)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-green-200"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {availableInventories.length > 0 ? (
          <div className="flex gap-2">
            <select
              value={inventoryDropdownValue}
              onChange={(e) => setInventoryDropdownValue(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select an add-on item...</option>
              {availableInventories.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.name} ({inv.stockType === "finite" ? `${inv.remainingStock} left` : "unlimited"})
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addInventory}
              disabled={!inventoryDropdownValue}
            >
              <Plus size={16} />
              Add
            </Button>
          </div>
        ) : inventories.length > 0 ? (
          <p className="text-xs text-gray-400">All inventory items are already selected.</p>
        ) : null}
      </div>

      {/* Service images — direct upload always available */}
      <div className="space-y-3 rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700">Service Images</p>

        <ImageUpload
          label="Upload photos"
          images={uploadedImages}
          onChange={setUploadedImages}
          uploadPath={uploadPath}
          maxImages={6}
        />

        {/* Pick from resource/inventory pool if any exist */}
        {poolImages.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">
              Or pick from resource / add-on photos
            </p>
            <ImagePicker
              allImages={poolImages}
              selected={pickedImages}
              onChange={setPickedImages}
            />
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {defaultValues?.name ? "Update Service" : "Create Service"}
        </Button>
      </div>
    </form>
  );
}
