import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: {
    default: "Bookly – Online Booking Platform",
    template: "%s | Bookly",
  },
  description:
    "Bookly helps businesses of all types manage online bookings. Create your business page and start accepting bookings today.",
  openGraph: {
    type: "website",
    siteName: "Bookly",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-right" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
