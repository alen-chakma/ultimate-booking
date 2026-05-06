# Bookly — Multi-Tenant Booking Platform

A production-ready, multi-tenant online booking platform built with **Next.js 14**, **Firebase**, and **Tailwind CSS**.

---

## Architecture

```
bookly.com/              → Landing page + business search
bookly.com/[slug]        → Public business page (services + booking)
bookly.com/[slug]/admin  → Admin dashboard (owner only)
bookly.com/login         → Authentication
bookly.com/onboarding    → Business setup wizard
```

### Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS |
| Auth | Firebase Authentication (Google, Facebook, Email) |
| Database | Firestore (multi-tenant) |
| Storage | Firebase Storage (images + logs) |
| Functions | Firebase Cloud Functions (email triggers) |
| Email | Resend |
| State | Zustand + TanStack Query |
| Forms | React Hook Form + Zod |
| Testing | Jest + React Testing Library |
| CI/CD | GitHub Actions → Firebase Hosting |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-org/ultimate-booking.git
cd ultimate-booking
npm install
cd functions && npm install && cd ..
```

### 2. Set up environment

```bash
cp .env.local.example .env.local
# Fill in your Firebase project credentials
```

### 3. Run with Firebase Emulators (recommended for local dev)

```bash
# Copy emulator env
cp .env.emulator .env.local

# Start emulators + Next.js dev server
npm run dev:emulators
```

Or separately:
```bash
# Terminal 1: Firebase emulators
npm run emulators

# Terminal 2: Next.js
NEXT_PUBLIC_USE_EMULATORS=true npm run dev
```

Emulator UI: http://localhost:4000  
App: http://localhost:3000

---

## Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Authentication** (Google, Email/Password, Facebook)
3. Enable **Firestore**, **Storage**, **Functions**
4. Copy project credentials to `.env.local`
5. Create a Service Account and download the private key for `FIREBASE_ADMIN_*` vars

### Deploy Firestore rules and indexes

```bash
firebase deploy --only firestore,storage
```

---

## Running Tests

```bash
# Unit + security tests
npm test

# With coverage report
npm run test:coverage

# Security tests only
npm run test:security
```

---

## Database Schema

### Key Collections

| Collection | Description |
|---|---|
| `/tenants/{id}` | Business profiles |
| `/tenants/{id}/resources/{id}` | Staff, rooms, vehicles, tables |
| `/tenants/{id}/inventories/{id}` | Add-ons, menus, finite stock |
| `/tenants/{id}/services/{id}` | Service packages |
| `/tenants/{id}/services/{id}/serviceSlots/{id}` | Available time slots |
| `/tenants/{id}/bookings/{id}` | Customer bookings |
| `/tenants/{id}/reviews/{id}` | Customer reviews |
| `/users/{id}` | Global user profiles |

---

## Cancellation Policy

| Days before booking | Refund |
|---|---|
| 7+ days | 100% (no penalty) |
| 3–6 days | 50% |
| 1–2 days | 20% |
| < 24 hours | 0% |

---

## CI/CD

| Branch | Environment | Auto-deploy |
|---|---|---|
| `develop` | Dev | ✅ |
| `staging` | Staging | ✅ |
| `main` | Production | ✅ (after tests pass) |

### Required GitHub Secrets

For each environment (dev/staging/prod), configure:
- `{ENV}_FIREBASE_API_KEY`
- `{ENV}_FIREBASE_AUTH_DOMAIN`
- `{ENV}_FIREBASE_STORAGE_BUCKET`
- `{ENV}_FIREBASE_MESSAGING_SENDER_ID`
- `{ENV}_FIREBASE_APP_ID`
- `{ENV}_RESEND_API_KEY`
- `{ENV}_EMAIL_FROM`
- `{ENV}_APP_URL`
- `FIREBASE_TOKEN` (shared — from `firebase login:ci`)

---

## Business Types Supported

| Type | Example Use Case |
|---|---|
| Clinic | Doctor appointments with 30-min slots |
| Spa/Salon | Therapists + treatment beds (dependent resources) |
| Restaurant | Table booking with menu items as inventory |
| Swimming Pool | Shared resource with hourly capacity |
| Hotel | Room booking with multi-day slots |
| Court/Sports | Tennis/badminton court hourly booking |
| Transport | Bus/train/airplane seat booking |
| Gym | Class booking with trainer + equipment |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Landing page
│   ├── login/              # Auth page
│   ├── onboarding/         # Business setup wizard
│   ├── [slug]/             # Business pages
│   │   ├── page.tsx        # Public business page
│   │   ├── bookings/       # Customer bookings
│   │   └── admin/          # Admin dashboard
│   └── api/                # API routes
├── components/             # React components
│   ├── ui/                 # Base UI components
│   ├── layout/             # Navbar, Footer, AdminSidebar
│   ├── landing/            # Hero, Search, BusinessCard
│   ├── booking/            # BookingForm, Calendar, Confirmation
│   ├── admin/              # ResourceForm, ServiceForm, BookingTable
│   └── onboarding/         # Multi-step wizard
├── lib/
│   ├── firebase/           # Client + Admin SDK + Firestore helpers
│   └── utils/              # Cancellation, booking, slug utilities
├── hooks/                  # useAuth, useTenant, useBookings
├── store/                  # Zustand: auth + tenant state
├── providers/              # AuthProvider, QueryProvider
└── types/                  # TypeScript interfaces
functions/
├── src/
│   ├── index.ts            # Cloud Function exports
│   ├── notifications/      # Email service (Resend)
│   └── utils/              # Shared utilities
```
