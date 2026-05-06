"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import {
  getTenantBySlug,
  getInventories,
  createInventory,
  updateInventory,
} from "@/lib/firebase/firestore";
import { deleteDoc, doc } from "firebase/firestore";
import { getClientFirebase } from "@/lib/firebase/client";
import { InventoryForm } from "@/components/admin/InventoryForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import toast from "react-hot-toast";
import Image from "next/image";
import type { Inventory } from "@/types";

interface Props {
  params: { slug: string };
}

export default function InventoriesPage({ params }: Props) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingInv, setEditingInv] = useState<Inventory | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const { data: tenant } = useQuery({
    queryKey: ["tenant", params.slug],
    queryFn: () => getTenantBySlug(params.slug),
  });

  const { data: inventories, isLoading } = useQuery({
    queryKey: ["inventories", tenant?.tenantId],
    queryFn: () => getInventories(tenant!.tenantId),
    enabled: !!tenant,
  });

  const handleCreate = async (data: Omit<Inventory, "id" | "remainingStock">) => {
    setFormLoading(true);
    try {
      await createInventory(tenant!.tenantId, {
        ...data,
        remainingStock: data.stockType === "infinite" ? Infinity : data.initialStock,
      });
      queryClient.invalidateQueries({ queryKey: ["inventories"] });
      setIsOpen(false);
      toast.success("Item created");
    } catch {
      toast.error("Failed to create item");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: Omit<Inventory, "id" | "remainingStock">) => {
    if (!editingInv) return;
    setFormLoading(true);
    try {
      await updateInventory(tenant!.tenantId, editingInv.id, data);
      queryClient.invalidateQueries({ queryKey: ["inventories"] });
      setEditingInv(null);
      toast.success("Item updated");
    } catch {
      toast.error("Failed to update item");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this inventory item?")) return;
    try {
      const { db } = getClientFirebase();
      await deleteDoc(doc(db, "tenants", tenant!.tenantId, "inventories", id));
      queryClient.invalidateQueries({ queryKey: ["inventories"] });
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete item");
    }
  };

  if (!tenant) return null;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage add-ons, menus, and stock items.
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus size={16} />
          Add Item
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : !inventories?.length ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-400">No inventory items yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inventories.map((inv) => (
            <Card key={inv.id} className="overflow-hidden">
              <div className="flex items-center gap-4">
                {/* Thumbnail */}
                {inv.images?.[0] ? (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <Image src={inv.images[0]} alt={inv.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <ImageIcon size={20} className="text-gray-300" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{inv.name}</p>
                    <Badge variant={inv.stockType === "infinite" ? "success" : "warning"}>
                      {inv.stockType}
                    </Badge>
                  </div>
                  {inv.description && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{inv.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {tenant.settings.currency} {inv.price.toFixed(2)} ·{" "}
                    {inv.stockType === "finite"
                      ? `${inv.remainingStock} / ${inv.initialStock} remaining`
                      : "Unlimited stock"}
                  </p>
                </div>

                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setEditingInv(inv)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(inv.id)}
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

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Inventory Item" size="lg">
        <InventoryForm
          tenantId={tenant.tenantId}
          onSubmit={handleCreate}
          onCancel={() => setIsOpen(false)}
          loading={formLoading}
        />
      </Modal>

      <Modal isOpen={!!editingInv} onClose={() => setEditingInv(null)} title="Edit Item" size="lg">
        {editingInv && (
          <InventoryForm
            defaultValues={editingInv}
            tenantId={tenant.tenantId}
            inventoryId={editingInv.id}
            onSubmit={handleUpdate}
            onCancel={() => setEditingInv(null)}
            loading={formLoading}
          />
        )}
      </Modal>
    </>
  );
}
