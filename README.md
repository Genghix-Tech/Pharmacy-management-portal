# PharmaFlow

**Everything your pharmacy needs, in one place.**

PharmaFlow is a multi-tenant pharmacy management SaaS: inventory, POS/billing, sales, invoices,
purchases, suppliers, customers, expenses, reports, staff roles and settings — built with
Next.js, TypeScript, Tailwind CSS, shadcn/ui and Supabase (Postgres + Auth + Row Level Security).

Every pharmacy owner gets their own secure workspace. Row Level Security guarantees one
pharmacy's data — medicines, sales, customers, everything — is never visible to another.

## Tech stack

- **Next.js 16** (App Router, Server Actions, Turbopack)
- **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (built on [Base UI](https://base-ui.com))
- **Supabase**: Postgres, Auth, Row Level Security
- **Recharts** for charts, **date-fns** for dates, **Zod** for validation

No other backend, no ORM, no service-role key in the app — every read/write goes through the
Supabase client as the signed-in user, gated by RLS and by transactional Postgres functions for
anything that touches money or stock (checkout, refunds, purchases, stock adjustments).

---

## 1. Install dependencies

```bash
npm install
```

## 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project (pick any region).
2. Once it's provisioned, open **Project Settings → API** and copy:
   - **Project URL**
   - **anon / public** key

You won't need the service-role key anywhere — this app never uses it.

## 3. Configure the database

The full schema (tables, indexes, RLS policies, and the Postgres functions that back checkout,
purchases, refunds, stock adjustments, staff management and demo data) lives in
`supabase/migrations/`, in order:

| File | What it does |
|---|---|
| `0001_extensions_and_helpers.sql` | Extensions + a shared `updated_at` trigger |
| `0002_tables.sql` | All tables, indexes, `updated_at` triggers |
| `0003_rls.sql` | Row Level Security policies + membership helper functions |
| `0004_business_logic.sql` | Signup trigger, `medicine_status` view, and the `create_sale` / `create_purchase` / `refund_sale` / `adjust_stock` / `record_purchase_payment` transactional functions |
| `0005_grants.sql` | Explicit table grants (belt-and-suspenders alongside RLS) |
| `0006_seed_demo_data.sql` | The `seed_demo_data(pharmacy_id)` function used by the in-app "Load demo data" button |
| `0007_staff.sql` | `add_staff_by_email` / `update_staff_role` — staff management without a service-role key |

### Option A — Supabase CLI (recommended)

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

### Option B — SQL editor

Open **SQL Editor** in the Supabase dashboard and run each file in `supabase/migrations/` in
order (0001 → 0007), pasting and running one at a time.

### Confirm email or disable it for local testing

By default Supabase requires email confirmation before sign-in. That's the right choice in
production; for quick local testing you can turn it off under **Authentication → Providers →
Email → Confirm email**.

### (Optional) exact generated types

`src/lib/types/database.ts` is hand-written to match the schema above (see the comment at the
top of the file for why). Once your project is linked, you can swap it for the exact generated
types any time:

```bash
npx supabase gen types typescript --linked > src/lib/types/database.ts
```

## 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_SITE_URL` is used to build the email confirmation / password reset redirect links —
set it to your real domain in production (see step 7).

## 5. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`, click **Start Managing Your Pharmacy**, and sign up. Signing up
automatically creates your pharmacy and makes you its owner (see the `handle_new_user` trigger in
`0004_business_logic.sql`). Once inside, click **Load demo data** on the empty dashboard for a
realistic catalogue (24 medicines, suppliers, customers, ~45 sales, purchases and expenses) to
explore every screen immediately.

## 6. Build for production

```bash
npm run build
npm run start
```

## 7. Deploy to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Vercel, **Add New → Project**, import the repo (Next.js is auto-detected, no config needed).
3. Add the same three environment variables from step 4 under **Project Settings → Environment
   Variables** — set `NEXT_PUBLIC_SITE_URL` to your Vercel URL (e.g. `https://pharmaflow.vercel.app`).
4. Deploy.
5. Back in Supabase, add your Vercel URL under **Authentication → URL Configuration → Redirect
   URLs** (needed for email confirmation and password reset links to work), e.g.
   `https://pharmaflow.vercel.app/auth/callback`.

No further configuration is needed — there's no filesystem storage, no server-only secrets beyond
the two public Supabase keys, and every Server Action/Route Handler is compatible with Vercel's
serverless runtime.

---

## Roles & permissions

Every pharmacy account can add staff (Settings → visible to owners as **Staff**) with one of four
roles. Enforcement is defense-in-depth: the sidebar hides sections a role can't use, every page
re-checks the role server-side, and sensitive tables (`pharmacy_users`) are further restricted at
the database level via RLS — a role's boundaries hold even if someone calls the API directly.

| Role | Access |
|---|---|
| **Owner** | Everything, including Staff and pharmacy Settings |
| **Manager** | Everything except Staff management |
| **Cashier** | Dashboard, POS, Sales, Invoices, Customers |
| **Inventory Manager** | Dashboard, Inventory, Medicines, Categories, Purchases, Suppliers |

Adding a staff member requires them to have signed up for PharmaFlow already — the owner adds
them by email; there's no separate invite-and-create-account flow (and no service-role key was
used to build one).

## Project structure

```
src/
  app/                    Routes (App Router)
    (auth)/               Login, signup, forgot/reset password, verify email
    dashboard/            Everything behind auth — one folder per module
    invoices/[id]/print/  Standalone printable invoice (A4 + receipt view)
    auth/callback/        Supabase email-link handler
  components/
    ui/                   shadcn/ui primitives (Base UI under the hood)
    <feature>/             Feature-specific components (medicines, pos, sales, …)
    shared/                Cross-feature building blocks (empty states, status badges, …)
  lib/
    actions/               Server Actions — one file per domain, all Zod-validated
    supabase/               Browser/server Supabase clients, session-refresh proxy, queries
    types/database.ts       Hand-written types mirroring the SQL schema
    utils/                  Formatting, permissions, status/badge metadata
  proxy.ts                  Session refresh + route protection (Next 16's renamed middleware)
supabase/migrations/         The full SQL schema, RLS policies and business-logic functions
```

## Notes on a few deliberate design choices

- **Money-moving operations are Postgres functions, not client-side inserts.** POS checkout,
  purchases, refunds and stock adjustments (`supabase/migrations/0004_business_logic.sql`) each
  run as one atomic, row-locked transaction — no half-completed sale from a dropped connection,
  no overselling under concurrent checkouts.
- **PDF export uses the browser's print dialog**, not a PDF library — "Download PDF" on an
  invoice or report opens print preview where "Save as PDF" produces a clean, correctly laid out
  file. Invoices also offer a receipt-width view for thermal printers.
- **Barcode scanning** uses the browser's native `BarcodeDetector` API (Chrome/Edge, desktop and
  Android) with the camera, and always falls back to manual entry — including on Safari/iOS,
  which doesn't implement that API yet.
- **The empty dashboard doesn't fake numbers.** A brand-new pharmacy sees an honest empty state
  with a one-click **Load demo data** button (backed by `seed_demo_data`) rather than invented
  stats that don't match what's actually in the database.
- **Customer "outstanding balance" is always $0.** The POS requires full payment at checkout —
  there's no store-credit/accounts-receivable system. Supplier outstanding balances are real
  (`purchases.amount_paid` vs. `total_amount`), since purchases can legitimately be recorded
  before they're paid.
- Pharmacy/user avatars and the pharmacy logo are plain URL fields rather than a file upload —
  wiring up Supabase Storage for real uploads is a natural next step if you need it.

## License

Provided as-is for the requesting user.
