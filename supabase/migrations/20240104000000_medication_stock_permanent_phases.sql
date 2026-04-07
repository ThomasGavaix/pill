-- Add stock tracking to medications
alter table medications add column if not exists stock_count integer;

-- Allow prescription phases without an end date (permanent treatments)
alter table prescription_phases alter column duration_days drop not null;
