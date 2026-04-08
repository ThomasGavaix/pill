-- medication_id is null for prescription-based doses (linked via prescription_time_id)
alter table dose_logs alter column medication_id drop not null;
