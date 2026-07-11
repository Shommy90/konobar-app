<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Konobar

Multi-tenant SaaS for QR table ordering: guests scan a table's QR code, browse the menu, and order; staff see orders in real time. Currently in early sprints — auth, roles, admin/owner tooling, the guest-facing menu, guest cart/ordering, and the realtime staff dashboard are all in place; POS/payments/analytics are not built yet.

## Tech stack

- Next.js 16 (App Router, Turbopack) + TypeScript + React 19
- Supabase: Postgres, Auth, Row Level Security (`src/lib/supabase/client.ts` browser, `server.ts` server components/actions, `admin.ts` service-role, server-only)
- MUI v9 for components + Tailwind v4 for utilities (Tailwind preflight disabled so it doesn't fight MUI's `CssBaseline`)
- `qrcode` for server-side QR PNG generation
- ESLint + Prettier

## Architecture notes

- Roles: `profiles.role` is `SUPER_ADMIN` / `OWNER` / `STAFF`; `OWNER`/`STAFF` are scoped to one `restaurant_id`. Enforced both by RLS policies and by re-deriving `restaurant_id` server-side in every action (never trusted from the client).
- Route protection: each protected page is a Server Component calling `getCurrentProfile()` and redirecting to `/login` if the role doesn't match.
- SQL migrations live in `supabase/migrations/`, run manually via the Supabase SQL Editor (no CLI linkage yet).
- Guest-facing routes (`/r/[restaurantSlug]/table/[tableToken]`) are unauthenticated; narrow `to anon` RLS policies expose just enough for that page to work.
- Guests have no login. Anon RLS on `orders`/`order_items` stays broad (`using (true)` for reads) since RLS has no per-guest identity to check against - see the comment block in `0009_ordering_rls.sql`. `table_sessions` itself, though, has zero anon policies (tightened in `0015_guest_ordering_sessions.sql`): every guest read/write to it goes through SECURITY DEFINER RPCs (`resolve_guest_session`, `get_my_session`, `place_guest_order`, `request_guest_bill`, `guest_call_waiter`) keyed off a random `guest_device_token` the browser generates and caches in `localStorage` (`src/lib/guestDeviceToken.ts`, per table) - this is what lets a second phone ordering at the same table automatically take over the session (closing the first one) while never exposing one device's session to another. Table sessions are valid for 2 hours after the *last successful order* (`table_sessions.expires_at`, `SESSION_TIMEOUT_HOURS` in `src/lib/tableSession.ts`), checked lazily by the RPCs rather than a background job; a device whose session has ended stays locked out under that same `localStorage` token until it's cleared or a different device is used, since an app can't reliably tell a QR rescan apart from a plain page refresh. `place_guest_order`/`resolve_guest_session` take a `pg_advisory_xact_lock` per `table_id` to keep the "close old session, open new one, attach the order" takeover atomic and race-safe against two devices ordering at once.
- Guest order pricing is always re-derived server-side from current `menu_products` rows in the `placeOrder` action - client-submitted prices are never trusted, only `productId` + `quantity`.
- Staff dashboard realtime: Supabase Postgres Changes on `orders`/`service_requests`, filtered by `restaurant_id`. On any INSERT/UPDATE the client refetches the full dashboard snapshot via a server action (`refreshStaffDashboard`) rather than trying to hand-patch partial realtime payloads - simpler and avoids missing joined data (order items, table names). Both tables must be added to the `supabase_realtime` publication (done in `0010_staff_dashboard.sql`); RLS's existing SELECT policies are what scope which rows a given STAFF/OWNER actually receives.
- Timestamps rendered in a Client Component that arrive via _initial_ server-rendered props (not fetched client-side post-mount) must never call `.toLocaleDateString()`/`.toLocaleTimeString()` directly - Node's default locale/timezone can differ from the browser's, causing a hydration mismatch (hit this twice: Sprint 4's `RestaurantsTable`, fixed via `src/lib/formatDate.ts`; the staff `OrderCard` gates local-time formatting behind `useNow()`'s client-only tick instead). Timestamps fetched client-side after mount (e.g. `OrderStatusDialog`) are safe to format directly since they never render during SSR.
- This ESLint config's `react-hooks/set-state-in-effect` and `react-hooks/refs` rules are stricter than typical: no synchronous `setState` in an effect body (defer via `.then()`/`setTimeout(0)`, or better, use a `useState(() => ...)` lazy initializer if the value is synchronously derivable) and no mutating a ref during render (do it inside an effect, or make the value a `useCallback` instead if it doesn't actually need to change).
- No STAFF accounts or STAFF login for now - only SUPER_ADMIN and OWNER log in. OWNER's own session is what the shared staff tablet uses to access `/staff`. `profiles.role` keeps the `STAFF` value reserved in the schema in case a dedicated staff login (managed from `/owner`) gets added later.

## Progress log

**Sprint 1 — Foundation**: Next.js + TS scaffold, MUI + Tailwind setup, Supabase client helpers, placeholder routes for `/`, `/login`, `/super-admin`, `/owner`, `/staff`, `/r/[restaurantSlug]/table/[tableToken]`.

**Sprint 2 — Auth & multi-tenant roles**: `profiles`/`restaurants`/`subscriptions` tables with RLS, Supabase email/password auth, `AuthProvider` context, server-side role guards on all dashboard routes.

**Sprint 3 — Super Admin panel**: dashboard stat cards, restaurants table with activate/disable, create/edit restaurant (+ subscription row), owner account creation via the Supabase Auth admin API (service-role key, server-only), restaurant details page.

**Sprint 4 — Owner dashboard, tables & QR**: `restaurant_tables` table with RLS, `/owner` dashboard, `/owner/tables` management (create/edit/activate/delete tables), server-generated QR codes with copy/download/print, guest landing page validates restaurant/table and shows "Menu coming soon".

**Sprint 5 — Menu management & guest menu display**: `menu_categories`/`menu_products` tables with RLS (including `to anon` public-read policies scoped to active categories/available products), `/owner/menu` for creating/editing categories and products (activate/deactivate, mark available/popular, manual sort order, delete), guest page now renders the actual menu grouped by category instead of the "coming soon" placeholder. No cart/ordering yet.

**Sprint 5.1 — Product images via Supabase Storage**: replaced the manual `image_url` text field with real uploads to a `product-images` Storage bucket (`restaurants/{restaurantId}/products/{productId}/{uuid}.webp`), stored as `menu_products.image_path`. Storage RLS mirrors the DB pattern (SUPER_ADMIN full access, OWNER scoped to their own restaurant folder via `storage.foldername()`, public read). Client-side resize/compress to WebP (max 1200x1200, 5MB source limit) before upload — no binary/base64 ever touches Postgres. Upload → DB update → delete-old-object ordering, so a failed step never orphans data either direction.

**Sprint 6 — Guest cart, table sessions & ordering**: `table_sessions`/`orders`/`order_items`/`service_requests` tables with RLS. Guest page auto-opens (or resumes) an anonymous `ACTIVE` table session on load — race-safe via a partial unique index (one `ACTIVE` session per table) plus a 6-hour staleness timeout (`SESSION_TIMEOUT_HOURS` in `src/lib/tableSession.ts`) that auto-closes and replaces stale sessions. Guests get a mobile-first cart (localStorage-persisted, sticky "View Cart" bar), place orders (server re-derives prices from `menu_products`, never trusts the client), see order status and an aggregated current-bill view, and can call a waiter or request the bill (which locks further ordering by flipping the session to `REQUESTED_BILL`, without auto-closing it). No staff dashboard, order acceptance, realtime, or payments yet — that's Sprint 7.

**Sprint 7 — Realtime staff tablet dashboard**: `/staff` rebuilt as a tablet-first (landscape, big buttons) live board — New Orders / Active Orders / Ready columns, Service Requests, Active Tables overview. Supabase Realtime (Postgres Changes on `orders`/`service_requests`) pushes updates instantly; STAFF got write access to orders/table_sessions/service_requests for the first time (previously read-only) via `0010_staff_dashboard.sql`, and OWNER can use the same dashboard. New orders trigger a generated Web Audio beep (no sound file asset) with a persisted on/off toggle - sound never plays for orders already on-screen at load, only ones that arrive afterward. Staff can accept/cancel/mark-ready/mark-delivered orders, resolve call-waiter/bill requests, and close table sessions (which immediately blocks the guest's `ACTIVE`-gated ordering, per Sprint 6's `placeOrder` check).

**Sprint 7.1 — Deferred STAFF accounts/login**: tried OWNER-created STAFF accounts with nickname login (`0011_owner_staff_management.sql`, `0012_staff_nickname_login.sql`), then decided to defer it — reverted via `0013_revert_staff_login.sql` (drops `profiles.nickname` and the owner-insert-staff policy). For now only SUPER_ADMIN and OWNER log in; OWNER's session is shared on the staff tablet. `STAFF` stays in the `profiles.role` enum for whenever staff-specific login is revisited.

**Sprint 7.2 — Rolling per-device table sessions**: reworked table-session rules per new business requirements (`0014_table_session_expired_status.sql`, `0015_guest_ordering_sessions.sql`) — a session now stays valid 2 hours after its last successful order (not idle activity), is bound to one `guest_device_token` per browser, and automatically gets replaced (closed + a fresh session opened) the moment a second device orders at the same table, atomically with that order. Requesting the bill now hard-blocks further ordering immediately. All of this now happens through SECURITY DEFINER RPCs instead of direct anon table access — closes a real hole where anon could previously update any table's session via a broad `using (true)` policy. See the Architecture notes entry above for the device-token/rescan-vs-refresh trade-off. Guest UI gained a dedicated "this visit has ended" lock screen (`SessionEndedScreen.tsx`) and a ~15s poll (`pollGuestSession`) so a stale-but-open tab notices a staff close or expiry without a manual reload.

_Update this log after every sprint or major feature — keep entries short (tech + what shipped), not a full changelog._
