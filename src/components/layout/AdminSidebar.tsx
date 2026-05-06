"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  Briefcase,
  CalendarDays,
  BookOpen,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AdminSidebarProps {
  slug: string;
}

export function AdminSidebar({ slug }: AdminSidebarProps) {
  const pathname = usePathname();
  const base = `/${slug}/admin`;

  const links = [
    { href: base, label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: `${base}/resources`, label: "Resources", icon: Users },
    { href: `${base}/inventories`, label: "Inventories", icon: Package },
    { href: `${base}/services`, label: "Services", icon: Briefcase },
    { href: `${base}/slots`, label: "Service Slots", icon: CalendarDays },
    { href: `${base}/bookings`, label: "Bookings", icon: BookOpen },
    { href: `${base}/settings`, label: "Settings", icon: Settings },
  ];

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b px-4 py-4">
        <Link
          href={`/${slug}`}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft size={16} />
          Back to site
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Manage
        </p>
        <ul className="space-y-1">
          {links.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact
              ? pathname === href
              : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
