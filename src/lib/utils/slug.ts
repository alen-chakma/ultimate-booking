export function generateSlug(businessName: string): string {
  return businessName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug);
}

export function slugError(slug: string): string | null {
  if (!slug) return "Slug is required.";
  if (slug.length < 3) return "Slug must be at least 3 characters.";
  if (slug.length > 50) return "Slug must be 50 characters or fewer.";
  if (!isValidSlug(slug)) {
    return "Slug may only contain lowercase letters, numbers, and hyphens. It cannot start or end with a hyphen.";
  }
  return null;
}

// Reserved paths that cannot be used as slugs
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "login",
  "logout",
  "signup",
  "onboarding",
  "settings",
  "dashboard",
  "help",
  "support",
  "about",
  "contact",
  "privacy",
  "terms",
  "blog",
  "www",
  "app",
  "mail",
  "static",
  "assets",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
