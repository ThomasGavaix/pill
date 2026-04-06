-- PilulierFamille Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  avatar_color text not null default '#2563eb',
  avatar_emoji text not null default '👤',
  created_at timestamptz default now()
);

-- Medications table
create table if not exists medications (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  dosage text not null,
  unit text not null default 'comprimé(s)',
  color text not null default '#2563eb',
  notes text,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- Schedules table (recurring reminders)
create table if not exists schedules (
  id uuid primary key default uuid_generate_v4(),
  medication_id uuid not null references medications(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  time_of_day text not null, -- HH:MM format
  days_of_week integer[] not null default '{0,1,2,3,4,5,6}', -- 0=Sunday
  active boolean not null default true,
  created_at timestamptz default now()
);

-- Dose logs table (track taken/missed doses)
create table if not exists dose_logs (
  id uuid primary key default uuid_generate_v4(),
  schedule_id uuid references schedules(id) on delete set null,
  medication_id uuid not null references medications(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  scheduled_date date not null,
  scheduled_time text not null,
  taken_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'taken', 'missed', 'skipped')),
  created_at timestamptz default now(),
  unique(schedule_id, scheduled_date)
);

-- Push subscriptions table
create table if not exists push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

-- Row Level Security (disable for simplicity - enable in production with auth)
alter table profiles enable row level security;
alter table medications enable row level security;
alter table schedules enable row level security;
alter table dose_logs enable row level security;
alter table push_subscriptions enable row level security;

-- Allow all for anon (family app without user auth - adjust for production)
create policy "Allow all for anon" on profiles for all to anon using (true) with check (true);
create policy "Allow all for anon" on medications for all to anon using (true) with check (true);
create policy "Allow all for anon" on schedules for all to anon using (true) with check (true);
create policy "Allow all for anon" on dose_logs for all to anon using (true) with check (true);
create policy "Allow all for anon" on push_subscriptions for all to anon using (true) with check (true);

-- Indexes for performance
create index if not exists idx_medications_profile on medications(profile_id);
create index if not exists idx_schedules_medication on schedules(medication_id);
create index if not exists idx_schedules_profile on schedules(profile_id);
create index if not exists idx_dose_logs_profile_date on dose_logs(profile_id, scheduled_date);
create index if not exists idx_dose_logs_schedule_date on dose_logs(schedule_id, scheduled_date);
