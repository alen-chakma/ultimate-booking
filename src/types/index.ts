import { Timestamp } from "firebase/firestore";

// ─── Address ─────────────────────────────────────────────────────────────────
export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  geo: { lat: number; lng: number };
}

// ─── Tenant ──────────────────────────────────────────────────────────────────
export interface Tenant {
  tenantId: string;
  ownerEmail: string;
  businessName: string;
  businessType: BusinessType;
  phone: string;
  address: Address;
  slug: string;
  themeConfig: ThemeConfig;
  settings: TenantSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type BusinessType =
  | "clinic"
  | "spa"
  | "salon"
  | "restaurant"
  | "transport"
  | "hotel"
  | "swimming_pool"
  | "playground"
  | "gym"
  | "court"
  | "other";

export interface ThemeConfig {
  primaryColor: string;
  logoUrl: string;
  bannerUrl: string;
  fontFamily: string;
  images: string[];
}

export interface TenantSettings {
  currency: string;
  timezone: string;
}

// ─── User ────────────────────────────────────────────────────────────────────
export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  photoURL: string;
  address?: Address;
  role: "owner" | "admin" | "user";
  tenantId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Amenity ─────────────────────────────────────────────────────────────────
export interface Amenity {
  id: string;
  name: string;
  icon: string;
  description: string;
}

// ─── Resource ─────────────────────────────────────────────────────────────────
// Staff/Person · Room/Space/Court/Playground/Swimming Pool · Table/Bed · Transport/Hall
export type ResourceType = "Staff" | "Room" | "Table" | "Transport";

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  Staff: "Staff / Person",
  Room: "Room / Space / Court / Playground / Swimming Pool",
  Table: "Table / Bed",
  Transport: "Transport / Hall",
};

export interface TimeRange {
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
}

export interface ScheduleException {
  date: string;       // "YYYY-MM-DD"
  type: "day_off" | "half_day" | "holiday";
  note?: string;
  timeRange?: TimeRange; // For half_day: the working hours on that day
}

export interface Resource {
  id: string;
  name: string;
  resourceType: ResourceType;
  baseCapacity: number;
  // Keys are day names e.g. "Monday" with TimeRange arrays (empty = closed)
  schedule: Record<string, TimeRange[]>;
  // Specific date overrides
  exceptions: ScheduleException[];
  images: string[];
}

// ─── Inventory ───────────────────────────────────────────────────────────────
export interface Inventory {
  id: string;
  name: string;
  description: string;
  price: number;
  stockType: "finite" | "infinite";
  initialStock: number;
  remainingStock: number;
  dependsOnResource: string | null;
  availableDateRange: {
    from: Timestamp;
    to: Timestamp;
  };
  images: string[];
}

// ─── Service ──────────────────────────────────────────────────────────────────
export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;     // minutes
  bufferTime: number;   // minutes
  requirements: {
    // Direct resource IDs required for this service
    resourceIds: string[];
  };
  allowedInventories: string[];
  amenityIds: string[];
  rating: number;
  reviewCount: number;
  basePrice: number;
  images?: string[];
}

// ─── ServiceSlot ─────────────────────────────────────────────────────────────
export interface ResourceRemaining {
  resourceId: string;
  qty: number;
}

export interface ServiceSlot {
  serviceSlotId: string;
  serviceId: string;
  startTime: Timestamp;
  endTime: Timestamp;
  resourceRemaining: ResourceRemaining[];
  bookingIds: string[];
  status: "available" | "unavailable";
  rushHourCharge: number; // Extra charge on top of base price (0 = no rush)
}

// ─── Booking ──────────────────────────────────────────────────────────────────
export type BookingStatus =
  | "available"
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export interface SelectedInventory {
  inventoryId: string;
  qty: number;
  priceAtBooking: number;
}

export interface AssignedResource {
  name: string;
  qty: number;
}

export interface CustomerSnapshot {
  displayName: string;
  email: string;
  phone: string;
}

export interface Booking {
  bookingId: string;
  serviceSlotIds: string[];
  userId: string;
  customerSnapshot: CustomerSnapshot;
  startTime: Timestamp;
  endTime: Timestamp;
  assignedResourceIds: AssignedResource[];
  selectedInventories: SelectedInventory[];
  status: BookingStatus;
  totalAmount: number;
  transectionId: string | null;
  createdAt: Timestamp;
  bookedAt: Timestamp;
  canceledAt: Timestamp | null;
  userNote: string;
}

// ─── Review ───────────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  userId: string;
  bookingId: string;
  serviceId: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
}

// ─── Cancellation Policy ─────────────────────────────────────────────────────
export interface CancellationResult {
  refundPercentage: number;
  penaltyPercentage: number;
  canCancel: boolean;
  message: string;
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
export interface OnboardingFormData {
  businessName: string;
  businessType: BusinessType;
  phone: string;
  slug: string;
  address: Address;
  themeConfig: ThemeConfig;
  settings: TenantSettings;
}

// ─── Search ───────────────────────────────────────────────────────────────────
export interface SearchFilters {
  city?: string;
  businessType?: BusinessType;
  query?: string;
}
