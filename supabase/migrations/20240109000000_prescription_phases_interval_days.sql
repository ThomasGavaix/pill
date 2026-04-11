-- Add interval_days to prescription_phases for recurrence support
-- (e.g. interval_days=2 means "take every 2 days" over duration_days total span)
alter table prescription_phases
  add column interval_days integer default null;
