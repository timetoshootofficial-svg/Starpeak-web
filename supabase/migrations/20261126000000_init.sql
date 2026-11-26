-- STARPEAK Media — initial schema
-- Run in Supabase: Dashboard → SQL Editor → paste → Run (or `supabase db push`).
--
-- Security model
--   * Row Level Security is ON for every table and NO policies are created,
--     so the public `anon` and `authenticated` roles cannot read or write
--     anything through the Supabase API.
--   * The website's serverless functions use the service-role key (server
--     only) for every read and write, after validating input.

create extension if not exists pgcrypto;

-- Readable, unguessable references: SPC-/SPP- + 10 chars (no 0/O/1/I).
create or replace function public.make_reference(prefix text)
returns text
language plpgsql
volatile
set search_path = public, extensions
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea := gen_random_bytes(10);
  out text := prefix || '-';
begin
  for i in 0..9 loop
    out := out || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return out;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Project inquiries (a request to talk — never a booking)
-- ---------------------------------------------------------------------------
create table if not exists public.project_inquiries (
  id                  uuid primary key default gen_random_uuid(),
  inquiry_reference   text not null unique,
  name                text not null check (char_length(name) between 2 and 100),
  company_name        text not null check (char_length(company_name) between 1 and 120),
  email               text not null check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' and char_length(email) <= 254),
  phone               text not null check (phone ~ '^\+?[0-9]{10,15}$'),
  selected_package    text not null check (char_length(selected_package) <= 80),
  project_description text not null check (char_length(project_description) between 20 and 3000),
  preferred_timeline  text not null check (char_length(preferred_timeline) <= 40),
  status              text not null default 'new'
                        check (status in ('new', 'contacted', 'scope_agreed', 'closed')),
  internal_notes      text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists project_inquiries_created_idx on public.project_inquiries (created_at desc);

-- ---------------------------------------------------------------------------
-- ₹99 consultation bookings
-- ---------------------------------------------------------------------------
create table if not exists public.consultation_bookings (
  id                         uuid primary key default gen_random_uuid(),
  booking_reference          text not null unique,
  name                       text not null check (char_length(name) between 2 and 100),
  email                      text not null check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' and char_length(email) <= 254),
  phone                      text not null check (phone ~ '^\+?[0-9]{10,15}$'),
  brand_name                 text not null check (char_length(brand_name) between 1 and 120),
  consultation_date          date not null,
  consultation_time          text not null check (consultation_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  brief_description          text not null check (char_length(brief_description) between 10 and 1500),
  consultation_fee           integer not null default 99 check (consultation_fee = 99),
  amount_paise               integer not null default 9900 check (amount_paise = consultation_fee * 100),
  payment_status             text not null default 'created'
                               check (payment_status in ('created', 'paid', 'failed', 'refunded')),
  status                     text not null default 'pending_payment'
                               check (status in ('pending_payment', 'confirmed', 'expired', 'cancelled', 'needs_attention')),
  razorpay_order_id          text unique,
  razorpay_payment_id        text unique,
  hold_expires_at            timestamptz not null,
  policies_accepted_at       timestamptz not null,
  paid_at                    timestamptz,
  confirmation_email_sent_at timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  -- A booking can only be confirmed once it is paid.
  constraint consultation_confirmed_is_paid check (status <> 'confirmed' or payment_status = 'paid')
);

-- Prevents double booking: one active (held or confirmed) booking per slot.
create unique index if not exists consultation_bookings_active_slot
  on public.consultation_bookings (consultation_date, consultation_time)
  where status in ('pending_payment', 'confirmed');

create index if not exists consultation_bookings_date_idx on public.consultation_bookings (consultation_date);

-- ---------------------------------------------------------------------------
-- Project bookings (created by the studio after scope is agreed in writing)
--
-- Payment terms: 50% advance to start, 50% balance after final delivery.
-- Status flow:
--   awaiting_advance → (advance paid) in_production
--   in_production    → (studio, after final delivery) awaiting_balance
--   awaiting_balance → (balance paid) completed
--   cancelled / refunded are set by the studio.
-- ---------------------------------------------------------------------------
create table if not exists public.project_bookings (
  id                  uuid primary key default gen_random_uuid(),
  project_reference   text not null unique default public.make_reference('SPP'),
  inquiry_id          uuid references public.project_inquiries (id) on delete set null,
  client_name         text not null check (char_length(client_name) between 2 and 100),
  company_name        text not null check (char_length(company_name) between 1 and 120),
  email               text not null check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  phone               text not null check (phone ~ '^\+?[0-9]{10,15}$'),
  package_name        text not null,
  -- Whole rupees. Must match src/shared/config/packages.ts — update both together.
  package_price       integer not null check (package_price in (20000, 35000, 49000)),
  project_scope       text not null check (char_length(project_scope) between 10 and 5000),
  status              text not null default 'awaiting_advance'
                        check (status in ('awaiting_advance', 'in_production', 'awaiting_balance', 'completed', 'cancelled', 'refunded')),
  terms_accepted_at   timestamptz,
  advance_paid_at     timestamptz,
  -- Set by the studio when work begins (brand discovery, scripting, a visit or production).
  -- Before this, the advance is fully refundable on request; after it, non-refundable.
  work_started_at     timestamptz,
  balance_paid_at     timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint project_started_needs_advance check (
    status not in ('in_production', 'awaiting_balance', 'completed') or advance_paid_at is not null),
  constraint project_completed_needs_balance check (status <> 'completed' or balance_paid_at is not null)
);

-- One row per Razorpay order for a project (advance or balance).
create table if not exists public.project_payments (
  id                  uuid primary key default gen_random_uuid(),
  booking_id          uuid not null references public.project_bookings (id) on delete restrict,
  stage               text not null check (stage in ('advance', 'balance')),
  amount_paise        integer not null check (amount_paise > 0),
  razorpay_order_id   text not null unique,
  razorpay_payment_id text unique,
  status              text not null default 'created' check (status in ('created', 'paid', 'failed', 'refunded')),
  paid_at             timestamptz,
  created_at          timestamptz not null default now(),
  constraint project_payment_paid_has_id check (status <> 'paid' or razorpay_payment_id is not null)
);

-- A booking can be paid only once per stage.
create unique index if not exists project_payments_one_paid_per_stage
  on public.project_payments (booking_id, stage) where status = 'paid';
create index if not exists project_payments_booking_idx on public.project_payments (booking_id);

-- ---------------------------------------------------------------------------
-- Razorpay webhook log (also stops the same event being processed twice)
-- ---------------------------------------------------------------------------
create table if not exists public.payment_events (
  event_id            text primary key,
  event               text not null,
  razorpay_order_id   text,
  razorpay_payment_id text,
  payload             jsonb not null,
  received_at         timestamptz not null default now()
);

create index if not exists payment_events_order_idx on public.payment_events (razorpay_order_id);

-- updated_at triggers
drop trigger if exists touch_project_inquiries on public.project_inquiries;
create trigger touch_project_inquiries before update on public.project_inquiries
  for each row execute function public.touch_updated_at();
drop trigger if exists touch_consultation_bookings on public.consultation_bookings;
create trigger touch_consultation_bookings before update on public.consultation_bookings
  for each row execute function public.touch_updated_at();
drop trigger if exists touch_project_bookings on public.project_bookings;
create trigger touch_project_bookings before update on public.project_bookings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: on, with no public policies.
-- ---------------------------------------------------------------------------
alter table public.project_inquiries     enable row level security;
alter table public.consultation_bookings enable row level security;
alter table public.project_bookings      enable row level security;
alter table public.project_payments      enable row level security;
alter table public.payment_events        enable row level security;

alter table public.project_inquiries     force row level security;
alter table public.consultation_bookings force row level security;
alter table public.project_bookings      force row level security;
alter table public.project_payments      force row level security;
alter table public.payment_events        force row level security;

revoke all on public.project_inquiries, public.consultation_bookings, public.project_bookings, public.project_payments, public.payment_events
  from anon, authenticated;
revoke execute on function public.make_reference(text) from anon, authenticated, public;
grant execute on function public.make_reference(text) to service_role;
grant all on public.project_inquiries, public.consultation_bookings, public.project_bookings, public.project_payments, public.payment_events
  to service_role;
