-- Supabase schema for Sport Equipment Borrowing System
-- Run in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- ============================================================================
-- DROP EXISTING TABLES (if they exist) - REQUIRED for clean install
-- ============================================================================
drop table if exists public.return_transactions cascade;
drop table if exists public.condition_logs cascade;
drop table if exists public.borrow_transactions cascade;
drop table if exists public.borrowers cascade;
drop table if exists public.equipment cascade;
drop table if exists public.profiles cascade;

-- ============================================================================
-- PROFILES TABLE (users with roles)
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  role text not null default 'user' check (role in ('admin', 'staff', 'user')),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- EQUIPMENT TABLE
-- ============================================================================
create table if not exists public.equipment (
  id bigint generated always as identity primary key,
  equipment_code varchar(50) not null unique,
  equipment_name varchar(150) not null,
  category varchar(100) not null,
  total_quantity integer not null default 0 check (total_quantity >= 0),
  available_quantity integer not null default 0 check (available_quantity >= 0),
  condition_status varchar(50) not null default 'Good' check (condition_status in ('Good', 'Slightly Damaged', 'Needs Repair')),
  image_url text,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- BORROWERS TABLE (detailed borrower information)
-- ============================================================================
create table if not exists public.borrowers (
  id bigint generated always as identity primary key,
  borrower_name varchar(150) not null,
  id_number varchar(50) not null unique,
  department_course varchar(150),
  contact_number varchar(30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- BORROW TRANSACTIONS TABLE
-- ============================================================================
create table if not exists public.borrow_transactions (
  id bigint generated always as identity primary key,
  borrower_id bigint not null references public.borrowers(id) on delete cascade,
  equipment_id bigint not null references public.equipment(id) on delete cascade,
  quantity_borrowed integer not null check (quantity_borrowed > 0),
  purpose text,
  borrow_date date not null,
  expected_return_date date not null,
  approved_by varchar(150),
  checked_by varchar(150),
  condition_before varchar(50) default 'Good' check (condition_before in ('Good', 'Slightly Damaged', 'Needs Repair')),
  remarks_before text,
  agreement_accepted boolean default false,
  status varchar(50) not null default 'Pending' check (status in ('Pending', 'Approved', 'Borrowed', 'Returned', 'Overdue', 'Damaged', 'Lost', 'Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- RETURN TRANSACTIONS TABLE
-- ============================================================================
create table if not exists public.return_transactions (
  id bigint generated always as identity primary key,
  borrow_transaction_id bigint not null references public.borrow_transactions(id) on delete cascade,
  return_date date,
  returned_quantity integer,
  condition_after varchar(50) default 'Good' check (condition_after in ('Good', 'Damaged', 'Lost')),
  remarks_after text,
  checked_by varchar(150),
  is_late boolean default false,
  overdue_charge numeric(10,2) default 0,
  damage_charge numeric(10,2) default 0,
  penalty_amount numeric(10,2) default 0,
  final_status varchar(50) default 'Returned' check (final_status in ('Returned', 'Damaged', 'Lost')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure new charge breakdown columns exist on existing databases.
alter table if exists public.return_transactions
  add column if not exists overdue_charge numeric(10,2) default 0;

alter table if exists public.return_transactions
  add column if not exists damage_charge numeric(10,2) default 0;

-- ============================================================================
-- CONDITION LOGS TABLE
-- ============================================================================
create table if not exists public.condition_logs (
  id bigint generated always as identity primary key,
  equipment_id bigint not null references public.equipment(id) on delete cascade,
  transaction_type varchar(50),
  condition_status varchar(50),
  notes text,
  checked_by varchar(150),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
create index if not exists idx_equipment_code on public.equipment(equipment_code);
create index if not exists idx_equipment_category on public.equipment(category);
create index if not exists idx_borrowers_id_number on public.borrowers(id_number);
create index if not exists idx_borrow_transactions_borrower on public.borrow_transactions(borrower_id);
create index if not exists idx_borrow_transactions_equipment on public.borrow_transactions(equipment_id);
create index if not exists idx_borrow_transactions_status on public.borrow_transactions(status);
create index if not exists idx_return_transactions_borrow on public.return_transactions(borrow_transaction_id);
create index if not exists idx_condition_logs_equipment on public.condition_logs(equipment_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.equipment enable row level security;
alter table public.borrowers enable row level security;
alter table public.borrow_transactions enable row level security;
alter table public.return_transactions enable row level security;
alter table public.condition_logs enable row level security;

-- PROFILES POLICIES
create policy "profiles_read_own" on public.profiles
for select to authenticated
using (id = auth.uid());

create policy "profiles_upsert_own" on public.profiles
for all to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "profiles_read_admin" on public.profiles
for select to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
);

-- EQUIPMENT POLICIES
create policy "equipment_read_all" on public.equipment
for select to authenticated
using (true);

create policy "equipment_write_admin" on public.equipment
for all to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- BORROWERS POLICIES
create policy "borrowers_read_admin_staff" on public.borrowers
for select to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
);

create policy "borrowers_write_admin" on public.borrowers
for all to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- BORROW TRANSACTIONS POLICIES
create policy "borrow_transactions_read_admin_staff" on public.borrow_transactions
for select to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
);

create policy "borrow_transactions_write_admin_staff" on public.borrow_transactions
for all to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
);

-- RETURN TRANSACTIONS POLICIES
create policy "return_transactions_read_admin_staff" on public.return_transactions
for select to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
);

create policy "return_transactions_write_admin_staff" on public.return_transactions
for all to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
);

-- CONDITION LOGS POLICIES
create policy "condition_logs_read_admin_staff" on public.condition_logs
for select to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
);

create policy "condition_logs_write_admin_staff" on public.condition_logs
for insert to authenticated
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
);

-- ============================================================================
-- SUPABASE STORAGE (EQUIPMENT IMAGES)
-- ============================================================================

-- Create bucket for equipment images (public read)
insert into storage.buckets (id, name, public)
values ('equipment-images', 'equipment-images', true)
on conflict (id) do nothing;

-- Replace policies safely for idempotent reruns
drop policy if exists "equipment_images_insert_authenticated" on storage.objects;
drop policy if exists "equipment_images_select_public" on storage.objects;

-- Allow authenticated users to upload to equipment-images bucket
create policy "equipment_images_insert_authenticated" on storage.objects
for insert to authenticated
with check (bucket_id = 'equipment-images');

-- Allow public (and authenticated) read for equipment-images objects
create policy "equipment_images_select_public" on storage.objects
for select to public
using (bucket_id = 'equipment-images');

