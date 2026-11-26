# STARPEAK Media — website

Website for STARPEAK Media, an AI advertising film studio. It includes the homepage, film packages, ₹99 paid consultation booking, project inquiries, private project payment links, and the legal pages.

**Stack:** React + TypeScript + Vite + Tailwind CSS (frontend) · Vercel Functions in `/api` (backend) · Supabase Postgres (database) · Razorpay (payments) · Resend (optional email).

---

## What's where

| Path | What it is |
| --- | --- |
| `src/config/site.ts` | Brand name, contact email, Instagram, legal entity details, navigation. **Replace every `[placeholder]`.** |
| `src/config/portfolio.ts` | Hero film-wall clips and "Selected Work" films (video/poster paths). |
| `src/config/services.ts` | Services list, "Why AI" points, hero process steps. |
| `shared/config/packages.ts` | The three film packages: names, prices, durations, deliverables. Used by the site **and** the server's payment checks. |
| `shared/config/consultation.ts` | ₹99 fee, slot times, booking window, closed weekdays, hold time. |
| `src/sections/*` | Homepage sections. |
| `src/pages/legal/*` | Privacy Policy, Refund Policy, Terms & Conditions. |
| `src/pages/ProjectPayment.tsx` | Private payment page at `/pay/SPP-…`. |
| `api/*` | Serverless functions (order creation, payment verification, webhook, inquiries). |
| `supabase/migrations/*` | Database schema with Row Level Security. |
| `tests/*` | Unit tests for validation, slots, signatures and amounts. |

Brand colours are defined once in `src/index.css` (`--color-espresso`, `--color-cream`).

---

## Run locally

```bash
npm install
npm run dev          # UI only, at http://localhost:5173 — booking shows "not open yet"
```

For the full site with the API (bookings, payments, inquiries), use the Vercel CLI:

```bash
npm i -g vercel
vercel link
cp .env.example .env.local   # fill in test keys
vercel dev                   # http://localhost:3000
```

Other commands:

```bash
npm test             # unit tests
npm run typecheck    # TypeScript for app + API
npm run build        # production build into dist/
```

---

## Set up Supabase

1. Create a project at [supabase.com](https://supabase.com) (choose the Mumbai region for India).
2. Open **SQL Editor**, paste `supabase/migrations/20261126000000_init.sql`, and run it.
3. From **Project Settings → API**, copy the **Project URL** → `SUPABASE_URL` and the **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`.

Security: RLS is enabled on every table with no public policies, so the public (anon) key can't read or write anything. Only the serverless functions, using the service-role key, touch the data. Never put the service-role key in a `VITE_` variable.

If you change a package price in `shared/config/packages.ts`, also update the `package_price` check in the migration (run an `alter table` in SQL Editor).

## Set up Razorpay

1. In the Razorpay Dashboard (start in **Test Mode**), go to **Account & Settings → API Keys** and generate keys → `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
2. **Account & Settings → Payment Capture**: set payments to **auto-capture**, so successful payments are captured and not auto-refunded.
3. **Webhooks → Add new webhook**
   - URL: `https://YOUR-DOMAIN/api/razorpay/webhook`
   - Secret: any long random string → `RAZORPAY_WEBHOOK_SECRET`
   - Events: `payment.authorized`, `payment.captured`, `payment.failed`, `order.paid`
4. Test with Razorpay's test cards/UPI, then switch to **Live Mode** keys after KYC is approved.

How payments are protected:
- Orders are created on the server, and the amount comes from config or the database. The browser's amount is never trusted.
- Every payment's signature is verified (HMAC-SHA256), and the payment is re-checked with Razorpay (order, amount, status) before anything is confirmed.
- A booking is confirmed only after verification. There are no simulated successes.
- Repeat verify calls and webhook deliveries are idempotent: unique order/payment IDs, a webhook event log, and "already paid" checks.
- Double booking is blocked by a unique database index on active consultation slots. Unpaid slots are held for 15 minutes.

## Optional: email confirmations (Resend)

Create a [Resend](https://resend.com) account, verify your domain, then set `RESEND_API_KEY`, `EMAIL_FROM` (for example `STARPEAK Media <hello@your-domain.com>`) and `STUDIO_NOTIFY_EMAIL` (your inbox for new bookings and inquiries). Without these, everything still works and booking references are shown on screen.

---

## Deploy to Vercel

1. Push this folder to a GitHub repository and import it in Vercel. The framework is detected as Vite.
2. Add every variable from `.env.example` under **Settings → Environment Variables** (Production, plus Preview if you want).
3. Deploy, then add your domain and update:
   - `VITE_SITE_URL` and `SITE_URL` → `https://your-domain`, then redeploy.
   - The domain in `public/robots.txt` and `public/sitemap.xml`.
   - The Razorpay webhook URL.

`vercel.json` rewrites page routes to the SPA and leaves `/api/*` to the functions.

---

## Day-to-day operations

### Consultation bookings
Each paid booking appears in `consultation_bookings` with `status = confirmed`. A booking with `status = needs_attention` was paid, but its slot was taken while payment was processing. Contact that person to reschedule.

### Project inquiry → paid project
1. A new inquiry lands in `project_inquiries`. This is not a booking.
2. Discuss the brief and agree on scope, deliverables, timeline and payment terms **in writing**.
3. Create the project booking in **SQL Editor**:

```sql
insert into project_bookings (client_name, company_name, email, phone, package_name, package_price, project_scope, amount_due)
values (
  'Client Name', 'Brand Pvt Ltd', 'client@brand.com', '+919876543210',
  'Brand Story Film', 35000,
  'One brand film up to 5 minutes. Business visit on 2 Dec. Delivery by 20 Dec. Two revision rounds.',
  null              -- or an agreed advance in rupees, e.g. 15000
)
returning project_reference;
```

4. Send the client `https://your-domain/pay/<project_reference>`. They review the scope, accept the terms, and pay. The booking moves to `confirmed` / `paid` automatically.

`package_name` and `package_price` must match `shared/config/packages.ts`, otherwise the payment page refuses the booking.

---

## Before going live — checklist

- [ ] Replace every `[placeholder]` in `src/config/site.ts` (email, Instagram, legal entity, address, jurisdiction, privacy email).
- [ ] Review the legal pages in `src/pages/legal/`, fill their `[placeholders]`, and have them checked by a legal professional.
- [ ] Add real films and posters (`public/videos`, `public/posters`) and update `src/config/portfolio.ts`.
- [ ] Set consultation times and closed days in `shared/config/consultation.ts`.
- [ ] Run the Supabase migration, set all environment variables, and configure the Razorpay webhook.
- [ ] Make a full test-mode payment for a consultation and a project, then switch to live keys.
