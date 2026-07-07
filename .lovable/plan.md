
## 1. Catalogue stability (real bug found in `AdminCatalogue.tsx → save()`)

The current save:
- DELETEs `catalogue_item_images` and `catalogue_item_variants`, then INSERTs replacements — no transaction. If the second insert fails (network blip, RLS, row size), **the user permanently loses all gallery images and variants** they had on that item.
- No try/catch around any supabase call: any thrown promise bubbles to React and unmounts the dialog mid-save.
- Storage uploads write straight to the `catalogue` bucket with no client-side compression — on a 3G/4G Lusaka connection a 12 MB phone photo just times out and the user retries forever.
- Image upload doesn't release object URLs and re-uploads the same file on retry.

Fixes:
- Wrap the entire save in a single RPC `upsert_catalogue_item(item jsonb, images jsonb, variants jsonb)` (SECURITY DEFINER, staff-only) so item + images + variants commit atomically. Frontend calls one RPC; on failure nothing is destroyed.
- Add a `try/catch/finally` around save with toast on error, `setSaving(false)` in finally, and keep the dialog open on failure so the user can retry.
- Client-side image downscale to max 1600px JPEG ~0.82 quality using a tiny canvas helper before upload (no new deps). Skip downscale for files already under 400 KB.
- Disable Save while `uploading || saving`; show inline error region inside the dialog (not just a toast).

## 2. Observability

- Add `src/components/ErrorBoundary.tsx` and wrap the router in `App.tsx`. Friendly fallback + "Reload" button. Logs error + componentStack via the logger below.
- Add `src/lib/logger.ts`: thin wrapper with `info/warn/error`. In dev → console. In prod → console + `localStorage` ring buffer (last 50 entries) so admins can paste logs when reporting issues. Hook is provider-agnostic so Sentry can be dropped in later by editing one file.
- Add `src/lib/queryClient.ts` central React Query config: `retry: 2`, `retryDelay: exponential`, `staleTime: 30s`, `refetchOnWindowFocus: false` (better for low bandwidth). Reuse existing QueryClient if already wired in `App.tsx`; otherwise migrate it.
- Toast every supabase mutation failure via a small `withToast()` helper to stop swallowed errors.

## 3. CI/CD hardening

New `.github/workflows/ci.yml`:
- Jobs: `lint`, `typecheck` (`tsgo --noEmit`), `test` (`vitest run`), `build` (`vite build`). Bun cache. Fails PRs.
- Node matrix pinned to 20.
- Concurrency group cancels superseded runs.

New `.github/dependabot.yml`:
- Weekly updates for `npm` and `github-actions`, grouped minor/patch, security updates immediate.

Existing `sbom.yml` is left alone (already signed).

## 4. Performance & scale

DB migration:
- `CREATE INDEX` on hot filter/sort columns:
  - `catalogue_items (status, display_order)`
  - `catalogue_items (is_featured) WHERE is_featured`
  - `catalogue_item_images (item_id, display_order)`
  - `catalogue_item_variants (item_id, display_order)`
  - `shop_orders (status, created_at DESC)`
  - `appointment_slots (slot_at)`
  - `garment_requests (status, created_at DESC)`
  - `messages (request_id, created_at)`
- Add the `upsert_catalogue_item` RPC from §1.

Frontend:
- Route-level code splitting: convert dashboard pages to `React.lazy` with a `<Suspense>` skeleton — cuts initial JS for clients hitting `/` on 3G.
- `AdminShopOrders`, `AdminCatalogue`, `AdminSlots`: add pagination (range queries, 25/page) with "Load more". Keeps payload small as the shop grows.
- Public `Catalogue.tsx`: switch image `<img>` to `loading="lazy" decoding="async"` and add `fetchpriority="high"` on the LCP hero only.

## 5. README rewrite

Full rewrite covering:
- What the app is (Salem Tailors Lusaka).
- Local development quick-start.
- Architecture diagram (ASCII): React/Vite SPA → Lovable Cloud (Postgres + Auth + Storage + Edge Functions).
- **Production checklist**: env vars, RLS verified, Google OAuth configured, redirect URIs, storage bucket policies, backups, SBOM signing.
- **Operations runbook**: incident response, rotating the anon key, restoring a deleted catalogue item, redeploying after a bad release, reading the localStorage logs, contacting Lovable support.
- **Scaling notes**: when to upsize the Cloud instance, image CDN guidance, current query indexes, pagination thresholds, low-bandwidth (3G/4G Lusaka) defaults.
- Supply-chain (links to existing `docs/sbom.md`).
- Security memory pointer.

## Files touched

```text
new   supabase/migrations/<ts>_hardening_indexes_and_catalogue_rpc.sql
new   .github/workflows/ci.yml
new   .github/dependabot.yml
new   src/components/ErrorBoundary.tsx
new   src/lib/logger.ts
new   src/lib/imageCompress.ts
edit  src/pages/dashboard/AdminCatalogue.tsx   (RPC save, try/catch, compress, pagination)
edit  src/pages/dashboard/AdminShopOrders.tsx  (pagination)
edit  src/pages/dashboard/AdminSlots.tsx       (pagination)
edit  src/pages/Catalogue.tsx                  (lazy images, LCP hint)
edit  src/App.tsx                              (ErrorBoundary, React.lazy routes, QueryClient config)
edit  README.md                                (full rewrite)
```

No business-logic changes outside the catalogue save path. RLS and roles untouched.

## What I will NOT do in this pass

- Wire an actual Sentry/PostHog DSN (logger is provider-agnostic; user can add later).
- Add a CDN in front of Supabase storage (recommended in README only).
- Touch auth, roles, or shop-order business rules.
- Re-run security scan (last pass closed all findings; nothing changed here that opens a new one).
