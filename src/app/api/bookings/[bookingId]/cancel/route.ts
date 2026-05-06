import { NextRequest, NextResponse } from "next/server";
import { getAdminFirebase } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { calculateCancellationPolicy } from "@/lib/utils/cancellation";

interface Params {
  params: { bookingId: string };
}

export async function POST(req: NextRequest, { params }: Params) {
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
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId required" }, { status: 400 });
    }

    const userDoc = await db.collection("users").doc(claims.uid).get();
    const userData = userDoc.data();
    const isStaff =
      userData?.role === "admin" ||
      (userData?.role === "owner" && userData?.tenantId === tenantId);

    const bookingRef = db
      .collection("tenants")
      .doc(tenantId)
      .collection("bookings")
      .doc(params.bookingId);

    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = bookingDoc.data()!;

    if (!isStaff && booking.userId !== claims.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.status === "cancelled" || booking.status === "completed") {
      return NextResponse.json(
        { error: `Booking is already ${booking.status}` },
        { status: 422 }
      );
    }

    const startTime: Timestamp = booking.startTime;
    const policy = calculateCancellationPolicy(startTime.toDate(), new Date());

    if (!policy.canCancel) {
      return NextResponse.json({ error: policy.message }, { status: 422 });
    }

    const serviceId: string | undefined = booking.serviceId;
    const slotIds: string[] = booking.serviceSlotIds ?? [];
    const selectedInventories: Array<{ inventoryId: string; qty: number }> =
      booking.selectedInventories ?? [];

    await db.runTransaction(async (transaction) => {
      // ── ALL READS FIRST ────────────────────────────────────────────────────

      // Re-read booking inside transaction for consistency
      const freshBookingDoc = await transaction.get(bookingRef);
      if (!freshBookingDoc.exists) throw new Error("Booking not found");

      // Read all slot docs
      const slotRefs = serviceId
        ? slotIds.map((slotId) =>
            db
              .collection("tenants")
              .doc(tenantId)
              .collection("services")
              .doc(serviceId)
              .collection("serviceSlots")
              .doc(slotId)
          )
        : [];

      const slotDocs = await Promise.all(
        slotRefs.map((ref) => transaction.get(ref))
      );

      // Read all inventory docs
      const invRefs = selectedInventories.map((inv) =>
        db
          .collection("tenants")
          .doc(tenantId)
          .collection("inventories")
          .doc(inv.inventoryId)
      );

      const invDocs = await Promise.all(
        invRefs.map((ref) => transaction.get(ref))
      );

      // ── ALL WRITES AFTER READS ─────────────────────────────────────────────

      transaction.update(bookingRef, {
        status: "cancelled",
        canceledAt: FieldValue.serverTimestamp(),
      });

      for (let i = 0; i < slotDocs.length; i++) {
        const slotDoc = slotDocs[i];
        if (!slotDoc.exists) continue;

        const slotData = slotDoc.data()!;
        const updatedRemaining = (slotData.resourceRemaining ?? []).map(
          (r: any) => ({ ...r, qty: r.qty + 1 })
        );

        transaction.update(slotRefs[i], {
          resourceRemaining: updatedRemaining,
          bookingIds: FieldValue.arrayRemove(params.bookingId),
          status: "available",
        });
      }

      for (let i = 0; i < invDocs.length; i++) {
        const invDoc = invDocs[i];
        if (!invDoc.exists) continue;
        const invData = invDoc.data()!;
        if (invData.stockType === "finite") {
          transaction.update(invRefs[i], {
            remainingStock: FieldValue.increment(selectedInventories[i].qty),
          });
        }
      }
    });

    const refundAmount = (booking.totalAmount * policy.refundPercentage) / 100;

    return NextResponse.json({
      success: true,
      refundPercentage: policy.refundPercentage,
      refundAmount,
      message: policy.message,
    });
  } catch (error: any) {
    console.error("Cancel booking error:", error);
    return NextResponse.json(
      { error: error.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
