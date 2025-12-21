-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Clinics Table
create table clinics (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text,
  address text,
  created_at timestamptz default now()
);

-- 2. Users (Doctors/Staff) - Linked to Supabase Auth
create table profiles (
  id uuid primary key references auth.users(id),
  clinic_id uuid references clinics(id) not null,
  role text check (role in ('doctor', 'receptionist', 'admin')) not null,
  full_name text,
  created_at timestamptz default now()
);

-- 3. Patients
create table patients (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid references clinics(id) not null,
  full_name text not null,
  phone text not null,
  age int,
  gender text,
  created_at timestamptz default now()
);

-- Index for searching patients by phone
create index patients_phone_idx on patients(phone);

-- 4. Appointments
create table appointments (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid references clinics(id) not null,
  patient_id uuid references patients(id),
  doctor_id uuid references profiles(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text check (status in ('booked', 'completed', 'cancelled', 'no_show')) default 'booked',
  notes text,
  created_at timestamptz default now()
);

-- 5. Clinical Notes (Visit History)
create table clinical_notes (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid references appointments(id) not null,
  diagnosis text,
  prescription text,
  follow_up_date date,
  created_at timestamptz default now()
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
alter table clinics enable row level security;
alter table profiles enable row level security;
alter table patients enable row level security;
alter table appointments enable row level security;
alter table clinical_notes enable row level security;

-- Policies (Simplified for MVP: Users can access data belonging to their clinic_id)

-- Helper function to get current user's clinic_id
create or replace function get_my_clinic_id()
returns uuid as $$
  select clinic_id from profiles where id = auth.uid()
$$ language sql security definer;

-- Clinics: Users can view their own clinic
create policy "Users can view their own clinic"
  on clinics for select
  using (id = get_my_clinic_id());

-- Profiles: Users can view profiles in their clinic
create policy "Users can view profiles in their clinic"
  on profiles for select
  using (clinic_id = get_my_clinic_id());

-- Patients: Users can view/edit patients in their clinic
create policy "Users can view patients in their clinic"
  on patients for select
  using (clinic_id = get_my_clinic_id());

create policy "Users can insert patients in their clinic"
  on patients for insert
  with check (clinic_id = get_my_clinic_id());

create policy "Users can update patients in their clinic"
  on patients for update
  using (clinic_id = get_my_clinic_id());

-- Appointments: Users can view/edit appointments in their clinic
create policy "Users can view appointments in their clinic"
  on appointments for select
  using (clinic_id = get_my_clinic_id());

create policy "Users can insert appointments in their clinic"
  on appointments for insert
  with check (clinic_id = get_my_clinic_id());

create policy "Users can update appointments in their clinic"
  on appointments for update
  using (clinic_id = get_my_clinic_id());

-- Clinical Notes: Users can view/edit notes in their clinic
-- (Note: We join via appointments to check clinic_id, or we could denormalize clinic_id to this table. 
-- For strict RLS, it's often safer to add clinic_id to every table. 
-- For MVP, let's add clinic_id to clinical_notes to make RLS easier and faster.)

alter table clinical_notes add column clinic_id uuid references clinics(id) default null; 
-- (We will enforce it being not null in app logic, or update schema to be not null)

create policy "Users can view notes in their clinic"
  on clinical_notes for select
  using (clinic_id = get_my_clinic_id());

create policy "Users can insert notes in their clinic"
  on clinical_notes for insert
  with check (clinic_id = get_my_clinic_id());

create policy "Users can update notes in their clinic"
  on clinical_notes for update
  using (clinic_id = get_my_clinic_id());
