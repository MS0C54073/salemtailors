# Salem Tailors Lusaka

Digital shop-management platform for Salem Tailors, Lusaka. Replaces manual paper flows with an online catalogue, appointment booking, order tracking, real-time client chat, and staff dashboards — designed mobile-first and optimised for low-bandwidth Zambian networks.

Live: <https://salemtailors.lovable.app>

---

## Contents

- [What's in the box](#whats-in-the-box)
- [Architecture](#architecture)
- [Local development](#local-development)
- [Environment](#environment)
- [Production checklist](#production-checklist)
- [Operations runbook](#operations-runbook)
- [Scaling notes](#scaling-notes)
- [Supply-chain security](#supply-chain-security)
- [Testing & CI](#testing--ci)
- [Security memory](#security-memory)

---

## What's in the box

- **Public site** — landing page, catalogue, product detail, order tracking, booking.
- **Client dashboard** — orders, appointments, real-time chat with the tailor, profile & measurements.
- **Admin/staff dashboard** — orders, shop orders, appointments and slots, customers, portfolio, catalogue CMS, staff management, finance, messaging.
- **Roles** — `super_admin`, `admin`, `sub_admin`, `client` (see `mem://auth/role-hierarchy`).

---

## Architecture

```text
   Browser (React 18 + Vite 5 + TS + Tailwind + shadcn)
                       │
                       │  HTTPS (JWT via Supabase Auth)
                       ▼
          Lovable Cloud (managed Supabase)
          ├── Postgres  (RLS everywhere)
          ├── Auth      (email + Google OAuth)
          ├── Storage   (portfolio, catalogue, booking-images, garment-images)
          └── Edge Fns  (staff provisioning, admin ops)
```

Key modules:

- `src/App.tsx` — router; all non-landing routes are lazy-loaded to keep the initial JS budget small on 3G.
- `src/components/ErrorBoundary.tsx` — top-level crash guard with reload-and-recover.
- `src/lib/logger.ts` — pluggable logger (console + localStorage ring buffer in prod; Sentry drop-in point).
- `src/lib/queryClient.ts` — TanStack Query defaults tuned for lossy mobile networks.
- `src/lib/imageCompress.ts` — client-side image downscale before upload.
- `supabase/migrations/*.sql` — every schema change; `upsert_catalogue_item` is the atomic save RPC for the catalogue admin.

---

## Local development

```bash
bun install
bun run dev          # http://localhost:8080
bun run lint
bunx tsc --noEmit    # typecheck
bunx vitest run      # tests
bun run build        # production bundle
```

Node 20 pinned in CI. Bun is the local package manager; the lockfile is `bun.lock`.

---

## Environment

Lovable Cloud injects these automatically in the sandbox and production build. Do not commit real values.

| Var                            | Where               | Purpose                                    |
| ------------------------------ | ------------------- | ------------------------------------------ |
| `VITE_SUPABASE_URL`            | client + edge       | Backend URL                                |
| `VITE_SUPABASE_PUBLISHABLE_KEY`| client              | Public anon key (safe in bundle)           |
| `SUPABASE_SERVICE_ROLE_KEY`    | edge functions only | Server-side privileged operations          |
| `LOVABLE_API_KEY`              | edge functions      | Lovable AI gateway auth                    |

`SUPABASE_SERVICE_ROLE_KEY` and DB password are **inaccessible on Lovable Cloud** — never log them, never return them from an edge function, never write them into client code.

---

## Production checklist

Run through this **before every release**.

- [ ] `bun run lint`, `bunx tsc --noEmit`, `bunx vitest run`, `bun run build` all green locally
- [ ] CI green (`.github/workflows/ci.yml`)
- [ ] Latest security scan has **zero unresolved critical findings** (see `mem://security/security-memory`)
- [ ] All new tables have `GRANT` statements and RLS policies in the same migration
- [ ] No SECURITY DEFINER function is callable without an `is_staff()` / `auth.uid()` check
- [ ] Google OAuth provider configured in Lovable Cloud → Auth (else first sign-in errors "Unsupported provider")
- [ ] `redirect_uri` for OAuth points to `window.location.origin`, not a protected route
- [ ] Storage buckets: `catalogue`, `portfolio` public; `booking-images`, `garment-images` private with RLS
- [ ] SBOM workflow (`.github/workflows/sbom.yml`) has run on the release tag and produced signed artifacts
- [ ] `README.md`, `docs/sbom.md`, security memory reflect what actually ships
- [ ] `index.html` `<title>`, meta description, OG/Twitter tags are the current, correct copy
- [ ] Manual smoke test: sign in as client → book slot → place shop order → track order; sign in as admin → open catalogue → edit an item → verify images/variants intact after save

---

## Operations runbook

Playbooks for the on-call operator. Keep this section short and factual.

### Incident: site is down

1. Check <https://status.lovable.dev> and the Lovable Cloud project status.
2. If Cloud is healthy, check the browser preview and the console for a red banner. Take a screenshot.
3. Pull the last 50 in-browser log entries via DevTools:
   ```js
   copy(localStorage.getItem('salem-logs'))
   ```
4. Roll back by re-publishing the previous good commit from the Lovable dashboard.

### Incident: catalogue update crashed / images disappeared

The catalogue save is now **atomic** — `upsert_catalogue_item` commits item, gallery, and variants in a single Postgres transaction. If a save fails, the previous state is preserved. Ask the user to reload; their data is intact. If the RPC itself failed, the dialog stays open with the error inline — copy that message and open a ticket.

### Rotating the anon (publishable) key

Anon keys are safe in client bundles but rotate them if a workspace leak is suspected.

1. Lovable dashboard → Cloud → API keys → Rotate publishable key.
2. Republish the frontend to pick up the new key.
3. Old key becomes invalid within a minute.

The **service role key** and DB password are managed by Lovable Cloud and cannot be fetched. Contact Lovable support if you need them rotated.

### Restoring a deleted catalogue item

Deletes cascade to gallery and variants. If you need to recover a deleted item, contact Lovable support for a point-in-time restore of the `catalogue_items`, `catalogue_item_images`, `catalogue_item_variants` rows. The `id` column is a UUID; keep any known IDs handy.

### Redeploying after a bad release

1. Lovable dashboard → project → History.
2. Pick the last known-good commit → "Restore".
3. Click **Publish**. Frontend is live within ~1 minute; edge functions and migrations deploy automatically.

### Reading in-browser logs

Every unexpected error is written to `localStorage['salem-logs']` (ring buffer, last 50 entries). Ask the reporter to open DevTools → Console and run:

```js
copy(JSON.stringify(JSON.parse(localStorage.getItem('salem-logs')), null, 2))
```

then paste the result into the ticket.

### Contacting Lovable support

For anything that requires cloud-side action (DB restore, key rotation of service_role, larger instance, custom domain DNS): open a ticket at <https://lovable.dev/support>.

---

## Scaling notes

**Current defaults** are tuned for a Lusaka shop with hundreds of catalogue items, low hundreds of concurrent visitors, and phone-first traffic.

### When to upsize the Cloud instance

Symptoms of an undersized instance: intermittent 500s from the Data API, slow dashboards despite fast queries, `db_health` reporting saturated CPU/RAM.

- Lovable dashboard → Cloud → Overview → Advanced → pick a larger instance size.
- No code change needed. Costs go up linearly; see <https://docs.lovable.dev/integrations/cloud>.

### Database indexes (already applied)

Hot-path indexes exist for: `catalogue_items(status, display_order)`, featured items, `catalogue_item_images(item_id, display_order)`, `catalogue_item_variants(item_id, display_order)`, `shop_orders(status, created_at DESC)`, `appointment_slots(slot_at)`, `garment_requests(status, created_at DESC)`, `messages(garment_request_id, created_at)`.

Add new indexes via a migration; never `CREATE INDEX CONCURRENTLY` inside a migration transaction.

### Pagination thresholds

Admin lists page at 25 rows with **Load more**. Bump `PAGE_SIZE` in the page component if the shop routinely holds >500 items and admins scroll deep.

### Images

- Uploads are downscaled client-side to a 1600px longest edge, JPEG q=0.82 (`src/lib/imageCompress.ts`). This is the single biggest reliability win on 3G/4G.
- Public buckets serve directly from Supabase Storage. For scale beyond ~1 GB/day egress consider fronting `catalogue` and `portfolio` with a CDN (Cloudflare R2 + Workers is the cheapest path); the app reads `getPublicUrl()` so swapping the base URL is a one-line change.

### Low-bandwidth defaults

- React Query: `retry: 2` with exponential backoff, `staleTime: 30s`, `refetchOnWindowFocus: false`.
- Route-level code splitting via `React.lazy`; the landing page ships a minimal initial bundle.
- `loading="lazy"` on all gallery images.

---

## Supply-chain security

Every release produces signed SBOMs (CycloneDX + SPDX) via `.github/workflows/sbom.yml`, signed keyless with Sigstore cosign and logged to the public Rekor transparency log. Verification steps are in [`docs/sbom.md`](docs/sbom.md).

Vulnerable-dependency response process is documented in the same file. Dependabot (`.github/dependabot.yml`) opens weekly grouped PRs for minor/patch updates and immediate PRs for security advisories.

---

## Testing & CI

- **Unit tests** — `bunx vitest run`. Setup at `src/test/setup.ts`; example test at `src/hooks/useShopOrderAlerts.test.tsx`.
- **CI gates** — `.github/workflows/ci.yml` runs lint + typecheck + tests + build on every push and PR. Concurrency group cancels superseded runs.
- **SBOM + signing** — `.github/workflows/sbom.yml` on tag/release/manual dispatch.

---

## Security memory

Long-lived security guidance for this codebase is captured in `mem://security/security-memory` and is co-maintained with the Lovable agent. When a security decision is made (a finding ignored, a policy tightened, a threat model updated), that document is updated in the same PR.

Latest security scan status: **all findings resolved as of 2026-06-26**.

---

## License

Proprietary — Salem Tailors Lusaka. All rights reserved.
