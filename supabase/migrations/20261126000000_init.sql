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
  -- Whole rupees. Must match shared/config/packages.ts — update both together.
  package_price       integer not null check (package_price in (20000, 35000, 49000)),
  -- Optional agreed advance in whole rupees. NULL = full package price.
  amount_due          integer check (amount_due is null or (amount_due > 0 and amount_due <= package_price)),
  project_scope       text not null check (char_length(project_scope) between 10 and 5000),
  payment_status      text not null default 'unpaid'
                        check (payment_status in ('unpaid', 'order_created', 'paid', 'failed', 'refunded')),
  status              text not null default 'awaiting_payment'
                        check (status in ('awaiting_payment', 'confirmed', 'in_production', 'completed', 'cancelled')),
  razorpay_order_id   text unique,
  razorpay_payment_id text unique,
  order_amount_paise  integer check (order_amount_paise is null or order_amount_paise > 0),
  terms_accepted_at   timestamptz,
  paid_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint project_confirmed_is_paid check (status not in ('confirmed', 'in_production', 'completed') or payment_status = 'paid')
);

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
alter table public.payment_events        enable row level security;

alter table public.project_inquiries     force row level security;
alter table public.consultation_bookings force row level security;
alter table public.project_bookings      force row level security;
alter table public.payment_events        force row level security;

revoke all on public.project_inquiries, public.consultation_bookings, public.project_bookings, public.payment_events
  from anon, authenticated;
revoke execute on function public.make_reference(text) from anon, authenticated, public;
grant execute on function public.make_reference(text) to service_role;
grant all on public.project_inquiries, public.consultation_bookings, public.project_bookings, public.payment_events
  to service_role;
