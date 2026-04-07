-- Prescriptions (ordonnances)
create table if not exists prescriptions (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  start_date date not null,
  notes text,
  created_at timestamptz default now()
);

-- Medications within a prescription
create table if not exists prescription_meds (
  id uuid primary key default uuid_generate_v4(),
  prescription_id uuid not null references prescriptions(id) on delete cascade,
  medication_id uuid references medications(id) on delete set null,
  name text not null,
  dosage text not null,
  unit text not null default 'comprimé(s)',
  color text not null default '#2563eb',
  display_order integer not null default 0,
  created_at timestamptz default now()
);

-- Phases: each phase defines a period (start_day → start_day + duration_days - 1)
create table if not exists prescription_phases (
  id uuid primary key default uuid_generate_v4(),
  prescription_med_id uuid not null references prescription_meds(id) on delete cascade,
  start_day integer not null default 1,
  duration_days integer not null default 1,
  created_at timestamptz default now()
);

-- Times: one or more doses per phase (time + quantity)
create table if not exists prescription_times (
  id uuid primary key default uuid_generate_v4(),
  phase_id uuid not null references prescription_phases(id) on delete cascade,
  time_of_day text not null,
  quantity text not null default '1',
  created_at timestamptz default now()
);

-- Add prescription_time_id to dose_logs
alter table dose_logs add column if not exists prescription_time_id uuid references prescription_times(id) on delete set null;
create index if not exists idx_dose_logs_presc_time_date on dose_logs(prescription_time_id, scheduled_date);

-- RLS
alter table prescriptions enable row level security;
alter table prescription_meds enable row level security;
alter table prescription_phases enable row level security;
alter table prescription_times enable row level security;

create policy "Authenticated users only" on prescriptions for all to authenticated using (true) with check (true);
create policy "Authenticated users only" on prescription_meds for all to authenticated using (true) with check (true);
create policy "Authenticated users only" on prescription_phases for all to authenticated using (true) with check (true);
create policy "Authenticated users only" on prescription_times for all to authenticated using (true) with check (true);

-- Indexes
create index if not exists idx_prescriptions_profile on prescriptions(profile_id);
create index if not exists idx_prescription_meds_prescription on prescription_meds(prescription_id);
create index if not exists idx_prescription_phases_med on prescription_phases(prescription_med_id);
create index if not exists idx_prescription_times_phase on prescription_times(phase_id);
