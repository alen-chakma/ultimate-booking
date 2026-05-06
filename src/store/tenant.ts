import { create } from "zustand";
import type { Tenant } from "@/types";

interface TenantState {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  setTenant: (tenant: Tenant | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  tenant: null,
  loading: false,
  error: null,
  setTenant: (tenant) => set({ tenant }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
