# Plan — PaddleUp

## Problem Statement

A single pickleball facility relies on manual processes — phone calls, texts, and spreadsheets — to manage court reservations. This creates two compounding problems: players have no real-time visibility into availability, and the facility operator wastes significant time fielding booking requests while constantly risking double-bookings and scheduling conflicts.

PaddleUp solves this with a dedicated booking system built for one facility. Players can browse live court availability and complete a booking in under 2 minutes. The facility operator manages all courts and reservations through a purpose-built dashboard — eliminating manual overhead and scheduling conflicts entirely.

Success means both sides are served: frictionless discovery and booking for players, and complete operational control for the single facility owner running PaddleUp.

## Users & Roles

**Player**
Browses court listings and real-time availability without an account. Must authenticate to book or manage reservations. Once logged in, can complete bookings, view upcoming and past reservations, and cancel upcoming bookings. Cannot access court configuration, availability schedules, or owner data.

**Court Owner**
A single pre-seeded account with full control over the facility. Manages courts, defines availability schedules, blocks maintenance slots, and reviews all bookings through a dedicated dashboard. No self-registration flow — the owner account is configured at deployment and there is only ever one.

**Platform Admin (v2)**
No dedicated admin role in v1 — platform-level operations are handled directly at the database level. A proper admin role is scoped for v2.

**Authentication model**
Anonymous visitors can browse listings and view real-time availability freely. Authentication is required at the point of booking, prompting sign-up naturally at the moment of highest intent rather than as an upfront barrier.

## Core Features

1. Court browsing — anonymous visitors can browse available courts and filter by date and time
2. Real-time availability — live court availability display, updated as bookings are made
3. Booking with manual payment — account-only booking; player pays via the facility's QR code and uploads a receipt
4. Cancellation — players can cancel upcoming bookings; refunds handled out-of-band per the owner's cancellation policy
5. Player reservation management — players can view upcoming and past bookings and cancel upcoming reservations
6. Email notifications — transactional emails for booking confirmation, cancellation, and upcoming reservation reminders
7. Court configuration — the pre-seeded facility owner configures courts (name, surface type, price per hour); no self-registration flow
8. Availability scheduling — owner defines recurring availability windows per court
9. Maintenance blocks — owner can block specific time slots to take courts out of rotation
10. Owner booking dashboard — owner views all reservations, reviews receipt uploads, and confirms or rejects bookings

## Tech Stack

Frontend: Next.js (App Router) — React framework handling both UI and API routes in a single codebase
Styling: Tailwind CSS with shadcn/ui — utility-first styling with accessible, composable components
Backend: Next.js API Routes — server-side logic co-located with the frontend; no separate backend service in v1
Database: PostgreSQL via Supabase — managed Postgres with a generous free tier; handles relational booking data cleanly
ORM: Prisma — schema management, migrations, and type-safe queries for Next.js
Hosting: Vercel — zero-config deployment for Next.js; integrates directly with Supabase for environment config
Payments: Manual — facility owners post a QR code image; players upload a receipt; owners confirm payment to advance booking status. No payment processor in v1.
Email: Resend (or similar transactional email provider) — booking confirmations (triggered on owner confirmation), cancellations, and reminders

## Data Models

**User** — shared auth record for both roles; `role` field distinguishes `PLAYER` vs `COURT_OWNER`; the Court Owner record is pre-seeded at deployment, not created via registration

**Facility** — single fixed record, pre-seeded at deployment; stores name, location, description, cancellation policy, and `qrCodeImage`. No owner foreign key — there is only one facility and one owner in the system.

**Court** — belongs to the single Facility; stores name, surface type (indoor/outdoor), price per hour; pricing lives at the Court level to support variable rates within a facility

**AvailabilitySchedule** — belongs to a Court; defines recurring weekly availability windows (day of week, start time, end time)

**MaintenanceBlock** — belongs to a Court; one-off time ranges that override availability; used to take courts out of rotation

**Booking** — belongs to a Player (User) and a Court; stores `startTime`, `endTime`, `totalPrice`, `receiptImage` (player's uploaded payment proof), and `status` with a four-state flow: `PENDING_PAYMENT → PENDING_CONFIRMATION → CONFIRMED → CANCELLED`

**Relationships (all one-to-many)**
- Facility → Court → AvailabilitySchedule
- Court → MaintenanceBlock
- Court → Booking
- User (Player) → Booking

**Availability is computed dynamically** — derived from AvailabilitySchedule minus MaintenanceBlocks minus existing Bookings; no pre-generated time slot records

## API Overview

**Auth**
- Register, login, logout, session refresh
- Role-aware session (Player vs. Court Owner)

**Facilities**
- Read and update the single facility profile (Court Owner only; no create endpoint — facility is pre-seeded)
- Upload and replace QR code image (served via authenticated route; not publicly accessible)

**Courts**
- Create, read, and update courts within the facility
- Set and update price per hour per court

**Availability**
- Manage recurring availability schedules per court (Court Owner only)
- Create and delete maintenance blocks per court (Court Owner only)
- Browse available time slots for a court (public, unauthenticated)

**Bookings**
- Create a booking for an available slot (authenticated Player only)
- Upload payment receipt image to a booking (Player who owns the booking only; served via authenticated route)
- Cancel a booking (Player who owns the booking only)
- Update booking status — confirm or reject after receipt review (Court Owner only)
- List bookings for a player (Player's own bookings only)

**Dashboard**
- List all bookings across the facility with filters by court, date, and status (Court Owner only)

**Access control rules (enforced server-side)**
- The single Court Owner account can only modify courts, schedules, and bookings belonging to the pre-seeded facility
- Players cannot modify availability, court config, or another player's bookings
- Receipt and QR code images are never served as public URLs — all image access requires an authenticated session with ownership verification
- Availability browsing is public; booking creation requires a verified Player session

## Implementation Phases

### Phase 1 — Foundation
Goal: Stand up the project skeleton, authentication, and complete database schema.
Scope:
- Initialize Next.js project with Tailwind CSS and shadcn/ui
- Connect Prisma to Supabase PostgreSQL instance
- Define and migrate full initial schema (User, Facility, Court, AvailabilitySchedule, MaintenanceBlock, Booking)
- Seed the single Facility record and Court Owner account at deployment
- Implement register, login, logout, and session (role-aware); player self-registration enabled, owner account is pre-seeded only
- Role-based middleware to protect owner and player routes
Schema changes: Yes — full initial schema (User, Facility, Court, AvailabilitySchedule, MaintenanceBlock, Booking)
Dependencies: None

### Phase 2 — Facility & Court Management
Goal: Enable the Court Owner to configure the pre-seeded facility and set up courts.
Scope:
- Facility edit (name, location, description, cancellation policy; no create — pre-seeded)
- QR code image upload for facility, served via authenticated route
- Court create and edit (name, surface type, price per hour)
- Owner-scoped access control enforced server-side
Schema changes: No
Dependencies: Phase 1 complete

### Phase 3 — Court Browsing & Search
Goal: Allow anonymous visitors to discover and filter courts by location, date, and time.
Scope:
- Public court listing page with search and filter UI (location, date, time)
- Court detail page showing facility info, court specs, and pricing
- Unauthenticated API routes for court and facility reads
- UI placeholders for availability slots (wired up in Phase 4)
Schema changes: No
Dependencies: Phase 2 complete

### Phase 4 — Availability Engine
Goal: Implement dynamic slot computation so players see accurate real-time availability.
Scope:
- Slot computation logic: AvailabilitySchedule minus MaintenanceBlocks minus existing Bookings
- API endpoint for available slots per court per date
- Wire computed availability into court detail page from Phase 3
- Edge case testing: overlapping blocks, boundary times, fully booked days
Schema changes: No
Dependencies: Phase 3 complete

### Phase 5 — Booking Flow
Goal: Enable players to book a court, upload a payment receipt, and track booking status.
Scope:
- Booking creation endpoint (authenticated Player only)
- Booking status flow: PENDING_PAYMENT → PENDING_CONFIRMATION → CONFIRMED → CANCELLED
- Receipt image upload (scoped to booking owner, served via authenticated route)
- Player cancellation of upcoming bookings
Schema changes: No
Dependencies: Phase 4 complete

### Phase 6 — Owner Dashboard
Goal: Give the Court Owner full visibility and control over the facility's bookings.
Scope:
- Dashboard listing all bookings across the facility with filters (court, date, status)
- Confirm or reject booking after receipt review (status update endpoint)
- Authenticated receipt image viewing (owner-scoped)
Schema changes: No
Dependencies: Phase 5 complete

### Phase 7 — Notifications
Goal: Send transactional emails at key booking lifecycle events.
Scope:
- Integrate Resend (or equivalent transactional email provider)
- Booking confirmation email — triggered on owner confirmation
- Cancellation email — triggered on player or owner cancellation
- Upcoming reservation reminder email — sent ahead of booking start time
Schema changes: No
Dependencies: Phase 6 complete

### Phase 8 — Player Reservation Management
Goal: Give players a self-service hub for their booking history and cancellations.
Scope:
- Player reservations page with upcoming and past booking tabs
- Cancellation flow with confirmation step and policy display
- Booking status display (PENDING_PAYMENT, PENDING_CONFIRMATION, CONFIRMED, CANCELLED)
Schema changes: No
Dependencies: Phase 7 complete

### Phase 9 — Polish & Launch Prep
Goal: Harden the app for public launch with UI polish, error handling, and production configuration.
Scope:
- Error handling and loading states across all flows
- Responsive design pass (mobile-first for player-facing screens)
- Edge case handling (expired slots, double-booking race conditions, failed uploads)
- Vercel and Supabase production environment configuration
- End-to-end smoke testing of both Player and Court Owner flows
Schema changes: No
Dependencies: Phase 8 complete

## Risks & Open Questions

**Manual payment trust gap** — the QR code + receipt upload flow depends entirely on the owner reviewing and confirming payment manually. There is no fraud protection, payment guarantee, or automated dispute resolution in v1. Disputed bookings are handled out-of-band between player and owner.

**Race conditions on booking** — two players could attempt to book the same slot simultaneously. Booking creation must include a transaction-level availability check to prevent double-bookings; optimistic locking or a database-level unique constraint on court + time window is required.

**Image storage & access control** — receipt and QR code images must never be publicly accessible. Supabase Storage with Row Level Security (RLS) policies is the intended solution, but access control rules need explicit design before Phase 2 ships.

**Slot computation performance** — dynamic availability calculation is acceptable at v1 scale. Mitigate with indexes on `courtId` and `date` columns at launch. Revisit if query times degrade post-launch; pre-generation of slots is a fallback option.

**Cancellation policy enforcement** — cancellation policies are owner-defined text in v1 with no automated enforcement. Refunds are manual and handled out-of-band between the player and owner. Automated refund logic is a v2 consideration.

**Payment processor — v2 upgrade path** — the manual QR flow is intentional for the Philippine market in v1, where GCash and Maya are the dominant payment methods. Automated payments via PayMongo (which supports GCash and Maya natively) is the natural v2 upgrade path, rather than Stripe.

**Admin tooling gap** — no admin UI exists in v1; platform-level operations (approving facilities, resolving disputes, managing users) are handled directly in the database. This is acceptable for v1 but becomes an operational risk as facility and user counts grow.

**Email deliverability** — transactional emails via Resend require proper domain verification (SPF and DKIM records) before launch. Misconfigured DNS will cause confirmation and reminder emails to silently fail or land in spam, breaking a core part of the player experience.

**Open question — receipt image retention policy** — no retention or deletion policy is defined for player receipt images in v1. This is an open question: how long should receipts be stored after a booking is completed or cancelled? Undefined retention could become a storage cost and data privacy concern as booking volume grows.

## Claude Design Prompt

Build a single interactive mockup for **PaddleUp** — a dedicated court booking system for a single pickleball facility.

**App name:** PaddleUp
**One-sentence description:** A two-sided booking system where players browse and book pickleball courts and the facility owner manages availability and confirms reservations.

---

**Screens to include:**

Player-facing (mobile layout, bottom nav):
1. Login — email/password form + Google SSO, link to Register
2. Register — role picker (Player / Book Courts vs Owner / Manage courts), name/email/password fields
3. Landing / Search — hero with date+time filter, featured courts grid
4. Results — filtered court listing cards with name, price, surface type
5. Court Detail — court info, pricing, availability preview, Book button
6. Availability Picker — date selector + time slot grid, duration toggle
7. Booking Flow (3 steps): Step 1 — review booking summary + price breakdown; Step 2 — payment instructions with facility QR code; Step 3 — receipt upload + confirmation pending state
8. Reservations — upcoming and past tabs, booking cards with status chips (Pending Payment, Pending Confirmation, Confirmed, Cancelled)

Owner-facing (desktop layout, sidebar nav):
9. Booking Dashboard — table of all bookings with status filters, receipt preview modal, confirm/reject actions
10. Court Management — list of courts with edit/add, surface type, price per hour
11. Facility Setup — facility name, location, description, cancellation policy, QR code image upload

**Demo bar:** sticky top bar with Player / Owner role toggle and Reset button for prototype navigation.

---

**User roles and screen access:**
- Player accesses screens 1–8 (mobile view, bottom nav)
- Court Owner accesses screens 9–11 (desktop view, sidebar nav)
- Demo bar toggles between roles

---

**Key interactions:**
- Login/Register → enter app (Player lands on Landing, Owner lands on Booking Dashboard)
- Landing date/time filter → Results screen
- Court card click → Court Detail → Availability Picker → Booking Flow
- Booking Flow step progression via Continue button; back arrow returns to previous step
- Step 3 receipt upload shows file picker; submits to Pending Confirmation state
- Reservations tab switch between Upcoming and Past
- Owner Booking Dashboard: click booking row → receipt image modal → Confirm or Reject
- Demo bar role toggle switches full layout (mobile ↔ desktop)

---

**Design direction:**
- Color palette: background `#EBECE8` (warm off-white), dark nav `#1E222B` (near-black), accent `#FBA01E` (amber), teal link `#235C5E`, card white `#fff`, border `#E7E7E1`
- Typography: Space Grotesk (headings, buttons, logo), Hanken Grotesk (body, labels, inputs)
- Tone: clean and modern with a sporty warmth — not corporate, not loud; the amber accent provides energy without overwhelming
- Cards with soft border-radius (18–24px), subtle shadows, generous padding
- Player UI is mobile-width (~390px), bottom nav with 4 tabs; Owner UI is full-width desktop with left sidebar

---

**Output instruction:** single mockup.html file, all inline, no external CDN
