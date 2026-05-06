"use client";

import { useQuery } from "@tanstack/react-query";
import { getTenantBySlug } from "@/lib/firebase/firestore";

export function useTenant(slug: string) {
  return useQuery({
    queryKey: ["tenant", slug],
    queryFn: () => getTenantBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}
