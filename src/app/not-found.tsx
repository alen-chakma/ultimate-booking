import Link from "next/link";
import { Calendar, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
        <Calendar size={40} className="text-blue-600" />
      </div>
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <h2 className="mt-2 text-xl font-semibold text-gray-700">
        Page not found
      </h2>
      <p className="mt-3 max-w-sm text-gray-500">
        This business page doesn&apos;t exist yet, or it may have moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
      >
        <Home size={16} />
        Back to Bookly
      </Link>
    </div>
  );
}
