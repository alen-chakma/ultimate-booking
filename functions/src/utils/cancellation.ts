import { differenceInHours, differenceInDays } from "date-fns";

export interface CancellationResult {
  refundPercentage: number;
  penaltyPercentage: number;
  canCancel: boolean;
  message: string;
}

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

  if (daysUntil >= 7) {
    return {
      refundPercentage: 100,
      penaltyPercentage: 0,
      canCancel: true,
      message: `You have ${daysUntil} days until your booking. Full refund will be applied.`,
    };
  }

  if (daysUntil >= 3) {
    return {
      refundPercentage: 50,
      penaltyPercentage: 50,
      canCancel: true,
      message: `You have ${daysUntil} days until your booking. 50% refund will be applied.`,
    };
  }

  if (daysUntil >= 1) {
    return {
      refundPercentage: 20,
      penaltyPercentage: 80,
      canCancel: true,
      message: `You have ${daysUntil} day(s) until your booking. 20% refund will be applied.`,
    };
  }

  return {
    refundPercentage: 0,
    penaltyPercentage: 100,
    canCancel: true,
    message: "You are within 24 hours of your booking. No refund will be issued.",
  };
}
