<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Konobar

Multi-tenant SaaS for QR table ordering: guests scan a table's QR code, browse the menu, and order; staff see orders in real time. Currently in early sprints — auth, roles, admin/owner tooling, and the guest-facing menu display are in place; cart/ordering is not built yet.

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

## Progress log

**Sprint 1 — Foundation**: Next.js + TS scaffold, MUI + Tailwind setup, Supabase client helpers, placeholder routes for `/`, `/login`, `/super-admin`, `/owner`, `/staff`, `/r/[restaurantSlug]/table/[tableToken]`.

**Sprint 2 — Auth & multi-tenant roles**: `profiles`/`restaurants`/`subscriptions` tables with RLS, Supabase email/password auth, `AuthProvider` context, server-side role guards on all dashboard routes.

**Sprint 3 — Super Admin panel**: dashboard stat cards, restaurants table with activate/disable, create/edit restaurant (+ subscription row), owner account creation via the Supabase Auth admin API (service-role key, server-only), restaurant details page.

**Sprint 4 — Owner dashboard, tables & QR**: `restaurant_tables` table with RLS, `/owner` dashboard, `/owner/tables` management (create/edit/activate/delete tables), server-generated QR codes with copy/download/print, guest landing page validates restaurant/table and shows "Menu coming soon".

**Sprint 5 — Menu management & guest menu display**: `menu_categories`/`menu_products` tables with RLS (including `to anon` public-read policies scoped to active categories/available products), `/owner/menu` for creating/editing categories and products (activate/deactivate, mark available/popular, manual sort order), guest page now renders the actual menu grouped by category instead of the "coming soon" placeholder. No cart/ordering yet.

_Update this log after every sprint or major feature — keep entries short (tech + what shipped), not a full changelog._
