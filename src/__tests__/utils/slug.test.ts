import {
  generateSlug,
  isValidSlug,
  slugError,
  isReservedSlug,
  RESERVED_SLUGS,
} from "@/lib/utils/slug";

describe("generateSlug", () => {
  test("converts business name to slug", () => {
    expect(generateSlug("City Wellness Spa")).toBe("city-wellness-spa");
  });

  test("removes special characters", () => {
    expect(generateSlug("Tom's Barber & Shop!")).toBe("toms-barber-shop");
  });

  test("collapses multiple spaces/hyphens", () => {
    expect(generateSlug("My   Business")).toBe("my-business");
  });

  test("limits to 50 characters", () => {
    const longName = "A".repeat(60);
    expect(generateSlug(longName).length).toBeLessThanOrEqual(50);
  });

  test("converts to lowercase", () => {
    expect(generateSlug("UPPER CASE BUSINESS")).toBe("upper-case-business");
  });
});

describe("isValidSlug", () => {
  test("accepts valid slugs", () => {
    expect(isValidSlug("my-business")).toBe(true);
    expect(isValidSlug("salon123")).toBe(true);
    expect(isValidSlug("spa-and-wellness")).toBe(true);
  });

  test("rejects slugs starting/ending with hyphen", () => {
    expect(isValidSlug("-invalid")).toBe(false);
    expect(isValidSlug("invalid-")).toBe(false);
  });

  test("rejects uppercase letters", () => {
    expect(isValidSlug("MyBusiness")).toBe(false);
  });

  test("rejects slugs that are too short", () => {
    expect(isValidSlug("ab")).toBe(false);
  });

  test("rejects special characters", () => {
    expect(isValidSlug("my business")).toBe(false);
    expect(isValidSlug("my_business")).toBe(false);
  });
});

describe("slugError", () => {
  test("returns null for valid slug", () => {
    expect(slugError("my-business")).toBeNull();
  });

  test("returns error for empty slug", () => {
    expect(slugError("")).not.toBeNull();
  });

  test("returns error for too short slug", () => {
    expect(slugError("ab")).not.toBeNull();
  });

  test("returns error for invalid format", () => {
    expect(slugError("My Business!")).not.toBeNull();
  });
});

describe("isReservedSlug", () => {
  test("recognizes reserved slugs", () => {
    expect(isReservedSlug("admin")).toBe(true);
    expect(isReservedSlug("api")).toBe(true);
    expect(isReservedSlug("login")).toBe(true);
  });

  test("accepts non-reserved slugs", () => {
    expect(isReservedSlug("my-spa")).toBe(false);
    expect(isReservedSlug("dr-smith-clinic")).toBe(false);
  });

  test("is case-insensitive", () => {
    expect(isReservedSlug("ADMIN")).toBe(true);
    expect(isReservedSlug("Login")).toBe(true);
  });
});
