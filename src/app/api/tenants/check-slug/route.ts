import { NextRequest, NextResponse } from "next/server";
import { getAdminFirebase } from "@/lib/firebase/admin";
import { slugError, isReservedSlug } from "@/lib/utils/slug";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "slug param required" }, { status: 400 });
  }

  // Format validation
  const formatError = slugError(slug);
  if (formatError) {
    return NextResponse.json({ available: false, reason: formatError });
  }

  if (isReservedSlug(slug)) {
    return NextResponse.json({
      available: false,
      reason: "This slug is reserved.",
    });
  }

  // DB check
  const { db } = getAdminFirebase();
  const snap = await db
    .collection("tenants")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (!snap.empty) {
    return NextResponse.json({
      available: false,
      reason: "This slug is already taken.",
    });
  }

  return NextResponse.json({ available: true });
}
