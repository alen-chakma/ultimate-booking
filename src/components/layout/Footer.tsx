import Link from "next/link";
import { Calendar } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-16">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="flex items-center gap-2 text-blue-600">
            <Calendar size={22} />
            <span className="text-lg font-bold">Bookly</span>
          </Link>
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Bookly. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-gray-900">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-gray-900">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-gray-900">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
