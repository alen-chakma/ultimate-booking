"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { UserBookings } from "@/components/booking/UserBookings";
import { useAuthStore } from "@/store/auth";
import { getTenantBySlug } from "@/lib/firebase/firestore";

interface Props {
  params: { slug: string };
}

export default function UserBookingsPage({ params }: Props) {
  const router = useRouter();
  const { firebaseUser, appUser, loading, initialized } = useAuthStore();

  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ["tenant", params.slug],
    queryFn: () => getTenantBySlug(params.slug),
  });

  useEffect(() => {
    if (initialized && !firebaseUser) {
      router.push(`/login?redirect=/${params.slug}/bookings`);
    }
  }, [initialized, firebaseUser, router, params.slug]);

  if (loading || tenantLoading || !tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Navbar
        tenantSlug={params.slug}
        tenantId={tenant.tenantId}
        logoUrl={tenant.themeConfig.logoUrl}
        businessName={tenant.businessName}
      />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">My Bookings</h1>
        <UserBookings tenantId={tenant.tenantId} tenant={tenant} />
      </main>
      <Footer />
    </>
  );
}
