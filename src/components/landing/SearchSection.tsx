"use client";

import { useState } from "react";
import { Search, MapPin, Grid } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { BusinessType } from "@/types";

const BUSINESS_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "clinic", label: "Clinic" },
  { value: "spa", label: "Spa" },
  { value: "salon", label: "Salon" },
  { value: "restaurant", label: "Restaurant" },
  { value: "hotel", label: "Hotel" },
  { value: "swimming_pool", label: "Swimming Pool" },
  { value: "gym", label: "Gym" },
  { value: "court", label: "Court / Sports" },
  { value: "transport", label: "Transport" },
  { value: "playground", label: "Playground" },
  { value: "other", label: "Other" },
];

interface SearchSectionProps {
  onSearch: (filters: {
    query: string;
    city: string;
    businessType: string;
  }) => void;
  loading?: boolean;
}

export function SearchSection({ onSearch, loading }: SearchSectionProps) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [businessType, setBusinessType] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ query, city, businessType });
  };

  return (
    <section id="search" className="bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
          Find a business near you
        </h2>
        <form
          onSubmit={handleSearch}
          className="rounded-2xl bg-white p-6 shadow-md"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="relative sm:col-span-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                style={{ top: "calc(50% + 10px)" }}
              />
              <Input
                label="Search"
                placeholder="Clinic, spa, salon..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="relative">
              <MapPin
                size={16}
                className="absolute left-3 text-gray-400"
                style={{ top: "calc(50% + 10px)" }}
              />
              <Input
                label="City"
                placeholder="Manila, Cebu..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              label="Business type"
              options={BUSINESS_TYPE_OPTIONS}
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              placeholder="All types"
            />
          </div>

          <div className="mt-4 flex justify-center">
            <Button type="submit" loading={loading} size="lg">
              <Search size={18} />
              Search
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
