"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { SearchSection } from "@/components/landing/SearchSection";
import { BusinessCard } from "@/components/landing/BusinessCard";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useQuery } from "@tanstack/react-query";
import { searchTenants } from "@/lib/firebase/firestore";
import type { SearchFilters, Tenant } from "@/types";

export default function LandingPage() {
  const [filters, setFilters] = useState<SearchFilters>({});

  const { data: tenants, isLoading, refetch } = useQuery({
    queryKey: ["tenants", filters],
    queryFn: () => searchTenants(filters),
  });

  const handleSearch = (newFilters: {
    query: string;
    city: string;
    businessType: string;
  }) => {
    setFilters({
      city: newFilters.city || undefined,
      businessType: (newFilters.businessType as any) || undefined,
      query: newFilters.query || undefined,
    });
  };

  // Client-side filter by query string (Firestore full-text search requires Algolia)
  const filteredTenants = (tenants ?? []).filter((t) => {
    if (!filters.query) return true;
    const q = filters.query.toLowerCase();
    return (
      t.businessName.toLowerCase().includes(q) ||
      t.businessType.toLowerCase().includes(q) ||
      t.address.city.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <SearchSection onSearch={handleSearch} loading={isLoading} />

        {/* Search results */}
        <section className="py-12 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {(filters.city || filters.businessType || filters.query) && (
              <h2 className="mb-6 text-xl font-bold text-gray-900">
                {isLoading
                  ? "Searching..."
                  : `${filteredTenants.length} business${filteredTenants.length !== 1 ? "es" : ""} found`}
              </h2>
            )}

            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filteredTenants.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredTenants.map((tenant) => (
                  <BusinessCard key={tenant.tenantId} tenant={tenant} />
                ))}
              </div>
            ) : filters.query || filters.city || filters.businessType ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
                <p className="text-gray-400">
                  No businesses found matching your search.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <FeaturesSection />

        {/* CTA */}
        <section className="py-20 bg-blue-600 text-white text-center">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="text-3xl font-bold">
              Ready to start accepting bookings?
            </h2>
            <p className="mt-4 text-blue-100">
              Create your free business page in minutes. No credit card required.
            </p>
            <a
              href="/onboarding"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 text-base font-semibold text-blue-700 shadow-lg hover:bg-blue-50 transition-colors"
            >
              Get started for free →
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
