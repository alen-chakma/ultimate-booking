import { differenceInHours, differenceInDays } from "date-fns";
import type { CancellationResult } from "@/types";

// Cancellation tiers:
// 7+ days before  → 100% refund (no penalty)
// 3–6 days before → 50% refund
// 1–2 days before → 20% refund
// <24 hours       → 0% refund

interface CancellationTier {
  minDays: number;
  maxDays: number | null;
  refundPct: number;
  label: string;
}

const TIERS: CancellationTier[] = [
  { minDays: 7, maxDays: null, refundPct: 100, label: "Full refund" },
  { minDays: 3, maxDays: 6,   refundPct: 50,  label: "50% refund" },
  { minDays: 1, maxDays: 2,   refundPct: 20,  label: "20% refund" },
  { minDays: 0, maxDays: 0,   refundPct: 0,   label: "No refund"  },
];

export function calculateCancellationPolicy(
  bookingStartTime: Date,
  now: Date = new Date()
): CancellationResult {
  const hoursUntil = differenceInHours(bookingStartTime, now);
  const daysUntil = differenceInDays(bookingStartTime, now);

  if (hoursUntil < 0) {
    return {
      refundPercentage: 0,
      penaltyPercentage: 100,
      canCancel: false,
      message: "Cannot cancel a past booking.",
    };
  }

  const tier =
    TIERS.find((t) => {
      if (t.maxDays === null) return daysUntil >= t.minDays;
      return daysUntil >= t.minDays && daysUntil <= t.maxDays;
    }) ?? TIERS[TIERS.length - 1];

  return {
    refundPercentage: tier.refundPct,
    penaltyPercentage: 100 - tier.refundPct,
    canCancel: true,
    message: buildMessage(tier, daysUntil, hoursUntil),
  };
}

function buildMessage(
  tier: CancellationTier,
  daysUntil: number,
  hoursUntil: number
): string {
  const timeStr =
    daysUntil >= 1 ? `${daysUntil} day(s)` : `${hoursUntil} hour(s)`;

  if (tier.refundPct === 100) {
    return `You have ${timeStr} until your booking. Full refund will be applied.`;
  }
  if (tier.refundPct === 0) {
    return `You have ${timeStr} until your booking. No refund will be issued for cancellations within 24 hours.`;
  }
  return `You have ${timeStr} until your booking. A ${tier.refundPct}% refund will be applied (${100 - tier.refundPct}% penalty).`;
}

export function calculateRefundAmount(
  totalAmount: number,
  bookingStartTime: Date,
  now: Date = new Date()
): number {
  const { refundPercentage } = calculateCancellationPolicy(bookingStartTime, now);
  return Math.round((totalAmount * refundPercentage) / 100 * 100) / 100;
}

export function getPolicyDescription(): string[] {
  return [
    "7+ days before: Full refund (100%)",
    "3–6 days before: 50% refund",
    "1–2 days before: 20% refund",
    "Less than 24 hours: No refund",
  ];
}
