import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({ get: jest.fn() }),
}));

// Mock next/link
jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("BookingConfirmation", () => {
  const defaultProps = {
    bookingId: "abc123def456",
    slug: "test-business",
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders confirmation message", () => {
    render(<BookingConfirmation {...defaultProps} />);
    expect(screen.getByText(/booking confirmed/i)).toBeInTheDocument();
  });

  test("shows truncated booking ID", () => {
    render(<BookingConfirmation {...defaultProps} />);
    expect(screen.getByText(/abc123de/i)).toBeInTheDocument();
  });

  test("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<BookingConfirmation {...defaultProps} />);

    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test("renders link to bookings page", () => {
    render(<BookingConfirmation {...defaultProps} />);
    const link = screen.getByRole("link", { name: /view my bookings/i });
    expect(link).toHaveAttribute("href", "/test-business/bookings");
  });

  test("shows email notification message", () => {
    render(<BookingConfirmation {...defaultProps} />);
    expect(
      screen.getByText(/confirmation email has been sent/i)
    ).toBeInTheDocument();
  });
});
