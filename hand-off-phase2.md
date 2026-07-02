# Phase 2 Handoff — Facility & Court Management

Status: **done**. Court Owner can edit the facility profile, upload a payment QR code, and create/edit courts — all owner-scoped and server-enforced.

## What's built

**Facility API**
- [src/app/api/facility/route.ts](src/app/api/facility/route.ts) — `GET` reads the single facility (name, location, description, cancellationPolicy, `hasQrCode` boolean); `PATCH` updates it. No create endpoint — facility is pre-seeded (Phase 1).
- [src/app/api/facility/qr-code/route.ts](src/app/api/facility/qr-code/route.ts) — `POST` (multipart `file` field) uploads a PNG/JPEG/WebP, max 2MB; `GET` serves it back as raw image bytes.
  - **Storage decision:** the QR image is stored as a base64 data URI directly in the existing `Facility.qrCodeImage` text column — no Supabase Storage bucket, no schema change. It's never a public URL; the `GET` route re-checks the owner session on every request before returning bytes. This was the pragmatic v1 call over standing up Storage + RLS (which the plan flagged as an open design question) — revisit if QR/receipt images grow past a few hundred KB or volume gets large, since base64-in-Postgres doesn't scale like object storage.

**Court API**
- [src/app/api/courts/route.ts](src/app/api/courts/route.ts) — `GET` lists all courts for the facility; `POST` creates one (name, surfaceType, pricePerHour).
- [src/app/api/courts/[id]/route.ts](<src/app/api/courts/[id]/route.ts>) — `GET`/`PATCH` a single court, scoped to `facilityId` so a court from another facility (there isn't one, but defense-in-depth) can't be read/edited.

**Access control**
- All four route files call `auth()` and check `session.user.role === "COURT_OWNER"` directly, in addition to the existing `middleware.ts` prefix guard (`/api/facility`, `/api/courts` were already in `OWNER_ROUTE_PREFIXES` from Phase 1) — belt-and-suspenders since middleware matcher misconfiguration is an easy way to silently open a route.
- Verified live: owner session → 200s on all routes; a freshly-registered Player session → 307 redirect (blocked by middleware before reaching the route).

**Owner UI**
- [src/app/owner/layout.tsx](src/app/owner/layout.tsx) — desktop shell, dark sidebar, nav links to Facility Setup and Courts, sign-out button. No auth check in the layout itself — relies on `middleware.ts` already gating `/owner/*`.
- [src/app/owner/facility/page.tsx](src/app/owner/facility/page.tsx) — facility edit form + QR upload with live preview (`<img src="/api/facility/qr-code">`, cache-busted with a timestamp query param since the browser would otherwise cache the old image at the same URL after a re-upload).
- [src/app/owner/courts/page.tsx](src/app/owner/courts/page.tsx) — add-court form + court list with inline edit-in-place (click Edit → row becomes a form, Save/Cancel). No delete endpoint — plan only calls for create/edit in Phase 2.
- [src/components/ui/textarea.tsx](src/components/ui/textarea.tsx) — new base component, same pattern as `input.tsx`, needed for description/cancellation-policy fields.
- Surface type uses a plain native `<select>` styled to match `Input` rather than pulling in `@radix-ui/react-select` — avoided adding a dependency for one dropdown.

## Known gotchas hit during this phase

1. **Outbound HTTP from Bash/PowerShell got intercepted mid-testing.** Partway through verification, `curl` and PowerShell's `HttpClient`/`Invoke-WebRequest` started returning a bare `500 Internal Server Error` for the QR multipart upload with *no corresponding request in the Next dev server log* — meaning something on this machine (likely a local proxy/interceptor tied to the `context-mode` tooling) was swallowing certain outbound calls before they reached `localhost`. Switched to `ctx_execute` (Node `fetch`/`FormData` inside the sandboxed tool) and the same request succeeded immediately. If you hit an unexplained 500 with zero server-side log line during local testing on this machine, suspect this before debugging the route code.
2. **QR preview caching.** `<img>` tags cache aggressively by URL; the facility page appends `?t=${Date.now()}` to the QR src after upload so the new image actually shows without a hard refresh.

## How to verify manually

```bash
npm run dev
# log in as the seeded Court Owner (OWNER_EMAIL / OWNER_PASSWORD from .env)
# visit /owner/facility — edit details, upload a QR image
# visit /owner/courts — add a court, edit its price/surface
```

## Not built (Phase 3+)

- Public court browsing/search (Phase 3)
- Availability computation engine (Phase 4)
- Booking flow, receipt upload (Phase 5)
- Owner dashboard — booking list/filters, confirm/reject (Phase 6)
- Email notifications (Phase 7)
- Player reservation management UI (Phase 8)
- Polish/launch hardening (Phase 9)
- Court delete (not in Phase 2 scope; add if the plan calls for it later)

See [plan.md](plan.md) for full phase breakdown.
