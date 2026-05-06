import { NextRequest, NextResponse } from "next/server";
import { getAdminFirebase } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const { auth, db } = getAdminFirebase();

    const sessionCookie = cookies().get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let claims;
    try {
      claims = await auth.verifySessionCookie(sessionCookie, true);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      tenantId,
      serviceSlotId,   // primary slot for capacity deduction
      serviceSlotIds,  // all selected slots
      serviceId,
      userId,
      customerSnapshot,
      startTimeSeconds,  // plain integer seconds
      endTimeSeconds,    // plain integer seconds
      selectedInventories,
      assignedResourceIds,
      totalAmount,
      userNote,
    } = body;

    if (!tenantId || !serviceSlotId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (claims.uid !== userId) {
      return NextResponse.json({ error: "Cannot book on behalf of another user" }, { status: 403 });
    }

    // Validate seconds are finite integers
    const startSecs = Number(startTimeSeconds);
    const endSecs = Number(endTimeSeconds);
    if (!Number.isFinite(startSecs) || !Number.isFinite(endSecs)) {
      return NextResponse.json({ error: "Invalid time values" }, { status: 400 });
    }

    const bookingRef = db
      .collection("tenants")
      .doc(tenantId)
      .collection("bookings")
      .doc();

    const slotRef = db
      .collection("tenants")
      .doc(tenantId)
      .collection("services")
      .doc(serviceId)
      .collection("serviceSlots")
      .doc(serviceSlotId);

    let bookingId: string;

    await db.runTransaction(async (transaction) => {
      const slotDoc = await transaction.get(slotRef);

      if (!slotDoc.exists) {
        throw new Error("Slot not found");
      }

      const slotData = slotDoc.data()!;

      if (slotData.status !== "available") {
        throw new Error("This slot is no longer available");
      }

      const resourceRemaining: Array<{ resourceId: string; qty: number }> =
        slotData.resourceRemaining ?? [];

      const allHaveCapacity = resourceRemaining.every((r: any) => r.qty > 0);
      if (resourceRemaining.length > 0 && !allHaveCapacity) {
        throw new Error("No capacity left for this slot");
      }

      // Deduct inventory stock
      if (selectedInventories?.length) {
        for (const sel of selectedInventories) {
          const invRef = db
            .collection("tenants")
            .doc(tenantId)
            .collection("inventories")
            .doc(sel.inventoryId);
          const invDoc = await transaction.get(invRef);
          if (!invDoc.exists) continue;
          const invData = invDoc.data()!;
          if (invData.stockType === "finite" && invData.remainingStock < sel.qty) {
            throw new Error(`Insufficient stock for ${invData.name}`);
          }
          if (invData.stockType === "finite") {
            transaction.update(invRef, {
              remainingStock: FieldValue.increment(-sel.qty),
            });
          }
        }
      }

      // Decrement resourceRemaining capacity
      const updatedRemaining = resourceRemaining.map((r: any) => ({
        ...r,
        qty: Math.max(0, r.qty - 1),
      }));
      const allFull = updatedRemaining.length > 0 && updatedRemaining.every((r: any) => r.qty === 0);

      transaction.update(slotRef, {
        resourceRemaining: updatedRemaining,
        bookingIds: FieldValue.arrayUnion(bookingRef.id),
        status: allFull ? "unavailable" : "available",
      });

      // Create booking
      bookingId = bookingRef.id;
      transaction.set(bookingRef, {
        bookingId: bookingRef.id,
        serviceId,                              // stored so cancel route can find the slot
        serviceSlotIds: serviceSlotIds ?? [serviceSlotId],
        userId,
        customerSnapshot: customerSnapshot ?? { displayName: "", email: "", phone: "" },
        startTime: Timestamp.fromMillis(Math.round(startSecs) * 1000),
        endTime: Timestamp.fromMillis(Math.round(endSecs) * 1000),
        assignedResourceIds: assignedResourceIds ?? [],
        selectedInventories: selectedInventories ?? [],
        status: "pending",
        totalAmount: totalAmount ?? 0,
        transectionId: null,
        createdAt: FieldValue.serverTimestamp(),
        bookedAt: FieldValue.serverTimestamp(),
        canceledAt: null,
        userNote: userNote ?? "",
      });
    });

    return NextResponse.json({ bookingId: bookingId! }, { status: 201 });
  } catch (error: any) {
    console.error("Create booking error:", error);
    const isBusinessError = ["Slot not found", "no longer available", "No capacity", "Insufficient stock"].some(
      (msg) => error.message?.toLowerCase().includes(msg.toLowerCase())
    );
    return NextResponse.json(
      { error: error.message ?? "Internal server error" },
      { status: isBusinessError ? 422 : 500 }
    );
  }
}
