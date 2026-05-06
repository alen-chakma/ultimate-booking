import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  CollectionReference,
  DocumentReference,
  Query,
  QueryConstraint,
} from "firebase/firestore";
import { getClientFirebase } from "./client";
import type {
  Tenant,
  AppUser,
  Resource,
  Inventory,
  Service,
  ServiceSlot,
  Booking,
  Amenity,
  Review,
  SearchFilters,
} from "@/types";

function getDb() {
  return getClientFirebase().db;
}

// ─── Tenant Helpers ───────────────────────────────────────────────────────────
export const tenantsCol = () =>
  collection(getDb(), "tenants") as CollectionReference<Tenant>;

export const tenantDoc = (tenantId: string) =>
  doc(getDb(), "tenants", tenantId) as DocumentReference<Tenant>;

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const q = query(tenantsCol(), where("slug", "==", slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data();
}

export async function getTenantById(tenantId: string): Promise<Tenant | null> {
  const snap = await getDoc(tenantDoc(tenantId));
  return snap.exists() ? snap.data() : null;
}

export async function searchTenants(filters: SearchFilters): Promise<Tenant[]> {
  const constraints: QueryConstraint[] = [];
  if (filters.businessType) {
    constraints.push(where("businessType", "==", filters.businessType));
  }
  if (filters.city) {
    constraints.push(where("address.city", "==", filters.city));
  }
  constraints.push(orderBy("createdAt", "desc"));

  const q = query(tenantsCol(), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export async function createTenant(data: Omit<Tenant, "createdAt" | "updatedAt">) {
  const ref = doc(getDb(), "tenants", data.tenantId);
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return data.tenantId;
}

export async function updateTenant(tenantId: string, data: Partial<Tenant>) {
  await updateDoc(tenantDoc(tenantId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ─── Resource Helpers ─────────────────────────────────────────────────────────
export const resourcesCol = (tenantId: string) =>
  collection(getDb(), "tenants", tenantId, "resources") as CollectionReference<Resource>;

export async function getResources(tenantId: string): Promise<Resource[]> {
  const snap = await getDocs(resourcesCol(tenantId));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
}

export async function createResource(
  tenantId: string,
  data: Omit<Resource, "id">
): Promise<string> {
  const ref = await addDoc(resourcesCol(tenantId), data as Resource);
  return ref.id;
}

export async function updateResource(
  tenantId: string,
  resourceId: string,
  data: Partial<Resource>
) {
  await updateDoc(doc(getDb(), "tenants", tenantId, "resources", resourceId), data);
}

export async function deleteResource(tenantId: string, resourceId: string) {
  await deleteDoc(doc(getDb(), "tenants", tenantId, "resources", resourceId));
}

// ─── Inventory Helpers ────────────────────────────────────────────────────────
export const inventoriesCol = (tenantId: string) =>
  collection(getDb(), "tenants", tenantId, "inventories") as CollectionReference<Inventory>;

export async function getInventories(tenantId: string): Promise<Inventory[]> {
  const snap = await getDocs(inventoriesCol(tenantId));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
}

export async function createInventory(
  tenantId: string,
  data: Omit<Inventory, "id">
): Promise<string> {
  const ref = await addDoc(inventoriesCol(tenantId), data as Inventory);
  return ref.id;
}

export async function updateInventory(
  tenantId: string,
  inventoryId: string,
  data: Partial<Inventory>
) {
  await updateDoc(
    doc(getDb(), "tenants", tenantId, "inventories", inventoryId),
    data
  );
}

// ─── Service Helpers ──────────────────────────────────────────────────────────
export const servicesCol = (tenantId: string) =>
  collection(getDb(), "tenants", tenantId, "services") as CollectionReference<Service>;

export async function getServices(tenantId: string): Promise<Service[]> {
  const snap = await getDocs(servicesCol(tenantId));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
}

export async function createService(
  tenantId: string,
  data: Omit<Service, "id">
): Promise<string> {
  const ref = await addDoc(servicesCol(tenantId), data as Service);
  return ref.id;
}

export async function updateService(
  tenantId: string,
  serviceId: string,
  data: Partial<Service>
) {
  await updateDoc(doc(getDb(), "tenants", tenantId, "services", serviceId), data);
}

export async function deleteService(tenantId: string, serviceId: string) {
  await deleteDoc(doc(getDb(), "tenants", tenantId, "services", serviceId));
}

// ─── ServiceSlot Helpers ──────────────────────────────────────────────────────
export const slotsCol = (tenantId: string, serviceId: string) =>
  collection(
    getDb(),
    "tenants",
    tenantId,
    "services",
    serviceId,
    "serviceSlots"
  ) as CollectionReference<ServiceSlot>;

export async function getAvailableSlots(
  tenantId: string,
  serviceId: string,
  from: Date,
  to: Date
): Promise<ServiceSlot[]> {
  const q = query(
    slotsCol(tenantId, serviceId),
    where("status", "==", "available"),
    where("startTime", ">=", Timestamp.fromDate(from)),
    where("startTime", "<=", Timestamp.fromDate(to)),
    orderBy("startTime", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), serviceSlotId: d.id }));
}

export async function createServiceSlot(
  tenantId: string,
  serviceId: string,
  data: Omit<ServiceSlot, "serviceSlotId">
): Promise<string> {
  const ref = await addDoc(slotsCol(tenantId, serviceId), data as ServiceSlot);
  return ref.id;
}

// ─── Booking Helpers ──────────────────────────────────────────────────────────
export const bookingsCol = (tenantId: string) =>
  collection(getDb(), "tenants", tenantId, "bookings") as CollectionReference<Booking>;

export async function getBookingsByUser(
  tenantId: string,
  userId: string
): Promise<Booking[]> {
  const q = query(
    bookingsCol(tenantId),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), bookingId: d.id }));
}

export async function getAllBookings(tenantId: string): Promise<Booking[]> {
  const q = query(bookingsCol(tenantId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), bookingId: d.id }));
}

export async function createBooking(
  tenantId: string,
  data: Omit<Booking, "bookingId" | "createdAt">
): Promise<string> {
  const ref = await addDoc(bookingsCol(tenantId), {
    ...data,
    createdAt: serverTimestamp(),
  } as Booking);
  return ref.id;
}

export async function updateBooking(
  tenantId: string,
  bookingId: string,
  data: Partial<Booking>
) {
  await updateDoc(
    doc(getDb(), "tenants", tenantId, "bookings", bookingId),
    data
  );
}

// ─── Amenity Helpers ──────────────────────────────────────────────────────────
export const amenitiesCol = (tenantId: string) =>
  collection(getDb(), "tenants", tenantId, "amenities") as CollectionReference<Amenity>;

export async function getAmenities(tenantId: string): Promise<Amenity[]> {
  const snap = await getDocs(amenitiesCol(tenantId));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
}

// ─── User Helpers ─────────────────────────────────────────────────────────────
export const usersCol = () =>
  collection(getDb(), "users") as CollectionReference<AppUser>;

export async function getUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(getDb(), "users", uid) as DocumentReference<AppUser>);
  return snap.exists() ? snap.data() : null;
}

export async function upsertUser(uid: string, data: Partial<AppUser>) {
  await setDoc(doc(getDb(), "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// ─── Review Helpers ───────────────────────────────────────────────────────────
export const reviewsCol = (tenantId: string) =>
  collection(getDb(), "tenants", tenantId, "reviews") as CollectionReference<Review>;

export async function getReviews(tenantId: string, serviceId?: string): Promise<Review[]> {
  let q: Query<Review>;
  if (serviceId) {
    q = query(
      reviewsCol(tenantId),
      where("serviceId", "==", serviceId),
      orderBy("createdAt", "desc")
    );
  } else {
    q = query(reviewsCol(tenantId), orderBy("createdAt", "desc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
}
