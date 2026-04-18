-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drivers table
create type user_role as enum ('driver', 'boss');
create table drivers (
  id uuid primary key default uuid_generate_v4(),
  auth_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  phone text not null unique,
  base_salary numeric not null default 3000,
  meal_rate numeric not null default 15,
  dental_allowance numeric not null default 300,
  medical_allowance numeric not null default 300,
  ot_rate numeric not null default 10,
  role user_role not null default 'driver',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Attendance table
create table attendance (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid not null references drivers(id) on delete cascade,
  date date not null,
  clock_in_at timestamptz not null,
  clock_out_at timestamptz,
  clock_in_lat double precision,
  clock_in_lng double precision,
  clock_out_lat double precision,
  clock_out_lng double precision,
  hours_worked numeric generated always as (
    case
      when clock_out_at is not null
      then extract(epoch from (clock_out_at - clock_in_at)) / 3600.0
      else null
    end
  ) stored,
  created_at timestamptz not null default now(),
  unique(driver_id, date)
);

-- Claims table
create type claim_type as enum ('meal', 'toll', 'dental', 'medical', 'other');
create type claim_status as enum ('approved', 'rejected');
create table claims (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid not null references drivers(id) on delete cascade,
  date date not null,
  type claim_type not null,
  amount numeric not null check (amount >= 0),
  receipt_url text,
  status claim_status not null default 'approved',
  rejection_reason text,
  created_at timestamptz not null default now()
);

-- Payroll snapshots table
create table payroll_snapshots (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid not null references drivers(id) on delete cascade,
  month int not null check (month between 1 and 12),
  year int not null,
  base_salary numeric not null,
  days_worked int not null default 0,
  total_hours numeric not null default 0,
  ot_hours numeric not null default 0,
  ot_pay numeric not null default 0,
  meal_total numeric not null default 0,
  toll_total numeric not null default 0,
  dental_allowance numeric not null default 0,
  medical_allowance numeric not null default 0,
  gross_pay numeric not null default 0,
  payslip_pdf_url text,
  generated_at timestamptz not null default now(),
  locked boolean not null default false,
  unique(driver_id, month, year)
);

-- Row Level Security
alter table drivers enable row level security;
alter table attendance enable row level security;
alter table claims enable row level security;
alter table payroll_snapshots enable row level security;

-- Drivers: each driver sees only themselves; boss sees all
create policy "driver_read_own" on drivers
  for select using (auth.uid() = auth_id);

create policy "boss_read_all_drivers" on drivers
  for all using (
    exists (
      select 1 from drivers d where d.auth_id = auth.uid() and d.role = 'boss'
    )
  );

-- Attendance: driver reads own; boss reads all
create policy "driver_read_own_attendance" on attendance
  for select using (
    driver_id in (select id from drivers where auth_id = auth.uid())
  );

create policy "driver_insert_own_attendance" on attendance
  for insert with check (
    driver_id in (select id from drivers where auth_id = auth.uid())
  );

create policy "driver_update_own_attendance" on attendance
  for update using (
    driver_id in (select id from drivers where auth_id = auth.uid())
  );

create policy "boss_all_attendance" on attendance
  for all using (
    exists (
      select 1 from drivers d where d.auth_id = auth.uid() and d.role = 'boss'
    )
  );

-- Claims: driver reads/inserts own; boss reads all, can update status
create policy "driver_read_own_claims" on claims
  for select using (
    driver_id in (select id from drivers where auth_id = auth.uid())
  );

create policy "driver_insert_own_claims" on claims
  for insert with check (
    driver_id in (select id from drivers where auth_id = auth.uid())
  );

create policy "boss_all_claims" on claims
  for all using (
    exists (
      select 1 from drivers d where d.auth_id = auth.uid() and d.role = 'boss'
    )
  );

-- Payroll snapshots: driver reads own; boss manages all
create policy "driver_read_own_payroll" on payroll_snapshots
  for select using (
    driver_id in (select id from drivers where auth_id = auth.uid())
  );

create policy "boss_all_payroll" on payroll_snapshots
  for all using (
    exists (
      select 1 from drivers d where d.auth_id = auth.uid() and d.role = 'boss'
    )
  );
