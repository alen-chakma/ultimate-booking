import * as admin from "firebase-admin";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { sendBookingEmail } from "./notifications/email";
import { calculateCancellationPolicy } from "./utils/cancellation";

admin.initializeApp();

const db = admin.firestore();

// ─── Booking Created Trigger ───────────────────────────────────────────────────
export const onBookingCreated = onDocumentCreated(
  "tenants/{tenantId}/bookings/{bookingId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const booking = snap.data();
    const { tenantId } = event.params;

    try {
      const tenantDoc = await db.collection("tenants").doc(tenantId).get();
      if (!tenantDoc.exists) return;
      const tenant = tenantDoc.data()!;

      await sendBookingEmail({
        to: booking.customerSnapshot.email,
        customerName: booking.customerSnapshot.displayName,
        businessName: tenant.businessName,
        slug: tenant.slug,
        bookingId: snap.id,
        startTime: booking.startTime.toDate(),
        endTime: booking.endTime.toDate(),
        totalAmount: booking.totalAmount,
        currency: tenant.settings?.currency ?? "PHP",
        status: "pending",
      });

      logger.info(`Booking confirmation email sent for ${snap.id}`);
    } catch (error) {
      logger.error("Failed to send booking email:", error);
    }
  }
);

// ─── Booking Updated Trigger (handle cancellation) ───────────────────────────
export const onBookingUpdated = onDocumentUpdated(
  "tenants/{tenantId}/bookings/{bookingId}",
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;
    const { tenantId } = event.params;

    if (before.status === after.status) return;

    try {
      const tenantDoc = await db.collection("tenants").doc(tenantId).get();
      if (!tenantDoc.exists) return;
      const tenant = tenantDoc.data()!;

      if (after.status === "cancelled" && before.status !== "cancelled") {
        const policy = calculateCancellationPolicy(
          before.startTime.toDate(),
          after.canceledAt?.toDate() ?? new Date()
        );

        const refundAmount =
          (before.totalAmount * policy.refundPercentage) / 100;

        await sendBookingEmail({
          to: after.customerSnapshot.email,
          customerName: after.customerSnapshot.displayName,
          businessName: tenant.businessName,
          slug: tenant.slug,
          bookingId: event.data!.after.id,
          startTime: after.startTime.toDate(),
          endTime: after.endTime.toDate(),
          totalAmount: after.totalAmount,
          currency: tenant.settings?.currency ?? "PHP",
          status: "cancelled",
          refundAmount,
          refundPercent: policy.refundPercentage,
        });

        logger.info(`Cancellation email sent for booking ${event.data!.after.id}`);
      }

      if (after.status === "confirmed" && before.status !== "confirmed") {
        await sendBookingEmail({
          to: after.customerSnapshot.email,
          customerName: after.customerSnapshot.displayName,
          businessName: tenant.businessName,
          slug: tenant.slug,
          bookingId: event.data!.after.id,
          startTime: after.startTime.toDate(),
          endTime: after.endTime.toDate(),
          totalAmount: after.totalAmount,
          currency: tenant.settings?.currency ?? "PHP",
          status: "confirmed",
        });

        logger.info(`Confirmation email sent for booking ${event.data!.after.id}`);
      }
    } catch (error) {
      logger.error("Failed to send update email:", error);
    }
  }
);

// ─── Slot Status Auto-Update (scheduled) ─────────────────────────────────────
export const autoCompleteBookings = onSchedule("every 1 hours", async () => {
  const now = admin.firestore.Timestamp.now();

  const tenantsSnap = await db.collection("tenants").get();

  for (const tenantDoc of tenantsSnap.docs) {
    const bookingsSnap = await tenantDoc.ref
      .collection("bookings")
      .where("status", "==", "confirmed")
      .where("endTime", "<=", now)
      .get();

    const batch = db.batch();
    bookingsSnap.docs.forEach((doc) => {
      batch.update(doc.ref, { status: "completed" });
    });

    if (!bookingsSnap.empty) {
      await batch.commit();
      logger.info(
        `Auto-completed ${bookingsSnap.size} bookings for tenant ${tenantDoc.id}`
      );
    }
  }
});
