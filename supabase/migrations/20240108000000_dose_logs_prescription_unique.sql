-- Add unique constraint for prescription-based dose logs (used by upsert onConflict)
alter table dose_logs
  add constraint dose_logs_prescription_time_date_unique
  unique (prescription_time_id, scheduled_date);
