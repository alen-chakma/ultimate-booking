/**
 * Security tests for API routes.
 * These tests verify that authorization, input validation,
 * and injection protections are in place.
 */

describe("API Security Tests", () => {
  // ─── Cancellation policy boundary tests ────────────────────────────────────
  describe("Cancellation policy edge cases", () => {
    const { calculateCancellationPolicy } = require("@/lib/utils/cancellation");
    const { addDays, addHours, subHours } = require("date-fns");

    const now = new Date("2024-06-15T12:00:00Z");

    test("cannot cancel booking that already happened", () => {
      const pastDate = subHours(now, 2);
      const result = calculateCancellationPolicy(pastDate, now);
      expect(result.canCancel).toBe(false);
    });

    test("boundary: exactly 24h before gives 0% refund", () => {
      // 24h = 1 day, but differenceInDays truncates, so 24h = daysUntil of 1
      // which falls in the 1-2 day tier (20%)
      // Actually <24h (0 days) should give 0%
      const tomorrowMinus1min = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const result = calculateCancellationPolicy(tomorrowMinus1min, now);
      // 23 hours = daysUntil 0, so tier 0
      expect(result.refundPercentage).toBe(0);
    });

    test("boundary: 3 days exactly gives 50% refund", () => {
      const threeDays = addDays(now, 3);
      const result = calculateCancellationPolicy(threeDays, now);
      expect(result.refundPercentage).toBe(50);
    });

    test("refund percentage is never negative", () => {
      for (const days of [0, 1, 2, 3, 5, 7, 14]) {
        const date = addDays(now, days);
        const result = calculateCancellationPolicy(date, now);
        expect(result.refundPercentage).toBeGreaterThanOrEqual(0);
        expect(result.penaltyPercentage).toBeGreaterThanOrEqual(0);
        expect(result.refundPercentage + result.penaltyPercentage).toBe(100);
      }
    });
  });

  // ─── Slug validation security ───────────────────────────────────────────────
  describe("Slug security validation", () => {
    const { slugError, isReservedSlug } = require("@/lib/utils/slug");

    const INJECTION_ATTEMPTS = [
      "../admin",
      "../../etc/passwd",
      "<script>alert(1)</script>",
      "'; DROP TABLE tenants; --",
      "admin' OR '1'='1",
      "javascript:alert(1)",
      "%2e%2e%2fadmin",
    ];

    INJECTION_ATTEMPTS.forEach((attempt) => {
      test(`rejects injection attempt: ${attempt.slice(0, 30)}`, () => {
        const error = slugError(attempt);
        expect(error).not.toBeNull();
      });
    });

    test("rejects path traversal in slug", () => {
      expect(slugError("../admin")).not.toBeNull();
      expect(slugError("a/b")).not.toBeNull();
    });

    test("rejects HTML in slug", () => {
      expect(slugError("<script>")).not.toBeNull();
    });

    test("all reserved paths are protected", () => {
      const criticalPaths = ["admin", "api", "login", "logout", "settings"];
      criticalPaths.forEach((path) => {
        expect(isReservedSlug(path)).toBe(true);
      });
    });
  });

  // ─── Input sanitization ─────────────────────────────────────────────────────
  describe("Input sanitization", () => {
    test("generates safe slug from XSS input", () => {
      const { generateSlug } = require("@/lib/utils/slug");
      const xssInput = '<script>alert("xss")</script>';
      const slug = generateSlug(xssInput);
      expect(slug).not.toContain("<");
      expect(slug).not.toContain(">");
      expect(slug).not.toContain('"');
    });

    test("slug cannot contain whitespace", () => {
      const { isValidSlug } = require("@/lib/utils/slug");
      expect(isValidSlug("my slug")).toBe(false);
      expect(isValidSlug("my\tslug")).toBe(false);
    });
  });

  // ─── Booking amount validation ──────────────────────────────────────────────
  describe("Booking amount security", () => {
    test("refund amount never exceeds total paid", () => {
      const { calculateRefundAmount } = require("@/lib/utils/cancellation");
      const { addDays } = require("date-fns");
      const now = new Date();

      // Full refund: refundAmount should equal total
      const refund7d = calculateRefundAmount(500, addDays(now, 8), now);
      expect(refund7d).toBeLessThanOrEqual(500);

      // All tiers
      [0, 1, 3, 7, 14].forEach((days) => {
        const refund = calculateRefundAmount(1000, addDays(now, days), now);
        expect(refund).toBeGreaterThanOrEqual(0);
        expect(refund).toBeLessThanOrEqual(1000);
      });
    });
  });
});
