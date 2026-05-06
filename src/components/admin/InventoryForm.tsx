"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ImageUpload } from "@/components/ui/ImageUpload";
import type { Inventory } from "@/types";
import { Timestamp } from "firebase/firestore";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  description: z.string(),
  price: z.coerce.number().min(0, "Price must be >= 0"),
  stockType: z.enum(["finite", "infinite"]),
  initialStock: z.coerce.number().min(0),
  availableFrom: z.string().min(1, "Start date required"),
  availableTo: z.string().min(1, "End date required"),
});

type FormData = z.infer<typeof schema>;

interface InventoryFormProps {
  defaultValues?: Partial<Inventory>;
  tenantId: string;
  inventoryId?: string;
  onSubmit: (data: Omit<Inventory, "id" | "remainingStock">) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function InventoryForm({
  defaultValues,
  tenantId,
  inventoryId,
  onSubmit,
  onCancel,
  loading,
}: InventoryFormProps) {
  const [images, setImages] = useState<string[]>(defaultValues?.images ?? []);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      price: defaultValues?.price ?? 0,
      stockType: defaultValues?.stockType ?? "finite",
      initialStock: defaultValues?.initialStock ?? 100,
      availableFrom: defaultValues?.availableDateRange?.from
        ? defaultValues.availableDateRange.from.toDate().toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      availableTo: defaultValues?.availableDateRange?.to
        ? defaultValues.availableDateRange.to.toDate().toISOString().split("T")[0]
        : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    },
  });

  const stockType = watch("stockType");

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit({
      name: data.name,
      description: data.description,
      price: data.price,
      stockType: data.stockType,
      initialStock: data.stockType === "infinite" ? Infinity : data.initialStock,
      dependsOnResource: null,
      availableDateRange: {
        from: Timestamp.fromDate(new Date(data.availableFrom)),
        to: Timestamp.fromDate(new Date(data.availableTo)),
      },
      images,
    });
  };

  const uploadPath = `tenants/${tenantId}/inventories/${inventoryId ?? "new"}`;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input
        label="Item name"
        error={errors.name?.message}
        required
        placeholder="e.g. Menu A, Extra towel, Locker..."
        {...register("name")}
      />

      <Textarea
        label="Description"
        placeholder="What is this item?"
        {...register("description")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Price"
          type="number"
          step="0.01"
          min={0}
          error={errors.price?.message}
          required
          {...register("price")}
        />
        <Select
          label="Stock type"
          options={[
            { value: "finite", label: "Finite (limited stock)" },
            { value: "infinite", label: "Infinite (unlimited)" },
          ]}
          {...register("stockType")}
        />
      </div>

      {stockType === "finite" && (
        <Input
          label="Initial stock quantity"
          type="number"
          min={0}
          error={errors.initialStock?.message}
          required
          {...register("initialStock")}
        />
      )}

      <ImageUpload
        label="Photos (optional)"
        images={images}
        onChange={setImages}
        uploadPath={uploadPath}
        maxImages={4}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Available from"
          type="date"
          error={errors.availableFrom?.message}
          required
          {...register("availableFrom")}
        />
        <Input
          label="Available to"
          type="date"
          error={errors.availableTo?.message}
          required
          {...register("availableTo")}
        />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {defaultValues?.name ? "Update Item" : "Create Item"}
        </Button>
      </div>
    </form>
  );
}
