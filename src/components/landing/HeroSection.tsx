"use client";

import Link from "next/link";
import { ArrowRight, Calendar, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

export function HeroSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 py-24 text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Your business,{" "}
            <span className="text-yellow-300">bookable online</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-blue-100">
            Bookly helps businesses of all types — clinics, spas, restaurants,
            sports facilities and more — accept online bookings effortlessly.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href={isAuthenticated ? "/onboarding" : "/login?redirect=/onboarding"}>
              <Button
                size="lg"
                className="bg-white text-blue-700 hover:bg-blue-50 focus:ring-white"
              >
                Start your business page
                <ArrowRight size={18} />
              </Button>
            </Link>
            <a href="#search">
              <Button
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                Find a business
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 border-t border-white/20 pt-10">
            {[
              { icon: Users, value: "10,000+", label: "Businesses" },
              { icon: Calendar, value: "500K+", label: "Bookings made" },
              { icon: Star, value: "4.9/5", label: "Average rating" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <Icon size={24} className="text-yellow-300" />
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-sm text-blue-200">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
