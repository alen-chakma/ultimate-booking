"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { useAuthStore } from "@/store/auth";
import { getTenantBySlug } from "@/lib/firebase/firestore";

interface Props {
  children: React.ReactNode;
  params: { slug: string };
}

export default function AdminLayout({ children, params }: Props) {
  const router = useRouter();
  const { firebaseUser, appUser, loading, initialized } = useAuthStore();

  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ["tenant", params.slug],
    queryFn: () => getTenantBySlug(params.slug),
  });

  useEffect(() => {
    if (!initialized || loading) return;

    if (!firebaseUser) {
      router.push(`/login?redirect=/${params.slug}/admin`);
      return;
    }

    if (tenant && appUser) {
      const isOwner =
        appUser.role === "owner" && appUser.tenantId === tenant.tenantId;
      const isSuperAdmin = appUser.role === "admin";

      if (!isOwner && !isSuperAdmin) {
        router.push(`/${params.slug}`);
      }
    }
  }, [initialized, loading, firebaseUser, appUser, tenant, router, params.slug]);

  if (loading || tenantLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!tenant || !firebaseUser) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar slug={params.slug} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </div>
    </div>
  );
}
