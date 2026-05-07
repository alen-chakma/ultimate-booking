"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Calendar,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

interface NavbarProps {
  tenantSlug?: string;
  tenantId?: string;
  logoUrl?: string;
  businessName?: string;
  primaryColor?: string;
}

export function Navbar({
  tenantSlug,
  tenantId,
  logoUrl,
  businessName,
  primaryColor,
}: NavbarProps) {
  const { firebaseUser, appUser, logout, isAuthenticated } = useAuth();
  const isOwner =
    !!tenantId &&
    appUser?.role === "owner" &&
    appUser?.tenantId === tenantId;
  const router = useRouter();
  const pathname = usePathname();
  const loginHref = `/login?redirect=${encodeURIComponent(pathname)}`;
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isLanding = !tenantSlug;

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href={tenantSlug ? `/${tenantSlug}` : "/"}
            className="flex items-center gap-2 text-blue-600"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={businessName ?? "Logo"}
                width={40}
                height={40}
                className="rounded-lg object-cover"
              />
            ) : (
              <Calendar size={28} />
            )}
            <span className="text-xl font-bold">
              {businessName ?? "Bookly"}
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-4 md:flex">
            {tenantSlug && isOwner && (
              <Link href={`/${tenantSlug}/admin`}>
                <Button size="sm" variant="outline">
                  <Settings size={16} />
                  Admin Panel
                </Button>
              </Link>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  {appUser?.photoURL ? (
                    <Image
                      src={appUser.photoURL}
                      alt="Avatar"
                      width={28}
                      height={28}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                      <User size={16} />
                    </div>
                  )}
                  <span>{appUser?.displayName ?? firebaseUser?.email}</span>
                  <ChevronDown size={14} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-1 w-48 rounded-xl border bg-white shadow-lg">
                    {tenantSlug && (
                      <Link
                        href={`/${tenantSlug}/bookings`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Calendar size={15} />
                        My Bookings
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href={loginHref}>
                <Button size="sm">Sign in</Button>
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t bg-white px-4 pb-4 md:hidden">
          <div className="space-y-2 pt-3">
            {tenantSlug && isOwner && (
              <Link
                href={`/${tenantSlug}/admin`}
                onClick={() => setMenuOpen(false)}
              >
                <Button size="sm" variant="outline" className="w-full">
                  Admin Panel
                </Button>
              </Link>
            )}
            {tenantSlug && isAuthenticated && (
              <Link
                href={`/${tenantSlug}/bookings`}
                onClick={() => setMenuOpen(false)}
              >
                <Button size="sm" variant="ghost" className="w-full">
                  My Bookings
                </Button>
              </Link>
            )}
            {isAuthenticated ? (
              <Button
                size="sm"
                variant="ghost"
                className="w-full text-red-600"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
              >
                Sign out
              </Button>
            ) : (
              <Link href={loginHref} onClick={() => setMenuOpen(false)}>
                <Button size="sm" className="w-full">
                  Sign in
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
