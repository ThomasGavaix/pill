-- Migration: remplace les policies "anon" par des policies authentifiées
-- Seuls les utilisateurs connectés (via Google) peuvent accéder aux données

-- Profiles
drop policy if exists "Allow all for anon" on profiles;
create policy "Authenticated users only" on profiles
  for all to authenticated using (true) with check (true);

-- Medications
drop policy if exists "Allow all for anon" on medications;
create policy "Authenticated users only" on medications
  for all to authenticated using (true) with check (true);

-- Schedules
drop policy if exists "Allow all for anon" on schedules;
create policy "Authenticated users only" on schedules
  for all to authenticated using (true) with check (true);

-- Dose logs
drop policy if exists "Allow all for anon" on dose_logs;
create policy "Authenticated users only" on dose_logs
  for all to authenticated using (true) with check (true);

-- Push subscriptions
drop policy if exists "Allow all for anon" on push_subscriptions;
create policy "Authenticated users only" on push_subscriptions
  for all to authenticated using (true) with check (true);
