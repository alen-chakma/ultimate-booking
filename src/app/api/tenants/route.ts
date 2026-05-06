import { NextRequest, NextResponse } from "next/server";
import { getAdminFirebase } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { generateSlug, slugError, isReservedSlug } from "@/lib/utils/slug";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const { auth, db } = getAdminFirebase();

    // Verify session
    const sessionCookie = cookies().get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decodedClaims;
    try {
      decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      businessName,
      businessType,
      phone,
      slug,
      address,
      themeConfig,
      settings,
      ownerEmail,
    } = body;

    // Validate required fields
    if (!businessName || !slug || !businessType) {
      return NextResponse.json(
        { error: "Missing required fields: businessName, slug, businessType" },
        { status: 400 }
      );
    }

    // Validate slug
    const slugErr = slugError(slug);
    if (slugErr) {
      return NextResponse.json({ error: slugErr }, { status: 400 });
    }

    if (isReservedSlug(slug)) {
      return NextResponse.json(
        { error: "This slug is reserved. Please choose another." },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await db
      .collection("tenants")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { error: "This slug is already taken. Please choose another." },
        { status: 409 }
      );
    }

    // Create tenant
    const tenantRef = db.collection("tenants").doc();
    const tenantId = tenantRef.id;

    const tenantData = {
      tenantId,
      ownerEmail: ownerEmail ?? decodedClaims.email ?? "",
      businessName,
      businessType,
      phone: phone ?? "",
      address: address ?? {
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "",
        geo: { lat: 0, lng: 0 },
      },
      slug,
      themeConfig: themeConfig ?? {
        primaryColor: "#2563eb",
        logoUrl: "",
        fontFamily: "Inter",
        images: [],
      },
      settings: settings ?? { currency: "PHP", timezone: "Asia/Manila" },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await tenantRef.set(tenantData);

    // Update the user's role to owner and associate the tenantId
    const userRef = db.collection("users").doc(decodedClaims.uid);
    await userRef.set(
      {
        role: "owner",
        tenantId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ tenantId, slug }, { status: 201 });
  } catch (error: any) {
    console.error("Create tenant error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { db } = getAdminFirebase();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const snap = await db
        .collection("tenants")
        .where("slug", "==", slug)
        .limit(1)
        .get();

      if (snap.empty) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json({ data: snap.docs[0].data() });
    }

    // List with filters
    const city = searchParams.get("city");
    const businessType = searchParams.get("businessType");

    let query = db.collection("tenants").orderBy("createdAt", "desc").limit(50);
    if (businessType) {
      query = db
        .collection("tenants")
        .where("businessType", "==", businessType)
        .orderBy("createdAt", "desc")
        .limit(50) as any;
    }

    const snap = await query.get();
    const tenants = snap.docs.map((d) => d.data());

    return NextResponse.json({ data: tenants });
  } catch (error: any) {
    console.error("Get tenants error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
