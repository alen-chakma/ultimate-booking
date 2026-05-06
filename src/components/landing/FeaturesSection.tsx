import {
  Calendar,
  Shield,
  Bell,
  BarChart,
  Globe,
  Smartphone,
} from "lucide-react";

const FEATURES = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "Manage resources, time slots, and capacity for any type of business — from clinics to swimming pools.",
  },
  {
    icon: Shield,
    title: "Secure Bookings",
    description:
      "All transactions are protected. Cancellation policies are enforced automatically with fair penalty rules.",
  },
  {
    icon: Bell,
    title: "Email Notifications",
    description:
      "Customers receive instant email confirmations and reminders for every booking or cancellation.",
  },
  {
    icon: Globe,
    title: "Custom Business Page",
    description:
      "Get your own branded page at bookly.com/your-business with your logo, colors, and services.",
  },
  {
    icon: BarChart,
    title: "Admin Dashboard",
    description:
      "Full control over resources, inventories, services, and bookings — all from one intuitive panel.",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description:
      "Customers can browse and book from any device. Your business page looks great everywhere.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            Everything you need to run bookings
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Whether you&apos;re a solo practitioner or managing a large
            facility, Bookly adapts to your needs.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-gray-100 bg-gray-50 p-6 hover:border-blue-200 hover:bg-blue-50 transition-colors"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Icon size={24} />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
