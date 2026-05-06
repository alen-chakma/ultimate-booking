import { addDays, addHours, subHours } from "date-fns";
import {
  calculateCancellationPolicy,
  calculateRefundAmount,
  getPolicyDescription,
} from "@/lib/utils/cancellation";

describe("calculateCancellationPolicy", () => {
  const now = new Date("2024-06-01T10:00:00Z");

  test("returns full refund for bookings 7+ days away", () => {
    const bookingDate = addDays(now, 8);
    const result = calculateCancellationPolicy(bookingDate, now);
    expect(result.refundPercentage).toBe(100);
    expect(result.penaltyPercentage).toBe(0);
    expect(result.canCancel).toBe(true);
  });

  test("returns full refund exactly 7 days away", () => {
    const bookingDate = addDays(now, 7);
    const result = calculateCancellationPolicy(bookingDate, now);
    expect(result.refundPercentage).toBe(100);
    expect(result.canCancel).toBe(true);
  });

  test("returns 50% refund for bookings 3-6 days away", () => {
    const bookingDate = addDays(now, 4);
    const result = calculateCancellationPolicy(bookingDate, now);
    expect(result.refundPercentage).toBe(50);
    expect(result.penaltyPercentage).toBe(50);
    expect(result.canCancel).toBe(true);
  });

  test("returns 20% refund for bookings 1-2 days away", () => {
    const bookingDate = addDays(now, 2);
    const result = calculateCancellationPolicy(bookingDate, now);
    expect(result.refundPercentage).toBe(20);
    expect(result.penaltyPercentage).toBe(80);
    expect(result.canCancel).toBe(true);
  });

  test("returns 0% refund for bookings within 24 hours", () => {
    const bookingDate = addHours(now, 12);
    const result = calculateCancellationPolicy(bookingDate, now);
    expect(result.refundPercentage).toBe(0);
    expect(result.penaltyPercentage).toBe(100);
    expect(result.canCancel).toBe(true);
  });

  test("cannot cancel past bookings", () => {
    const bookingDate = subHours(now, 1);
    const result = calculateCancellationPolicy(bookingDate, now);
    expect(result.canCancel).toBe(false);
    expect(result.refundPercentage).toBe(0);
  });

  test("message is informative", () => {
    const bookingDate = addDays(now, 10);
    const result = calculateCancellationPolicy(bookingDate, now);
    expect(result.message).toContain("Full refund");
  });
});

describe("calculateRefundAmount", () => {
  const now = new Date("2024-06-01T10:00:00Z");

  test("calculates full refund correctly", () => {
    const bookingDate = addDays(now, 8);
    const refund = calculateRefundAmount(100, bookingDate, now);
    expect(refund).toBe(100);
  });

  test("calculates 50% refund correctly", () => {
    const bookingDate = addDays(now, 4);
    const refund = calculateRefundAmount(200, bookingDate, now);
    expect(refund).toBe(100);
  });

  test("calculates 20% refund correctly", () => {
    const bookingDate = addDays(now, 1);
    const refund = calculateRefundAmount(150, bookingDate, now);
    expect(refund).toBe(30);
  });

  test("calculates 0 refund within 24 hours", () => {
    const bookingDate = addHours(now, 6);
    const refund = calculateRefundAmount(500, bookingDate, now);
    expect(refund).toBe(0);
  });

  test("handles decimal amounts correctly", () => {
    const bookingDate = addDays(now, 4);
    const refund = calculateRefundAmount(99.99, bookingDate, now);
    expect(refund).toBe(50.0);
  });
});

describe("getPolicyDescription", () => {
  test("returns array of policy strings", () => {
    const desc = getPolicyDescription();
    expect(Array.isArray(desc)).toBe(true);
    expect(desc.length).toBeGreaterThan(0);
  });

  test("includes key policy tiers", () => {
    const desc = getPolicyDescription();
    const joined = desc.join(" ");
    expect(joined).toContain("100%");
    expect(joined).toContain("50%");
    expect(joined).toContain("20%");
  });
});
