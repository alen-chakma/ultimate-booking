import {
  calculateBookingTotal,
  formatBookingDuration,
  groupSlotsByDate,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
} from "@/lib/utils/booking";
import type { Service, Inventory, ServiceSlot } from "@/types";
import { Timestamp } from "firebase/firestore";

// Mock Timestamp
const mockTimestamp = (date: Date) => ({
  toDate: () => date,
  _seconds: Math.floor(date.getTime() / 1000),
});

const mockService: Service = {
  id: "svc-1",
  name: "60-min Massage",
  duration: 60,
  bufferTime: 10,
  requirements: { resourceIds: [] },
  allowedInventories: [],
  amenityIds: [],
  rating: 4.5,
  reviewCount: 10,
  basePrice: 1000,
};

const mockInventory: Inventory = {
  id: "inv-1",
  name: "Extra Towel",
  description: "Luxury towel",
  price: 150,
  stockType: "finite",
  initialStock: 100,
  remainingStock: 90,
  dependsOnResource: null,
  availableDateRange: {
    from: mockTimestamp(new Date()) as any,
    to: mockTimestamp(new Date()) as any,
  },
  images: [],
};

describe("calculateBookingTotal", () => {
  test("returns base price when no inventories selected", () => {
    const total = calculateBookingTotal(mockService, []);
    expect(total).toBe(1000);
  });

  test("adds inventory costs to base price", () => {
    const total = calculateBookingTotal(mockService, [
      { inventory: mockInventory, qty: 2 },
    ]);
    expect(total).toBe(1300); // 1000 + 2*150
  });

  test("handles multiple inventories", () => {
    const inv2: Inventory = { ...mockInventory, id: "inv-2", price: 200 };
    const total = calculateBookingTotal(mockService, [
      { inventory: mockInventory, qty: 1 },
      { inventory: inv2, qty: 3 },
    ]);
    expect(total).toBe(1750); // 1000 + 150 + 600
  });

  test("returns base price for zero quantity inventories", () => {
    const total = calculateBookingTotal(mockService, [
      { inventory: mockInventory, qty: 0 },
    ]);
    expect(total).toBe(1000);
  });
});

describe("formatBookingDuration", () => {
  test("formats minutes under an hour", () => {
    expect(formatBookingDuration(30)).toBe("30 min");
    expect(formatBookingDuration(45)).toBe("45 min");
  });

  test("formats exactly one hour", () => {
    expect(formatBookingDuration(60)).toBe("1h");
  });

  test("formats hours and minutes", () => {
    expect(formatBookingDuration(90)).toBe("1h 30m");
    expect(formatBookingDuration(150)).toBe("2h 30m");
  });

  test("formats multiple hours without remainder", () => {
    expect(formatBookingDuration(120)).toBe("2h");
    expect(formatBookingDuration(180)).toBe("3h");
  });
});

describe("groupSlotsByDate", () => {
  test("groups slots by date string", () => {
    const date1 = new Date("2024-06-01T09:00:00Z");
    const date2 = new Date("2024-06-01T14:00:00Z");
    const date3 = new Date("2024-06-02T09:00:00Z");

    const slots: ServiceSlot[] = [
      {
        serviceSlotId: "s1",
        serviceId: "svc-1",
        startTime: mockTimestamp(date1) as any,
        endTime: mockTimestamp(new Date(date1.getTime() + 3600000)) as any,
        resourceRemaining: [],
        bookingIds: [],
        status: "available",
        rushHourCharge: 0,
      },
      {
        serviceSlotId: "s2",
        serviceId: "svc-1",
        startTime: mockTimestamp(date2) as any,
        endTime: mockTimestamp(new Date(date2.getTime() + 3600000)) as any,
        resourceRemaining: [],
        bookingIds: [],
        status: "available",
        rushHourCharge: 0,
      },
      {
        serviceSlotId: "s3",
        serviceId: "svc-1",
        startTime: mockTimestamp(date3) as any,
        endTime: mockTimestamp(new Date(date3.getTime() + 3600000)) as any,
        resourceRemaining: [],
        bookingIds: [],
        status: "available",
        rushHourCharge: 0,
      },
    ];

    const grouped = groupSlotsByDate(slots);
    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped["2024-06-01"]).toHaveLength(2);
    expect(grouped["2024-06-02"]).toHaveLength(1);
  });

  test("returns empty object for no slots", () => {
    expect(groupSlotsByDate([])).toEqual({});
  });
});

describe("BOOKING_STATUS_LABELS", () => {
  test("has labels for all statuses", () => {
    const statuses = ["available", "pending", "confirmed", "cancelled", "completed"];
    statuses.forEach((s) => {
      expect(BOOKING_STATUS_LABELS[s]).toBeDefined();
    });
  });
});
