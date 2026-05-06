import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@bookly.com";
const APP_NAME = "Bookly";

export interface BookingEmailData {
  to: string;
  customerName: string;
  businessName: string;
  slug: string;
  bookingId: string;
  startTime: Date;
  endTime: Date;
  totalAmount: number;
  currency: string;
  status: "confirmed" | "cancelled" | "pending";
  refundAmount?: number;
  refundPercent?: number;
}

export async function sendBookingEmail(data: BookingEmailData): Promise<void> {
  const subject = buildSubject(data);
  const html = buildHtml(data);

  await resend.emails.send({
    from: `${APP_NAME} <${FROM}>`,
    to: data.to,
    subject,
    html,
  });
}

function buildSubject(data: BookingEmailData): string {
  const id = data.bookingId.slice(0, 8).toUpperCase();
  switch (data.status) {
    case "confirmed":
      return `✅ Booking Confirmed #${id} — ${data.businessName}`;
    case "cancelled":
      return `❌ Booking Cancelled #${id} — ${data.businessName}`;
    default:
      return `📋 Booking Received #${id} — ${data.businessName}`;
  }
}

function formatDate(d: Date): string {
  return d.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildHtml(data: BookingEmailData): string {
  const id = data.bookingId.slice(0, 8).toUpperCase();
  const statusColor =
    data.status === "confirmed"
      ? "#16a34a"
      : data.status === "cancelled"
      ? "#dc2626"
      : "#d97706";

  const statusLabel =
    data.status === "confirmed"
      ? "Confirmed"
      : data.status === "cancelled"
      ? "Cancelled"
      : "Received";

  const cancellationSection =
    data.status === "cancelled" && data.refundAmount !== undefined
      ? `
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0;font-size:14px;color:#dc2626;font-weight:600;">Refund Information</p>
          <p style="margin:8px 0 0;font-size:14px;color:#7f1d1d;">
            Refund: ${data.currency} ${data.refundAmount?.toFixed(2)} (${data.refundPercent}%)
          </p>
          <p style="margin:4px 0 0;font-size:12px;color:#991b1b;">
            Refunds are processed within 5–10 business days.
          </p>
        </div>`
      : "";

  const managementLink =
    data.status !== "cancelled"
      ? `<a href="${process.env.APP_URL ?? "https://bookly.com"}/${data.slug}/bookings"
           style="display:inline-block;margin-top:16px;background:#2563eb;color:white;
                  padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
           View My Bookings
         </a>`
      : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Inter,system-ui,sans-serif;background:#f8fafc;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background:#2563eb;padding:24px;text-align:center;">
      <h1 style="margin:0;color:white;font-size:24px;font-weight:700;">${APP_NAME}</h1>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="display:inline-block;background:${statusColor};color:white;
                     padding:6px 16px;border-radius:999px;font-size:13px;font-weight:600;">
          ${statusLabel}
        </span>
      </div>

      <p style="margin:0 0 16px;font-size:16px;color:#1e293b;">
        Hi <strong>${data.customerName}</strong>,
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#475569;">
        ${
          data.status === "confirmed"
            ? `Your booking at <strong>${data.businessName}</strong> has been confirmed.`
            : data.status === "cancelled"
            ? `Your booking at <strong>${data.businessName}</strong> has been cancelled.`
            : `We received your booking request at <strong>${data.businessName}</strong>.`
        }
      </p>

      <!-- Booking Details -->
      <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:16px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;color:#64748b;">
          Booking Details
        </p>
        <table style="width:100%;font-size:14px;color:#334155;border-collapse:collapse;">
          <tr>
            <td style="padding:4px 0;color:#64748b;">Booking ID</td>
            <td style="padding:4px 0;font-family:monospace;font-weight:600;">#${id}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#64748b;">Start</td>
            <td style="padding:4px 0;">${formatDate(data.startTime)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#64748b;">End</td>
            <td style="padding:4px 0;">${formatDate(data.endTime)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#64748b;">Total</td>
            <td style="padding:4px 0;font-weight:700;">${data.currency} ${data.totalAmount.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      ${cancellationSection}

      <div style="text-align:center;">
        ${managementLink}
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">
        ${APP_NAME} · Powered by Bookly Platform
      </p>
    </div>
  </div>
</body>
</html>`;
}
